from urllib.parse import urlencode

from django.conf import settings
from django.contrib import admin, messages
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.html import format_html

from audit_logs.utils import create_audit_log

from .models import (

    Family,

    FamilyMember,

    RegistrationInvitation,

    FamilyRegistration,

    FamilyRegistrationMember,

)

from .registration_utils import (

    approve_registration,

    reject_registration,

)


# ==========================================
# FAMILY MEMBER INLINE
# ==========================================

class FamilyMemberInline(admin.TabularInline):

    model = FamilyMember

    extra = 1

    fields = (

        "full_name",

        "relationship",

        "gender",

        "date_of_birth",

        "mobile_number",

        "occupation",

        "is_baptized",

        "is_active",

    )


# ==========================================
# FAMILY ADMIN
# ==========================================

@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):

    list_display = (

        "family_id",

        "family_head",

        "mobile_number",

        "whatsapp_number",

        "total_members",

        "joining_date",

        "is_active",

    )

    search_fields = (

        "family_id",

        "family_head",

        "mobile_number",

        "whatsapp_number",

        "members__full_name",

    )

    list_filter = (

        "is_active",

        "joining_date",

    )

    readonly_fields = (

        "family_id",

        "created_at",

        "updated_at",

    )

    list_per_page = 20

    inlines = [FamilyMemberInline]

    fieldsets = (

        (
            "Family Information",
            {
                "fields": (

                    "family_id",

                    "family_head",

                    "photo",

                    "joining_date",

                    "is_active",

                )
            }
        ),

        (
            "Contact Information",
            {
                "fields": (

                    "mobile_number",

                    "whatsapp_number",

                    "email",

                    "address",

                )
            }
        ),

        (
            "Additional Information",
            {
                "fields": (

                    "notes",

                    "created_at",

                    "updated_at",

                )
            }
        ),

    )

    @admin.display(description="Total Members")
    def total_members(self, obj):

        return (
            obj.members.filter(
                is_active=True
            ).count() + 1
        )

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):

        return False


# ==========================================
# FAMILY MEMBER ADMIN
# ==========================================

@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):

    list_display = (

        "full_name",

        "family",

        "relationship",

        "gender",

        "date_of_birth",

        "is_baptized",

        "is_active",

    )

    search_fields = (

        "full_name",

        "family__family_head",

        "mobile_number",

    )

    list_filter = (

        "relationship",

        "gender",

        "is_baptized",

        "is_active",

    )

    list_select_related = ("family",)

    list_per_page = 25

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):

        return False


# ==========================================
# SUPERUSER ONLY ADMIN MIXIN
# ==========================================

class RegistrationAdminPermissionMixin:

    def has_module_permission(self, request):

        return request.user.is_superuser

    def has_view_permission(
        self,
        request,
        obj=None,
    ):

        return request.user.is_superuser

    def has_add_permission(self, request):

        return request.user.is_superuser

    def has_change_permission(
        self,
        request,
        obj=None,
    ):

        return request.user.is_superuser

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):

        return False


# ==========================================
# REGISTRATION INVITATION ADMIN
# ==========================================

