import uuid
import secrets

from datetime import timedelta

from django.conf import settings
from django.db import models, transaction
from django.utils import timezone


# ==========================================
# REGISTRATION TOKEN
# ==========================================

def generate_registration_token():

    return secrets.token_urlsafe(32)


def registration_expiry():

    return timezone.now() + timedelta(days=7)


# ==========================================
# FAMILY MODEL
# ==========================================

class Family(models.Model):

    family_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        editable=False
    )

    family_head = models.CharField(
        max_length=150
    )

    mobile_number = models.CharField(
        max_length=15
    )

    whatsapp_number = models.CharField(
        max_length=15,
        blank=True
    )

    email = models.EmailField(
        blank=True
    )

    address = models.TextField(
        blank=True
    )

    photo = models.ImageField(
        upload_to="families/",
        blank=True,
        null=True
    )

    joining_date = models.DateField(
        default=timezone.localdate
    )

    is_active = models.BooleanField(
        default=True
    )

    notes = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:

        verbose_name = "Family"

        verbose_name_plural = "Families"

        ordering = ["family_head"]

    @transaction.atomic
    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)

        if not self.family_id:

            self.family_id = (
                f"FAM-{self.pk:04d}"
            )

            super().save(
                update_fields=["family_id"]
            )

    def __str__(self):

        return (
            f"{self.family_id} - "
            f"{self.family_head}"
        )


# ==========================================
# FAMILY MEMBER MODEL
# ==========================================

class FamilyMember(models.Model):

    RELATIONSHIP_CHOICES = [

        ("husband", "Husband"),
        ("wife", "Wife"),
        ("son", "Son"),
        ("daughter", "Daughter"),
        ("father", "Father"),
        ("mother", "Mother"),
        ("brother", "Brother"),
        ("sister", "Sister"),
        ("other", "Other"),

    ]

    GENDER_CHOICES = [

        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),

    ]

    family = models.ForeignKey(

        Family,

        on_delete=models.CASCADE,

        related_name="members"

    )

    full_name = models.CharField(
        max_length=150
    )

    relationship = models.CharField(

        max_length=20,

        choices=RELATIONSHIP_CHOICES

    )

    gender = models.CharField(

        max_length=10,

        choices=GENDER_CHOICES,

        blank=True

    )

    date_of_birth = models.DateField(

        null=True,

        blank=True

    )

    mobile_number = models.CharField(

        max_length=15,

        blank=True

    )

    occupation = models.CharField(

        max_length=100,

        blank=True

    )

    is_baptized = models.BooleanField(
        default=False
    )

    is_active = models.BooleanField(
        default=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        verbose_name = "Family Member"

        verbose_name_plural = "Family Members"

        ordering = ["id"]

    def __str__(self):

        return self.full_name


# ==========================================
# FAMILY REGISTRATION INVITATION
# ==========================================

class RegistrationInvitation(models.Model):

    invitation_id = models.UUIDField(

        default=uuid.uuid4,

        unique=True,

        editable=False

    )

    token = models.CharField(

        max_length=64,

        unique=True,

        default=generate_registration_token,

        editable=False

    )

    title = models.CharField(

        max_length=150,

        default="Family Registration"

    )

    invited_name = models.CharField(

        max_length=150,

        blank=True

    )

    invited_mobile = models.CharField(

        max_length=15,

        blank=True

    )

    created_by = models.ForeignKey(

        settings.AUTH_USER_MODEL,

        on_delete=models.SET_NULL,

        null=True,

        blank=True,

        related_name="family_invitations"

    )

    is_active = models.BooleanField(
        default=True
    )

    is_used = models.BooleanField(
        default=False
    )

    expires_at = models.DateTimeField(

        default=registration_expiry

    )

    used_at = models.DateTimeField(

        null=True,

        blank=True

    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        verbose_name = "Registration Invitation"

        verbose_name_plural = (
            "Registration Invitations"
        )

        ordering = ["-created_at"]

    @property
    def is_expired(self):

        return (
            timezone.now() >= self.expires_at
        )

    @property
    def is_valid(self):

        return (

            self.is_active

            and not self.is_used

            and not self.is_expired

        )

    @property
    def invitation_status(self):

        if self.is_used:

            return "Used"

        if not self.is_active:

            return "Disabled"

        if self.is_expired:

            return "Expired"

        return "Active"

    def __str__(self):

        return (
            f"{self.title} - "
            f"{self.invitation_status}"
        )


# ==========================================
# FAMILY REGISTRATION REQUEST
# ==========================================

class FamilyRegistration(models.Model):

    STATUS_CHOICES = [

        ("pending", "Pending"),

        ("approved", "Approved"),

        ("rejected", "Rejected"),

    ]

    registration_id = models.UUIDField(

        default=uuid.uuid4,

        unique=True,

        editable=False

    )

    invitation = models.OneToOneField(

        RegistrationInvitation,

        on_delete=models.PROTECT,

        related_name="registration"

    )

    # ======================================
    # FAMILY HEAD DETAILS
    # ======================================

    family_head = models.CharField(
        max_length=150
    )

    mobile_number = models.CharField(
        max_length=15
    )

    whatsapp_number = models.CharField(

        max_length=15,

        blank=True

    )

    email = models.EmailField(
        blank=True
    )

    address = models.TextField()

    photo = models.ImageField(

        upload_to="family_registrations/",

        null=True,

        blank=True

    )

    notes = models.TextField(
        blank=True
    )

    consent_given = models.BooleanField(
        default=False
    )

    consent_at = models.DateTimeField(

        null=True,

        blank=True

    )

    # ======================================
    # APPROVAL DETAILS
    # ======================================

    status = models.CharField(

        max_length=20,

        choices=STATUS_CHOICES,

        default="pending",

        db_index=True

    )

    approved_family = models.OneToOneField(

        Family,

        on_delete=models.PROTECT,

        null=True,

        blank=True,

        related_name="registration_request"

    )

    reviewed_by = models.ForeignKey(

        settings.AUTH_USER_MODEL,

        on_delete=models.SET_NULL,

        null=True,

        blank=True,

        related_name="reviewed_registrations"

    )

    reviewed_at = models.DateTimeField(

        null=True,

        blank=True

    )

    rejection_reason = models.TextField(
        blank=True
    )

    admin_notes = models.TextField(
        blank=True
    )

    submitted_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:

        verbose_name = "Family Registration"

        verbose_name_plural = (
            "Family Registrations"
        )

        ordering = ["-submitted_at"]

    @property
    def total_members(self):

        return self.members.count() + 1

    def __str__(self):

        return (
            f"{self.family_head} - "
            f"{self.get_status_display()}"
        )


# ==========================================
# FAMILY REGISTRATION MEMBER
# ==========================================

class FamilyRegistrationMember(models.Model):

    registration = models.ForeignKey(

        FamilyRegistration,

        on_delete=models.CASCADE,

        related_name="members"

    )

    full_name = models.CharField(
        max_length=150
    )

    relationship = models.CharField(

        max_length=20,

        choices=(
            FamilyMember.RELATIONSHIP_CHOICES
        )

    )

    gender = models.CharField(

        max_length=10,

        choices=FamilyMember.GENDER_CHOICES,

        blank=True

    )

    date_of_birth = models.DateField(

        null=True,

        blank=True

    )

    mobile_number = models.CharField(

        max_length=15,

        blank=True

    )

    occupation = models.CharField(

        max_length=100,

        blank=True

    )

    is_baptized = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        verbose_name = (
            "Family Registration Member"
        )

        verbose_name_plural = (
            "Family Registration Members"
        )

        ordering = ["id"]

    def __str__(self):

        return self.full_name