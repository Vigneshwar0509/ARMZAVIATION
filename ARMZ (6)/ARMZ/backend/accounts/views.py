import logging

from django.conf import settings
from django.db import IntegrityError
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole, AuthenticatedOrRaise403
from accounts.serializers import (
    ForgotPasswordSerializer,
    GoogleLoginSerializer,
    LoginSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    SendOTPSerializer,
    UserSerializer,
    VerifyOTPSerializer,
)
from accounts import services as account_services

logger = logging.getLogger(__name__)
from config.auth_cookies import clear_auth_cookies, set_auth_cookies
from config.response import build_response_payload
from config.throttling import (
    AuthLoginRateThrottle,
    AuthRegisterRateThrottle,
    PasswordResetRateThrottle,
    OTPRateThrottle,
    OTPVerifyRateThrottle,
    BruteForceProtectionThrottle,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRegisterRateThrottle]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payload, refresh = account_services.register_user(serializer)
        except IntegrityError:
            raise ValidationError({"email": "An account with this email already exists"})
        response = Response(payload, status=status.HTTP_201_CREATED)
        return set_auth_cookies(response, refresh)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthLoginRateThrottle, BruteForceProtectionThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        payload, refresh = account_services.login_user(serializer.validated_data["user"])
        response = Response(
            build_response_payload(
                success=True,
                message="Login successful",
                data=payload,
                errors=None,
            )
        )
        return set_auth_cookies(response, refresh)


class AdminLoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthLoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        try:
            payload = account_services.admin_login_payload(serializer.validated_data["user"])
        except Exception as exc:
            logger.exception("Admin login failed for email %s", request.data.get("email"))
            raise

        response_data = {
            "user": payload.get("user"),
            "requiresOTP": payload.get("requiresOTP"),
        }
        if payload.get("token"):
            response_data["token"] = payload.get("token")
        if payload.get("refreshToken"):
            response_data["refreshToken"] = payload.get("refreshToken")

        return Response(
            build_response_payload(
                success=True,
                message=payload.get("message", "Admin login successful"),
                data=response_data,
                errors=None,
            )
        )


class SendOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPRateThrottle]

    def post(self, request):
        try:
            serializer = SendOTPSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            payload = account_services.send_otp(serializer.validated_data)
            return Response(
                build_response_payload(
                    success=True,
                    message=payload.get("message", "OTP sent successfully"),
                    data=payload,
                    errors=None,
                )
            )
        except ValidationError as e:
            logger.warning("SendOTP validation error: %s", str(e))
            return Response(
                build_response_payload(
                    success=False,
                    message="Invalid request data",
                    data=None,
                    errors=e.detail if hasattr(e, 'detail') else str(e),
                ),
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error("SendOTP endpoint error: %s", str(e))
            return Response(
                build_response_payload(
                    success=False,
                    message="Failed to send OTP. Please try again later.",
                    data=None,
                    errors=str(e),
                ),
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [OTPVerifyRateThrottle]

    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = account_services.verify_otp(serializer.validated_data)
        if isinstance(result, tuple):
            payload, refresh = result
            response = Response(
                build_response_payload(
                    success=True,
                    message=payload.get("message", "OTP verified successfully"),
                    data=payload,
                    errors=None,
                )
            )
            return set_auth_cookies(response, refresh)

        return Response(
            build_response_payload(
                success=True,
                message="OTP verified successfully",
                data=result,
                errors=None,
            )
        )


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(account_services.send_password_reset(serializer.validated_data["email"]))


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [PasswordResetRateThrottle]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            account_services.reset_password(
                token=serializer.validated_data["token"],
                new_password=serializer.validated_data["newPassword"],
            )
        )


class RefreshTokenView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refreshToken") or request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if not refresh_token:
            raise ValidationError({"refreshToken": "Refresh token is required"})

        payload, refresh = account_services.refresh_access_token(refresh_token)
        response = Response(
            build_response_payload(
                success=True,
                message="Token refreshed",
                data=payload,
                errors=None,
            )
        )
        return set_auth_cookies(response, refresh)


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refreshToken") or request.COOKIES.get(settings.AUTH_COOKIE_REFRESH)
        if refresh_token:
            try:
                account_services.refresh_access_token(refresh_token)[1].blacklist()
            except Exception:
                pass
        response = Response(
            build_response_payload(
                success=True,
                message="Logged out successfully",
                data=None,
                errors=None,
            )
        )
        return clear_auth_cookies(response)


class ProfileView(APIView):
    permission_classes = [AuthenticatedOrRaise403]

    def get(self, request):
        return Response(
            build_response_payload(
                success=True,
                message="Success",
                data=account_services.profile_payload(request.user),
                errors=None,
            )
        )

    def put(self, request):
        serializer = ProfileUpdateSerializer(instance=request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        return Response(account_services.update_profile(serializer))

    def delete(self, request):
        request.user.delete()
        return Response({"message": "Account deleted successfully"})


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload, refresh = account_services.google_login(serializer.validated_data["idToken"])
        response = Response(
            build_response_payload(
                success=True,
                message="Google login successful",
                data=payload,
                errors=None,
            )
        )
        return set_auth_cookies(response, refresh)


class UsersView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        users = account_services.list_users()
        return Response({"data": UserSerializer(users, many=True).data})


class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, user_id):
        user = account_services.get_user_or_404(user_id)
        serializer = ProfileUpdateSerializer(instance=user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"data": UserSerializer(user).data})

    def delete(self, request, user_id):
        account_services.get_user_or_404(user_id).delete()
        return Response({"data": {"success": True}})


class UpdateSubscriptionView(APIView):
    permission_classes = [AuthenticatedOrRaise403]

    def post(self, request):
        payload = account_services.update_subscription(
            request_user=request.user,
            user_id=request.data.get("userId"),
            plan_id=request.data.get("planId"),
        )
        return Response(payload)


class AdminsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def get(self, request):
        account_services.ensure_prime_admin(request)
        return Response({"data": account_services.list_admins()})

    def post(self, request):
        account_services.ensure_prime_admin(request)
        serializer = ResetPasswordSerializer(data={"token": "bootstrap", "newPassword": request.data.get("password", "")})
        serializer.is_valid(raise_exception=True)
        return Response({"data": account_services.create_admin(request.data)}, status=status.HTTP_201_CREATED)


class AdminDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def put(self, request, admin_id):
        account_services.ensure_prime_admin(request)
        if request.data.get("password"):
            serializer = ResetPasswordSerializer(data={"token": "bootstrap", "newPassword": request.data.get("password", "")})
            serializer.is_valid(raise_exception=True)
        return Response({"data": account_services.update_admin(admin_id, request.data)})

    def delete(self, request, admin_id):
        account_services.ensure_prime_admin(request)
        return Response({"data": account_services.delete_admin(admin_id)})


class VerifyUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdminRole]

    def post(self, request, user_id):
        user = account_services.get_user_or_404(user_id)
        # Accept either explicit boolean or status string
        if "is_verified" in request.data:
            is_verified = request.data.get("is_verified")
        else:
            status_val = str(request.data.get("status", "")).lower()
            is_verified = status_val == "active"

        user.is_verified = bool(is_verified)
        user.save(update_fields=["is_verified"])
        return Response({"data": UserSerializer(user).data})


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def csrf_cookie(request):
    return Response({"message": "CSRF cookie set"})
