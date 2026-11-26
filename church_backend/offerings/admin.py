from decimal import Decimal

from django import forms
from django.contrib import admin, messages
from django.forms.models import BaseInlineFormSet
from django.core.exceptions import ValidationError
from django.db import transaction
from django.urls import reverse
from django.utils.html import format_html

from audit_logs.utils import create_audit_log

from .models import (
    OfferingCategory,
    Offering,
    OfferingItem,
)


# ==========================================
# OFFERING CATEGORY ADMIN
# ==========================================

@admin.register(OfferingCategory)
class OfferingCategoryAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "group",
        "display_order",
        "is_active",
    )

    list_filter = (
        "group",
        "is_active",
    )

    search_fields = (
        "name",
    )

    list_editable = (
        "display_order",
        "is_active",
    )

    ordering = (
        "group",
        "display_order",
        "name",
    )

    def has_delete_permission(
        self, request, obj=None
    ):
        return False


# ==========================================
# OFFERING ADMIN FORM
# ==========================================

class OfferingAdminForm(forms.ModelForm):

    donor_name = forms.CharField(
        max_length=150,
        required=False,
    )

    class Meta:

        model = Offering

        fields = "__all__"

    def clean(self):

        cleaned_data = super().clean()

        family = cleaned_data.get("family")

        donor_name = (
            cleaned_data.get("donor_name") or ""
        ).strip()

        # Do not revalidate historical records

        if (
            self.instance.pk
            and self.instance.status != "draft"
        ):
            return cleaned_data

        # Check family status

        if family and not family.is_active:

            self.add_error(
                "family",
                "The selected family is inactive."
            )

        # Automatically fill donor name

        if family and not donor_name:

            donor_name = family.family_head

            cleaned_data["donor_name"] = donor_name

        # Require either family or donor name

        if not family and not donor_name:

            self.add_error(
                "donor_name",
                "Select a family or enter the donor name."
            )

        return cleaned_data


# ==========================================
# OFFERING ITEM VALIDATION
# ==========================================

class OfferingItemFormSet(BaseInlineFormSet):

    def clean(self):

        super().clean()

        if (
            self.instance.pk
            and self.instance.status != "draft"
        ):
            return

        if any(self.errors):
            return

        valid_items = [

            form

            for form in self.forms

            if form.cleaned_data

            and not form.cleaned_data.get("DELETE")

            and form.cleaned_data.get("category")

        ]

        if not valid_items:

            raise ValidationError(
                "Add at least one offering item."
            )

        total = Decimal("0.00")

        for form in valid_items:

            category = form.cleaned_data.get(
                "category"
            )

            amount = form.cleaned_data.get(
                "amount"
            )

            if category and not category.is_active:

                raise ValidationError(
                    f"{category.name} is inactive."
                )

            if amount is None or amount <= 0:

                raise ValidationError(
                    "Offering amount must be greater than zero."
                )

            total += amount

        if total > Decimal("9999999999.99"):

            raise ValidationError(
                "The total offering amount exceeds "
                "the maximum allowed amount."
            )


# ==========================================
# OFFERING ITEM INLINE
# ==========================================

class OfferingItemInline(admin.TabularInline):

    model = OfferingItem

    formset = OfferingItemFormSet

    extra = 3

    fields = (
        "category",
        "purpose",
        "amount",
    )

    def has_add_permission(
        self, request, obj=None
    ):

        return (

            super().has_add_permission(
                request, obj
            )

            and (
                obj is None
                or obj.status == "draft"
            )

        )

    def has_change_permission(
        self, request, obj=None
    ):

        return (

            super().has_change_permission(
                request, obj
            )

            and (
                obj is None
                or obj.status == "draft"
            )

        )

    def has_delete_permission(
        self, request, obj=None
    ):

        return (

            super().has_delete_permission(
                request, obj
            )

            and (
                obj is None
                or obj.status == "draft"
            )

        )


# ==========================================
# OFFERING ADMIN
# ==========================================

