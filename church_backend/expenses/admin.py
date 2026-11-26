from decimal import Decimal

from django.contrib import admin, messages
from django.db import transaction
from django.forms.models import BaseInlineFormSet
from django.core.exceptions import ValidationError
from django.utils.html import format_html
from django.urls import reverse

from audit_logs.utils import create_audit_log

from .models import (
    ExpenseCategory,
    Expense,
    ExpenseItem,
)


# ==========================================
# EXPENSE CATEGORY ADMIN
# ==========================================

@admin.register(ExpenseCategory)
class ExpenseCategoryAdmin(admin.ModelAdmin):

    list_display = (
        "name",
        "is_active",
    )

    list_editable = (
        "is_active",
    )

    search_fields = (
        "name",
    )

    list_filter = (
        "is_active",
    )

    ordering = (
        "name",
    )

    def has_delete_permission(
        self, request, obj=None
    ):
        return False


# ==========================================
# EXPENSE ITEM VALIDATION
# ==========================================

class ExpenseItemFormSet(BaseInlineFormSet):

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
                "Add at least one expense item."
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
                    "Expense amount must be "
                    "greater than zero."
                )

            total += amount

        if total > Decimal("9999999999.99"):

            raise ValidationError(
                "Total expense amount exceeds "
                "the maximum allowed limit."
            )


# ==========================================
# EXPENSE ITEMS INLINE TABLE
# ==========================================

