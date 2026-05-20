import logging

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.exceptions import AuthenticationFailed, NotAuthenticated, PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from config.response import build_response_payload

logger = logging.getLogger(__name__)


def global_exception_handler(exc, context):
    response = drf_exception_handler(exc, context)

    if response is not None:
        detail = response.data
        message = "Request failed"

        if isinstance(detail, dict):
            if "detail" in detail:
                message = str(detail.get("detail"))
            else:
                first_key = next(iter(detail), None)
                if first_key:
                    first_value = detail[first_key]
                    if isinstance(first_value, list) and first_value:
                        message = str(first_value[0])
                    else:
                        message = str(first_value)
        elif isinstance(detail, list) and detail:
            message = str(detail[0])
        elif detail:
            message = str(detail)

        response.data = build_response_payload(False, message, None, detail)
        return response

    if isinstance(exc, (ValidationError, DjangoValidationError)):
        return Response(
            build_response_payload(False, "Validation failed", None, getattr(exc, "message_dict", None) or str(exc)),
            status=status.HTTP_400_BAD_REQUEST,
        )

    if isinstance(exc, (AuthenticationFailed, NotAuthenticated)):
        return Response(
            build_response_payload(False, "Authentication required", None, str(exc)),
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if isinstance(exc, PermissionDenied):
        return Response(
            build_response_payload(False, "Permission denied", None, str(exc)),
            status=status.HTTP_403_FORBIDDEN,
        )

    logger.exception("Unhandled server error", exc_info=exc)
    return Response(
        build_response_payload(False, "Internal server error", None, None),
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def custom_exception_handler(exc, context):
    return global_exception_handler(exc, context)
