import re

from datetime import timedelta
from urllib.parse import urlencode

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from .models import (
    Family,
    FamilyMember,
    RegistrationInvitation,
    FamilyRegistration,
    FamilyRegistrationMember,
)


# ==========================================
# PHONE NUMBER VALIDATION
# ==========================================

def normalize_phone(value):

    value = re.sub(r"[\s()-]", "", value or "")

    if not value:
        return ""

    if not re.fullmatch(r"\+?[0-9]{10,15}", value):
        raise serializers.ValidationError(
            "Enter a valid mobile number."
        )

    if len(value) == 10 and value.isdigit():
        value = "+91" + value

    elif len(value) == 12 and value.startswith("91"):
        value = "+" + value

    if len(value) > 15:
        raise serializers.ValidationError(
            "Mobile number is too long."
        )

    return value


# ==========================================
# EXISTING FAMILY MEMBER SERIALIZER
# ==========================================

class FamilyMemberSerializer(serializers.ModelSerializer):

    family_name = serializers.CharField(
        source="family.family_head",
        read_only=True
    )

    class Meta:

        model = FamilyMember

        fields = [
            "id",
            "family",
            "family_name",
            "full_name",
            "relationship",
            "gender",
            "date_of_birth",
            "mobile_number",
            "occupation",
            "is_baptized",
            "is_active",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
        ]


# ==========================================
# EXISTING FAMILY SERIALIZER
# ==========================================

class FamilySerializer(serializers.ModelSerializer):

    members = FamilyMemberSerializer(
        many=True,
        read_only=True
    )

    total_members = serializers.SerializerMethodField()

    class Meta:

        model = Family

        fields = [
            "id",
            "family_id",
            "family_head",
            "mobile_number",
            "whatsapp_number",
            "email",
            "address",
            "photo",
            "joining_date",
            "is_active",
            "notes",
            "total_members",
            "members",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "family_id",
            "created_at",
            "updated_at",
        ]

    def get_total_members(self, obj):

        return obj.members.filter(
            is_active=True
        ).count() + 1


# ==========================================
# REGISTRATION INVITATION SERIALIZER
# ==========================================

class RegistrationInvitationSerializer(
    serializers.ModelSerializer
):

    validity_days = serializers.IntegerField(
        min_value=1,
        max_value=30,
        default=7,
        write_only=True
    )

    registration_link = serializers.SerializerMethodField()

    invitation_status = serializers.CharField(
        read_only=True
    )

    created_by_name = serializers.CharField(
        source="created_by.username",
        read_only=True,
        default=""
    )

    class Meta:

        model = RegistrationInvitation

        fields = [
            "id",
            "invitation_id",
            "title",
            "invited_name",
            "invited_mobile",
            "validity_days",
            "registration_link",
            "invitation_status",
            "is_active",
            "is_used",
            "expires_at",
            "used_at",
            "created_by_name",
            "created_at",
        ]

        read_only_fields = [
            "id",
            "invitation_id",
            "registration_link",
            "invitation_status",
            "is_active",
            "is_used",
            "expires_at",
            "used_at",
            "created_by_name",
            "created_at",
        ]

    def validate_invited_mobile(self, value):

        return normalize_phone(value)

    def get_registration_link(self, obj):

        if not obj.is_valid:
            return None

        frontend_url = getattr(
            settings,
            "FRONTEND_URL",
            "http://localhost:5173"
        ).rstrip("/")

        query = urlencode({
            "token": obj.token
        })

        return (
            f"{frontend_url}/register-family?"
            f"{query}"
        )

    def create(self, validated_data):

        validity_days = validated_data.pop(
            "validity_days",
            7
        )

        return RegistrationInvitation.objects.create(

            **validated_data,

            created_by=self.context["request"].user,

            expires_at=(
                timezone.now()
                + timedelta(days=validity_days)
            )

        )


# ==========================================
# REGISTRATION MEMBER SERIALIZER
# ==========================================

class FamilyRegistrationMemberSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = FamilyRegistrationMember

        fields = [
            "id",
            "full_name",
            "relationship",
            "gender",
            "date_of_birth",
            "mobile_number",
            "occupation",
            "is_baptized",
        ]

        read_only_fields = ["id"]

    def validate_full_name(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Member name is required."
            )

        return value

    def validate_mobile_number(self, value):

        return normalize_phone(value)

    def validate_date_of_birth(self, value):

        if value and value > timezone.localdate():

            raise serializers.ValidationError(
                "Date of birth cannot be in the future."
            )

        return value


# ==========================================
# PUBLIC FAMILY REGISTRATION SERIALIZER
# ==========================================

class PublicFamilyRegistrationSerializer(
    serializers.ModelSerializer
):

    token = serializers.CharField(
        write_only=True,
        max_length=64
    )

    members = FamilyRegistrationMemberSerializer(
        many=True,
        required=False
    )

    consent_given = serializers.BooleanField(
        required=True
    )

    class Meta:

        model = FamilyRegistration

        fields = [
            "token",
            "family_head",
            "mobile_number",
            "whatsapp_number",
            "email",
            "address",
            "notes",
            "consent_given",
            "members",
        ]

    def validate_family_head(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Family head name is required."
            )

        return value

    def validate_mobile_number(self, value):

        value = normalize_phone(value)

        if not value:
            raise serializers.ValidationError(
                "Mobile number is required."
            )

        return value

    def validate_whatsapp_number(self, value):

        return normalize_phone(value)

    def validate_address(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Address is required."
            )

        if len(value) > 2000:
            raise serializers.ValidationError(
                "Address is too long."
            )

        return value

    def validate_notes(self, value):

        if len(value) > 2000:
            raise serializers.ValidationError(
                "Notes are too long."
            )

        return value

    def validate_consent_given(self, value):

        if not value:

            raise serializers.ValidationError(
                "Consent is required to submit registration."
            )

        return value

    def validate_members(self, value):

        if len(value) > 20:

            raise serializers.ValidationError(
                "Maximum 20 additional family members allowed."
            )

        return value


# ==========================================
# ADMIN REGISTRATION DETAILS SERIALIZER
# ==========================================

class FamilyRegistrationSerializer(
    serializers.ModelSerializer
):

    members = FamilyRegistrationMemberSerializer(
        many=True,
        read_only=True
    )

    total_members = serializers.IntegerField(
        read_only=True
    )

    status_name = serializers.CharField(
        source="get_status_display",
        read_only=True
    )

    approved_family_code = serializers.CharField(
        source="approved_family.family_id",
        read_only=True,
        default=None
    )

    reviewed_by_name = serializers.CharField(
        source="reviewed_by.username",
        read_only=True,
        default=None
    )

    class Meta:

        model = FamilyRegistration

        fields = [
            "id",
            "registration_id",
            "family_head",
            "mobile_number",
            "whatsapp_number",
            "email",
            "address",
            "photo",
            "notes",
            "consent_given",
            "consent_at",
            "status",
            "status_name",
            "approved_family",
            "approved_family_code",
            "reviewed_by_name",
            "reviewed_at",
            "rejection_reason",
            "admin_notes",
            "total_members",
            "members",
            "submitted_at",
            "updated_at",
        ]

        read_only_fields = fields


# ==========================================
# REJECTION SERIALIZER
# ==========================================

class RegistrationRejectSerializer(
    serializers.Serializer
):

    reason = serializers.CharField(
        max_length=1000,
        allow_blank=False
    )