@admin.register(Offering)
class OfferingAdmin(admin.ModelAdmin):

    form = OfferingAdminForm

    list_display = (

        "receipt_number",

        "donor_name",

        "family",

        "date",

        "payment_method",

        "total_amount",

        "status_display",

        "receipt_actions",

    )

    list_filter = (

        "date",

        "payment_method",

        "status",

    )

    search_fields = (

        "receipt_number",

        "donor_name",

        "family__family_id",

        "family__family_head",

        "donor_phone",

    )

    readonly_fields = (

        "receipt_number",

        "total_amount",

        "amount_in_words",

        "status",

        "created_by",

        "created_at",

        "updated_at",

    )

    autocomplete_fields = [
        "family",
    ]

    inlines = [
        OfferingItemInline,
    ]

    actions = [

        "complete_offerings",

        "cancel_offerings",

    ]

    list_per_page = 25

    date_hierarchy = "date"

    ordering = (
        "-date",
        "-id",
    )

    list_select_related = (
        "family",
        "created_by",
    )


    # ======================================
    # ADMIN FORM SECTIONS
    # ======================================

    fieldsets = (

        (
            "Receipt Information",
            {
                "fields": (

                    "receipt_number",

                    "date",

                    "status",

                )
            }
        ),

        (
            "Donor Information",
            {
                "fields": (

                    "family",

                    "donor_name",

                    "donor_phone",

                )
            }
        ),

        (
            "Payment Information",
            {
                "fields": (

                    "payment_method",

                    "transaction_reference",

                    "notes",

                )
            }
        ),

        (
            "Amount Details",
            {
                "fields": (

                    "total_amount",

                    "amount_in_words",

                )
            }
        ),

        (
            "Record Information",
            {
                "fields": (

                    "created_by",

                    "created_at",

                    "updated_at",

                )
            }
        ),

    )


    # ======================================
    # PROTECT COMPLETED RECORDS
    # ======================================

    def has_change_permission(
        self, request, obj=None
    ):

        if obj and obj.status != "draft":

            return False

        return super().has_change_permission(
            request, obj
        )


    def get_readonly_fields(
        self, request, obj=None
    ):

        if obj and obj.status != "draft":

            return self.readonly_fields + (

                "family",

                "donor_name",

                "donor_phone",

                "date",

                "payment_method",

                "transaction_reference",

                "notes",

            )

        return self.readonly_fields


    # ======================================
    # SAVE OFFERING
    # ======================================

    def save_model(
        self, request, obj, form, change
    ):

        if not change:

            obj.created_by = request.user

        if obj.family:

            if not obj.donor_name:

                obj.donor_name = (
                    obj.family.family_head
                )

            if not obj.donor_phone:

                obj.donor_phone = (

                    obj.family.whatsapp_number

                    or obj.family.mobile_number

                    or ""

                )

        super().save_model(
            request,
            obj,
            form,
            change,
        )


    # ======================================
    # AUTOMATIC TOTAL CALCULATION
    # ======================================

    def save_related(
        self,
        request,
        form,
        formsets,
        change,
    ):

        super().save_related(

            request,

            form,

            formsets,

            change,

        )

        if form.instance.status == "draft":

            form.instance.calculate_total()


    # ======================================
    # PREVENT PERMANENT DELETION
    # ======================================

    def has_delete_permission(
        self, request, obj=None
    ):

        return False


    # ======================================
    # COLORED STATUS DISPLAY
    # ======================================

    @admin.display(
        description="Status",
        ordering="status",
    )
    def status_display(self, obj):

        colors = {

            "draft": "#D97706",

            "completed": "#15803D",

            "cancelled": "#DC2626",

        }

        color = colors.get(
            obj.status,
            "#64748B",
        )

        return format_html(

            '<span style="'
            'color:{};'
            'font-weight:600;'
            'padding:5px 10px;'
            'border:1px solid currentColor;'
            'border-radius:6px;'
            'white-space:nowrap;'
            '">{}</span>',

            color,

            obj.get_status_display(),

        )


    # ======================================
    # RECEIPT VIEW / PRINT / DOWNLOAD
    # ======================================

    @admin.display(
        description="Receipt Actions"
    )
    def receipt_actions(self, obj):

        if obj.status != "completed":

            return "—"

        view_url = reverse(

            "receipts:receipt-pdf",

            args=[obj.pk],

        )

        download_url = reverse(

            "receipts:download-receipt",

            args=[obj.pk],

        )

        return format_html(

            '<a href="{}" '
            'target="_blank" '
            'rel="noopener noreferrer" '
            'style="'
            'background:#54265F;'
            'color:white;'
            'padding:7px 12px;'
            'border-radius:5px;'
            'text-decoration:none;'
            'white-space:nowrap;'
            '">View / Print</a> '

            '<a href="{}" '
            'style="'
            'background:#15803D;'
            'color:white;'
            'padding:7px 12px;'
            'border-radius:5px;'
            'text-decoration:none;'
            'white-space:nowrap;'
            '">Download PDF</a>',

            view_url,

            download_url,

        )


    # ======================================
    # AUDIT LOG - CREATE OFFERING
    # ======================================

    def log_addition(
        self, request, obj, message
    ):

        result = super().log_addition(

            request,

            obj,

            message,

        )

        create_audit_log(

            user=request.user,

            module="offerings",

            action="created",

            reference=obj.receipt_number,

            description=(

                "Offering created through Django Admin. "

                f"Amount: Rs. {obj.total_amount}"

            ),

        )

        return result


    # ======================================
    # AUDIT LOG - UPDATE OFFERING
    # ======================================

    def log_change(
        self, request, obj, message
    ):

        result = super().log_change(

            request,

            obj,

            message,

        )

        create_audit_log(

            user=request.user,

            module="offerings",

            action="updated",

            reference=obj.receipt_number,

            description=(

                "Offering updated through Django Admin. "

                f"Amount: Rs. {obj.total_amount}"

            ),

        )

        return result


    # ======================================
    # COMPLETE OFFERINGS
    # ======================================

    @admin.action(

        description="Complete selected offerings",

        permissions=["change"],

    )
    @transaction.atomic
    def complete_offerings(
        self, request, queryset
    ):

        if not self.has_change_permission(
            request
        ):

            self.message_user(

                request,

                "You do not have permission "
                "to complete offerings.",

                messages.ERROR,

            )

            return

        count = 0

        skipped = 0

        for offering in queryset.select_for_update():

            if offering.status != "draft":

                skipped += 1

                continue

            if not offering.items.exists():

                skipped += 1

                continue

            offering.calculate_total()

            if offering.total_amount <= 0:

                skipped += 1

                continue

            offering.status = "completed"

            offering.save(

                update_fields=[

                    "status",

                    "updated_at",

                ]

            )

            # Django's built-in admin history

            super().log_change(

                request,

                offering,

                "Offering completed.",

            )

            # Custom audit history

            create_audit_log(

                user=request.user,

                module="offerings",

                action="completed",

                reference=offering.receipt_number,

                description=(

                    "Offering completed through Django Admin. "

                    f"Amount: Rs. {offering.total_amount}"

                ),

            )

            count += 1

        self.message_user(

            request,

            f"{count} offering(s) completed successfully.",

            messages.SUCCESS,

        )

        if skipped:

            self.message_user(

                request,

                f"{skipped} offering(s) skipped.",

                messages.WARNING,

            )


    # ======================================
    # CANCEL OFFERINGS
    # SUPERUSER ONLY
    # ======================================

    @admin.action(

        description="Cancel selected offerings",

        permissions=["change"],

    )
    @transaction.atomic
    def cancel_offerings(
        self, request, queryset
    ):

        if not request.user.is_superuser:

            self.message_user(

                request,

                "Only administrators can cancel offerings.",

                messages.ERROR,

            )

            return

        count = 0

        for offering in queryset.select_for_update():

            if offering.status == "cancelled":

                continue

            previous_status = offering.status

            offering.status = "cancelled"

            offering.save(

                update_fields=[

                    "status",

                    "updated_at",

                ]

            )

            # Django's built-in admin history

            super().log_change(

                request,

                offering,

                "Offering cancelled.",

            )

            # Custom audit history

            create_audit_log(

                user=request.user,

                module="offerings",

                action="cancelled",

                reference=offering.receipt_number,

                description=(

                    "Offering cancelled through Django Admin. "

                    f"Previous status: {previous_status}. "

                    f"Amount: Rs. {offering.total_amount}"

                ),

            )

            count += 1

        self.message_user(

            request,

            f"{count} offering(s) cancelled successfully.",

            messages.WARNING,

        )


    # ======================================
    # HIDE CANCEL ACTION FROM NORMAL STAFF
    # ======================================

    def get_actions(self, request):

        actions = super().get_actions(request)

        if not request.user.is_superuser:

            actions.pop(
                "cancel_offerings",
                None,
            )

        return actions