class ExpenseItemInline(admin.TabularInline):

    model = ExpenseItem

    formset = ExpenseItemFormSet

    extra = 3

    fields = (
        "category",
        "particulars",
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
# EXPENSE ADMIN
# ==========================================

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):

    list_display = (

        "voucher_number",

        "paid_to",

        "date",

        "fund",

        "payment_method",

        "total_amount",

        "status_display",

        "voucher_actions",

    )

    list_filter = (

        "date",

        "fund",

        "payment_method",

        "status",

    )

    search_fields = (

        "voucher_number",

        "paid_to",

        "phone_number",

        "items__particulars",

    )

    readonly_fields = (

        "voucher_number",

        "total_amount",

        "amount_in_words",

        "status",

        "created_by",

        "created_at",

        "updated_at",

    )

    inlines = [
        ExpenseItemInline,
    ]

    actions = [

        "complete_expenses",

        "cancel_expenses",

    ]

    date_hierarchy = "date"

    list_per_page = 25

    ordering = (
        "-date",
        "-id",
    )

    list_select_related = (
        "created_by",
    )


    # ======================================
    # ADMIN FORM SECTIONS
    # ======================================

    fieldsets = (

        (
            "Voucher Information",
            {
                "fields": (

                    "voucher_number",

                    "date",

                    "status",

                )
            }
        ),

        (
            "Receiver Information",
            {
                "fields": (

                    "paid_to",

                    "phone_number",

                )
            }
        ),

        (
            "Payment Information",
            {
                "fields": (

                    "fund",

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
    # PROTECT COMPLETED EXPENSES
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

                "paid_to",

                "phone_number",

                "date",

                "fund",

                "payment_method",

                "transaction_reference",

                "notes",

            )

        return self.readonly_fields


    # ======================================
    # SAVE EXPENSE
    # ======================================

    def save_model(
        self, request, obj, form, change
    ):

        if not change:

            obj.created_by = request.user

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

        status_colors = {

            "draft": "#D97706",

            "completed": "#15803D",

            "cancelled": "#DC2626",

        }

        color = status_colors.get(

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
    # VIEW / PRINT / DOWNLOAD VOUCHER
    # ======================================

    @admin.display(
        description="Payment Voucher"
    )
    def voucher_actions(self, obj):

        if not obj or not obj.pk:

            return "Save the expense first."

        if obj.status != "completed":

            return "—"

        print_url = reverse(

            "vouchers:voucher-pdf",

            args=[obj.pk],

        )

        download_url = reverse(

            "vouchers:download-voucher",

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
            'margin:3px;'
            'display:inline-block;'
            'text-decoration:none;'
            'white-space:nowrap;'
            '">View / Print</a> '

            '<a href="{}" '
            'style="'
            'background:#15803D;'
            'color:white;'
            'padding:7px 12px;'
            'border-radius:5px;'
            'margin:3px;'
            'display:inline-block;'
            'text-decoration:none;'
            'white-space:nowrap;'
            '">Download PDF</a>',

            print_url,

            download_url,

        )


    # ======================================
    # AUDIT LOG - CREATE EXPENSE
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

            module="expenses",

            action="created",

            reference=obj.voucher_number,

            description=(

                "Expense created through Django Admin. "

                f"Amount: Rs. {obj.total_amount}"

            ),

        )

        return result


    # ======================================
    # AUDIT LOG - UPDATE EXPENSE
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

            module="expenses",

            action="updated",

            reference=obj.voucher_number,

            description=(

                "Expense updated through Django Admin. "

                f"Amount: Rs. {obj.total_amount}"

            ),

        )

        return result


    # ======================================
    # COMPLETE EXPENSES
    # ======================================

    @admin.action(

        description="Complete selected expenses",

        permissions=["change"],

    )
    @transaction.atomic
    def complete_expenses(
        self, request, queryset
    ):

        if not self.has_change_permission(
            request
        ):

            self.message_user(

                request,

                "You do not have permission "
                "to complete expenses.",

                messages.ERROR,

            )

            return

        count = 0

        skipped = 0

        for expense in queryset.select_for_update():

            if expense.status != "draft":

                skipped += 1

                continue

            if not expense.items.exists():

                skipped += 1

                continue

            expense.calculate_total()

            if expense.total_amount <= 0:

                skipped += 1

                continue

            expense.status = "completed"

            expense.save(

                update_fields=[

                    "status",

                    "updated_at",

                ]

            )

            # Django built-in admin history

            super().log_change(

                request,

                expense,

                "Expense completed.",

            )

            # Custom audit history

            create_audit_log(

                user=request.user,

                module="expenses",

                action="completed",

                reference=expense.voucher_number,

                description=(

                    "Expense completed through Django Admin. "

                    f"Amount: Rs. {expense.total_amount}"

                ),

            )

            count += 1

        self.message_user(

            request,

            f"{count} expense(s) completed successfully.",

            messages.SUCCESS,

        )

        if skipped:

            self.message_user(

                request,

                f"{skipped} expense(s) skipped.",

                messages.WARNING,

            )


    # ======================================
    # CANCEL EXPENSES
    # SUPERUSER ONLY
    # ======================================

    @admin.action(

        description="Cancel selected expenses",

        permissions=["change"],

    )
    @transaction.atomic
    def cancel_expenses(
        self, request, queryset
    ):

        if not request.user.is_superuser:

            self.message_user(

                request,

                "Only administrators can cancel expenses.",

                messages.ERROR,

            )

            return

        count = 0

        for expense in queryset.select_for_update():

            if expense.status == "cancelled":

                continue

            previous_status = expense.status

            expense.status = "cancelled"

            expense.save(

                update_fields=[

                    "status",

                    "updated_at",

                ]

            )

            # Django built-in admin history

            super().log_change(

                request,

                expense,

                "Expense cancelled.",

            )

            # Custom audit history

            create_audit_log(

                user=request.user,

                module="expenses",

                action="cancelled",

                reference=expense.voucher_number,

                description=(

                    "Expense cancelled through Django Admin. "

                    f"Previous status: {previous_status}. "

                    f"Amount: Rs. {expense.total_amount}"

                ),

            )

            count += 1

        self.message_user(

            request,

            f"{count} expense(s) cancelled successfully.",

            messages.WARNING,

        )


    # ======================================
    # HIDE CANCEL ACTION FROM NORMAL STAFF
    # ======================================

    def get_actions(self, request):

        actions = super().get_actions(request)

        if not request.user.is_superuser:

            actions.pop(

                "cancel_expenses",

                None,

            )

        return actions