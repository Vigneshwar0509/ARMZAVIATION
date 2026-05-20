from rest_framework.response import Response


def build_response_payload(success, message="Success", data=None, errors=None):
    return {
        "success": success,
        "message": message,
        "data": data,
        "errors": errors,
    }


def success_response(data=None, message="Success", status_code=200):
    return Response(build_response_payload(True, message, data, None), status=status_code)


def error_response(message="Request failed", status_code=400, data=None, errors=None):
    return Response(build_response_payload(False, message, data, errors), status=status_code)
