from django.core.exceptions import (
    ValidationError,
    PermissionDenied,
)

from django.db import transaction
from django.utils import timezone

from audit_logs.utils import create_audit_log

from .models import (
    Family,
    FamilyMember,
    FamilyRegistration,
)


# ==========================================
# CHECK ADMIN PERMISSION
# ==========================================

def check_admin_permission(user):

    if not (
        user.is_authenticated
        and user.is_active
        and user.is_superuser
    ):

        raise PermissionDenied(
            "Only administrators can review registrations."
        )


# ==========================================
# APPROVE FAMILY REGISTRATION
# ==========================================

@transaction.atomic
def approve_registration(registration_id, user):

    check_admin_permission(user)

    registration = (
        FamilyRegistration.objects
        .select_for_update()
        .get(pk=registration_id)
    )

    # Prevent duplicate approval

    if registration.status != "pending":

        raise ValidationError(
            "Only pending registrations can be approved."
        )

    if registration.approved_family_id:

        raise ValidationError(
            "This registration already has a family record."
        )

    # Check consent

    if not registration.consent_given:

        raise ValidationError(
            "Registration consent is required."
        )

    # Check possible duplicate family

    if Family.objects.filter(
        mobile_number=registration.mobile_number
    ).exists():

        raise ValidationError(
            "A family with this mobile number already exists. "
            "Please verify the existing family details."
        )

    # Create family

    family = Family.objects.create(

        family_head=registration.family_head,

        mobile_number=registration.mobile_number,

        whatsapp_number=registration.whatsapp_number,

        email=registration.email,

        address=registration.address,

        photo=registration.photo.name or None,

        joining_date=timezone.localdate(),

        notes=registration.notes,

        is_active=True,

    )

    # Create family members

    for member in registration.members.all():

        FamilyMember.objects.create(

            family=family,

            full_name=member.full_name,

            relationship=member.relationship,

            gender=member.gender,

            date_of_birth=member.date_of_birth,

            mobile_number=member.mobile_number,

            occupation=member.occupation,

            is_baptized=member.is_baptized,

            is_active=True,

        )

    # Update registration status

    registration.status = "approved"

    registration.approved_family = family

    registration.reviewed_by = user

    registration.reviewed_at = timezone.now()

    registration.rejection_reason = ""

    registration.save(

        update_fields=[

            "status",

            "approved_family",

            "reviewed_by",

            "reviewed_at",

            "rejection_reason",

            "updated_at",

        ]

    )

    # Create audit log

    create_audit_log(

        user=user,

        module="families",

        action="created",

        reference=family.family_id,

        description=(
            "Family created through approved "
            "self-registration. "
            f"Registration ID: {registration.registration_id}"
        ),

    )

    return family


# ==========================================
# REJECT FAMILY REGISTRATION
# ==========================================

@transaction.atomic
def reject_registration(
    registration_id,
    user,
    reason,
):

    check_admin_permission(user)

    registration = (
        FamilyRegistration.objects
        .select_for_update()
        .get(pk=registration_id)
    )

    if registration.status != "pending":

        raise ValidationError(
            "Only pending registrations can be rejected."
        )

    reason = (reason or "").strip()

    if not reason:

        raise ValidationError(
            "Please enter a rejection reason."
        )

    registration.status = "rejected"

    registration.rejection_reason = reason

    registration.reviewed_by = user

    registration.reviewed_at = timezone.now()

    registration.save(

        update_fields=[

            "status",

            "rejection_reason",

            "reviewed_by",

            "reviewed_at",

            "updated_at",

        ]

    )

    # Create audit log

    create_audit_log(

        user=user,

        module="families",

        action="updated",

        reference=str(
            registration.registration_id
        ),

        description=(
            "Family registration rejected."
        ),

    )

    return registration