@admin.register(RegistrationInvitation)
class RegistrationInvitationAdmin(

    RegistrationAdminPermissionMixin,

    admin.ModelAdmin,

):

    list_display = (

        "title",

        "invited_name",

        "invited_mobile",

        "status_display",

        "expires_at",

        "created_by",

        "created_at",

        "registration_link",

    )

    search_fields = (

        "title",

        "invited_name",

        "invited_mobile",

        "invitation_id",

    )

    list_filter = (

        "is_active",

        "is_used",

        "created_at",

        "expires_at",

    )

    readonly_fields = (

        "invitation_id",

        "token",

        "created_by",

        "is_used",

        "used_at",

        "created_at",

        "status_display",

        "registration_link",

    )

    list_per_page = 25

    list_select_related = ("created_by",)

    actions = ["disable_invitations"]

    fieldsets = (

        (
            "Invitation Information",
            {
                "fields": (

                    "invitation_id",

                    "title",

                    "invited_name",

                    "invited_mobile",

                    "expires_at",

                    "is_active",

                )
            }
        ),

        (
            "Registration Link",
            {
                "fields": (

                    "token",

                    "registration_link",

                    "status_display",

                )
            }
        ),

        (
            "Usage Information",
            {
                "fields": (

                    "is_used",

                    "used_at",

                    "created_by",

                    "created_at",

                )
            }
        ),

    )

    # ======================================
    # INVITATION STATUS
    # ======================================

    @admin.display(description="Status")
    def status_display(self, obj):

        if not obj.pk:

            return "-"

        status = obj.invitation_status

        colors = {

            "Active": "#198754",

            "Used": "#2563eb",

            "Expired": "#dc2626",

            "Disabled": "#6b7280",

        }

        return format_html(

            '<span style="color:{};'
            'font-weight:600;">{}</span>',

            colors.get(status, "#333333"),

            status,

        )

    # ======================================
    # PUBLIC REGISTRATION LINK
    # ======================================

    @admin.display(description="Registration Link")
    def registration_link(self, obj):

        if not obj.pk:

            return "Save invitation first."

        if not obj.is_valid:

            return "Invitation unavailable"

        frontend_url = getattr(

            settings,

            "FRONTEND_URL",

            "http://localhost:5173",

        ).rstrip("/")

        query = urlencode({

            "token": obj.token,

        })

        url = (
            f"{frontend_url}/register-family?"
            f"{query}"
        )

        return format_html(

            '<a href="{}" target="_blank" '
            'rel="noopener noreferrer" '
            'referrerpolicy="no-referrer" '
            'style="font-weight:600;">'
            'Open Registration Form</a>',

            url,

        )

    # ======================================
    # SAVE INVITATION
    # ======================================

    def save_model(
        self,
        request,
        obj,
        form,
        change,
    ):

        if not change:

            obj.created_by = request.user

        super().save_model(

            request,

            obj,

            form,

            change,

        )

        create_audit_log(

            user=request.user,

            module="families",

            action=(
                "updated" if change else "created"
            ),

            reference=str(obj.invitation_id),

            description=(
                "Family registration invitation updated."
                if change
                else "Family registration invitation created."
            ),

        )

    # ======================================
    # DISABLE INVITATIONS
    # ======================================

    @admin.action(
        description="Disable selected invitations"
    )
    def disable_invitations(
        self,
        request,
        queryset,
    ):

        count = 0

        for invitation in queryset.filter(
            is_active=True,
            is_used=False,
        ):

            invitation.is_active = False

            invitation.save(
                update_fields=["is_active"]
            )

            create_audit_log(

                user=request.user,

                module="families",

                action="updated",

                reference=str(
                    invitation.invitation_id
                ),

                description=(
                    "Registration invitation disabled."
                ),

            )

            count += 1

        self.message_user(

            request,

            f"{count} invitation(s) disabled.",

            messages.SUCCESS,

        )


# ==========================================
# REGISTRATION MEMBER INLINE
# ==========================================

class FamilyRegistrationMemberInline(
    admin.TabularInline
):

    model = FamilyRegistrationMember

    extra = 0

    can_delete = False

    fields = (

        "full_name",

        "relationship",

        "gender",

        "date_of_birth",

        "mobile_number",

        "occupation",

        "is_baptized",

    )

    readonly_fields = fields

    def has_add_permission(
        self,
        request,
        obj=None,
    ):

        return False

    def has_change_permission(
        self,
        request,
        obj=None,
    ):

        return False

    def has_delete_permission(
        self,
        request,
        obj=None,
    ):

        return False


# ==========================================
# FAMILY REGISTRATION ADMIN
# ==========================================

