from django.contrib.auth import authenticate, password_validation
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from accounts.models import OTPCode, PasswordResetToken, User
from accounts.utils import sanitize_text
from config.cache_utils import record_security_failure_event


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    isPrime = serializers.SerializerMethodField()
    onboardingRequired = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "role",
            "subscription",
            "is_verified",
            "profile_complete",
            "company_name",
            "hr_name",
            "company_details",
            "date_joined",
            "isPrime",
            "onboardingRequired",
        ]

    def get_name(self, obj):
        full_name = obj.get_full_name().strip()
        return full_name or obj.username

    def get_isPrime(self, obj):
        return obj.is_prime_admin

    def get_onboardingRequired(self, obj):
        if obj.is_admin_user:
            return False
        return not obj.is_verified or not (obj.subscription or "").strip() or obj.subscription == "free"


class RegisterSerializer(serializers.ModelSerializer):
    name = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message="An account with this email already exists",
            )
        ]
    )
    password = serializers.CharField(write_only=True, style={"input_type": "password"})
    confirmPassword = serializers.CharField(write_only=True)
    fullName = serializers.CharField(write_only=True, required=False)
    agree = serializers.BooleanField(write_only=True, required=False)
    dob = serializers.CharField(write_only=True, required=False, allow_blank=True)
    gender = serializers.CharField(write_only=True, required=False, allow_blank=True)
    nationality = serializers.CharField(write_only=True, required=False, allow_blank=True)
    country = serializers.CharField(write_only=True, required=False, allow_blank=True)
    state = serializers.CharField(write_only=True, required=False, allow_blank=True)
    city = serializers.CharField(write_only=True, required=False, allow_blank=True)
    highestQualification = serializers.CharField(write_only=True, required=False, allow_blank=True)
    careerInterest = serializers.CharField(write_only=True, required=False, allow_blank=True)
    companyName = serializers.CharField(write_only=True, required=False, allow_blank=True, source="company_name")
    hrName = serializers.CharField(write_only=True, required=False, allow_blank=True, source="hr_name")
    companyDetails = serializers.CharField(write_only=True, required=False, allow_blank=True, source="company_details")

    class Meta:
        model = User
        fields = [
            "name",
            "fullName",
            "email",
            "password",
            "confirmPassword",
            "agree",
            "phone",
            "role",
            "company_name",
            "hr_name",
            "company_details",
            "companyName",
            "hrName",
            "companyDetails",
            "dob",
            "gender",
            "nationality",
            "country",
            "state",
            "city",
            "highestQualification",
            "careerInterest",
        ]

    def validate_name(self, value):
        return sanitize_text(value)

    def validate_fullName(self, value):
        return sanitize_text(value)

    def validate_email(self, value):
        return value.strip().lower()

    def validate_phone(self, value):
        return sanitize_text(value)

    def validate_role(self, value):
        return value or "student"

    def validate(self, attrs):
        if not attrs.get("name") and not attrs.get("fullName"):
            raise serializers.ValidationError({"name": "Name is required"})

        if attrs.get("password") != attrs.get("confirmPassword"):
            raise serializers.ValidationError({"confirmPassword": "Passwords do not match"})

        temp_user = User(email=attrs.get("email"), username=attrs.get("email", ""))
        password_validation.validate_password(attrs.get("password"), temp_user)
        return attrs

    def create(self, validated_data):
        name = validated_data.pop("name", None) or validated_data.pop("fullName", "")
        first_name, *rest = name.split(" ", 1)
        last_name = rest[0] if rest else ""
        user = User(
            username=validated_data["email"],
            email=validated_data["email"],
            first_name=first_name,
            last_name=last_name,
            role=validated_data.get("role", "student"),
            phone=validated_data.get("phone", ""),
            company_name=sanitize_text(validated_data.get("company_name", "")),
            hr_name=sanitize_text(validated_data.get("hr_name", "")),
            company_details=sanitize_text(validated_data.get("company_details", "")),
            is_verified=False,
            profile_complete=True,
        )
        user.set_password(validated_data["password"])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    requestedRole = serializers.ChoiceField(choices=["student", "employer"], required=False)

    def validate_email(self, value):
        return value.strip().lower()

    def validate(self, attrs):
        user = authenticate(username=attrs["email"], password=attrs["password"])
        if not user:
            request = self.context.get("request")
            if request is not None:
                record_security_failure_event(request.META.get("REMOTE_ADDR", ""))
            raise serializers.ValidationError("Invalid email or password")
        attrs["user"] = user
        return attrs


class SendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)
    type = serializers.ChoiceField(choices=["email", "phone", "password_reset"])

    def validate(self, attrs):
        otp_type = attrs.get("type")
        email = attrs.get("email")
        phone = attrs.get("phone")

        if otp_type in {"email", "password_reset"} and not email:
            raise serializers.ValidationError({"email": "Email is required for this OTP type"})
        if otp_type == "phone" and not phone:
            raise serializers.ValidationError({"phone": "Phone is required for this OTP type"})

        return attrs


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False)
    otp = serializers.CharField(min_length=6, max_length=6)
    type = serializers.ChoiceField(choices=["email", "phone", "password_reset"])


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    newPassword = serializers.CharField(min_length=8)

    def validate(self, attrs):
        temp_user = self.context.get("user") or User(email="reset@example.com", username="reset@example.com")
        password_validation.validate_password(attrs.get("newPassword"), temp_user)
        return attrs


class RefreshSerializer(serializers.Serializer):
    refreshToken = serializers.CharField()


class GoogleLoginSerializer(serializers.Serializer):
    idToken = serializers.CharField()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = [
            "name",
            "email",
            "first_name",
            "last_name",
            "phone",
            "company_name",
            "hr_name",
            "company_details",
            "subscription",
            "role",
            "is_verified",
            "profile_complete",
        ]

    def update(self, instance, validated_data):
        name = validated_data.pop("name", None)
        if name:
            clean_name = sanitize_text(name)
            first_name, *rest = clean_name.split(" ", 1)
            instance.first_name = first_name
            instance.last_name = rest[0] if rest else ""

        for field, value in validated_data.items():
            if isinstance(value, str):
                value = sanitize_text(value)
            setattr(instance, field, value)
        instance.save()
        return instance
