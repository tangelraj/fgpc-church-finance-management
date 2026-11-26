from django.contrib import admin

from .models import ChurchSettings


@admin.register(ChurchSettings)
class ChurchSettingsAdmin(admin.ModelAdmin):

    list_display = (
        "church_name",
        "branch_name",
        "phone",
        "email",
        "updated_at",
    )

    readonly_fields = (
        "updated_at",
    )

    fieldsets = (

        (
            "Church Information",
            {
                "fields": (
                    "church_name",
                    "headquarters",
                    "branch_name",
                    "registration_number",
                    "registration_details",
                    "address",
                    "logo",
                )
            }
        ),

        (
            "Contact Information",
            {
                "fields": (
                    "phone",
                    "email",
                    "pastor_name",
                    "cashier_name",
                )
            }
        ),

        (
            "Receipt and Voucher Settings",
            {
                "fields": (
                    "praise_text",
                    "receipt_title",
                    "voucher_title",
                    "receipt_signature",
                    "receiver_signature",
                    "cashier_signature",
                    "pastor_signature",
                )
            }
        ),

        (
            "Record Information",
            {
                "fields": (
                    "updated_at",
                )
            }
        ),

    )

    def has_add_permission(self, request):

        return (
            request.user.is_superuser
            and not ChurchSettings.objects.exists()
        )

    def has_change_permission(self, request, obj=None):

        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):

        return False