@admin.register(FamilyRegistration)
class FamilyRegistrationAdmin(

    RegistrationAdminPermissionMixin,

    admin.ModelAdmin,

):

    list_display = (

        "family_head",

        "mobile_number",

        "member_count",

        "status_display",

        "approved_family",

        "submitted_at",

        "reviewed_by",

    )

    search_fields = (

        "family_head",

        "mobile_number",

        "whatsapp_number",

        "email",

        "registration_id",

        "members__full_name",

    )

    list_filter = (

        "status",

        "consent_given",

        "submitted_at",

        "reviewed_at",

    )

    list_select_related = (

        "approved_family",

        "reviewed_by",

        "invitation",

    )

    readonly_fields = (

        "registration_id",

        "invitation",

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

        "approved_family",

        "reviewed_by",

        "reviewed_at",

        "submitted_at",

        "updated_at",

    )

    inlines = [
        FamilyRegistrationMemberInline
    ]

    list_per_page = 25

    date_hierarchy = "submitted_at"

    actions = [

        "approve_selected_registrations",

        "reject_selected_registrations",

    ]

    fieldsets = (

        (
            "Registration Information",
            {
                "fields": (

                    "registration_id",

                    "invitation",

                    "status",

                    "submitted_at",

                )
            }
        ),

        (
            "Family Head Details",
            {
                "fields": (

                    "family_head",

                    "mobile_number",

                    "whatsapp_number",

                    "email",

                    "address",

                    "photo",

                    "notes",

                )
            }
        ),

        (
            "Consent Information",
            {
                "fields": (

                    "consent_given",

                    "consent_at",

                )
            }
        ),

        (
            "Admin Review",
            {
                "fields": (

                    "admin_notes",

                    "rejection_reason",

                    "approved_family",

                    "reviewed_by",

                    "reviewed_at",

                    "updated_at",

                )
            }
        ),

    )

    # ======================================
    # PREVENT MANUAL REGISTRATION CREATION
    # ======================================

    def has_add_permission(self, request):

        return False

    def has_change_permission(
        self,
        request,
        obj=None,
    ):

        if not request.user.is_superuser:

            return False

        if obj and obj.status != "pending":

            return False

        return True

    # ======================================
    # MEMBER COUNT
    # ======================================

    @admin.display(description="Total Members")
    def member_count(self, obj):

        return obj.total_members

    # ======================================
    # STATUS DISPLAY
    # ======================================

    @admin.display(
        description="Status",
        ordering="status",
    )
    def status_display(self, obj):

        colors = {

            "pending": "#d97706",

            "approved": "#198754",

            "rejected": "#dc2626",

        }

        return format_html(

            '<span style="color:{};'
            'font-weight:600;">{}</span>',

            colors.get(
                obj.status,
                "#333333",
            ),

            obj.get_status_display(),

        )

    # ======================================
    # APPROVE SELECTED REGISTRATIONS
    # ======================================

    @admin.action(
        description="Approve selected family registrations"
    )
    def approve_selected_registrations(
        self,
        request,
        queryset,
    ):

        approved_count = 0

        for registration in queryset:

            try:

                family = approve_registration(

                    registration.pk,

                    request.user,

                )

                approved_count += 1

                self.log_change(

                    request,

                    registration,

                    f"Approved as {family.family_id}",

                )

            except ValidationError as error:

                self.message_user(

                    request,

                    (
                        f"{registration.family_head}: "
                        f"{'; '.join(error.messages)}"
                    ),

                    messages.ERROR,

                )

        if approved_count:

            self.message_user(

                request,

                (
                    f"{approved_count} family "
                    "registration(s) approved."
                ),

                messages.SUCCESS,

            )

    # ======================================
    # REJECT SELECTED REGISTRATIONS
    # ======================================

    @admin.action(
        description="Reject selected family registrations"
    )
    def reject_selected_registrations(
        self,
        request,
        queryset,
    ):

        rejected_count = 0

        for registration in queryset:

            try:

                reject_registration(

                    registration.pk,

                    request.user,

                    registration.rejection_reason,

                )

                rejected_count += 1

                self.log_change(

                    request,

                    registration,

                    "Family registration rejected.",

                )

            except ValidationError as error:

                self.message_user(

                    request,

                    (
                        f"{registration.family_head}: "
                        f"{'; '.join(error.messages)}"
                    ),

                    messages.ERROR,

                )

        if rejected_count:

            self.message_user(

                request,

                (
                    f"{rejected_count} family "
                    "registration(s) rejected."
                ),

                messages.SUCCESS,

            )