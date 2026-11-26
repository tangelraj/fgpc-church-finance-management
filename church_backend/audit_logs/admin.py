from django.contrib import admin
from django.utils.html import format_html

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):

    list_display = (
        "username",
        "module",
        "action_display",
        "reference",
        "created_at",
    )

    list_filter = (
        "module",
        "action",
        "created_at",
    )

    search_fields = (
        "username",
        "reference",
        "description",
    )

    readonly_fields = (
        "user",
        "username",
        "module",
        "action",
        "reference",
        "description",
        "created_at",
    )

    date_hierarchy = "created_at"

    list_per_page = 30

    ordering = (
        "-created_at",
        "-id",
    )

    actions = None

    def has_module_permission(self, request):

        return request.user.is_superuser

    def has_view_permission(
        self, request, obj=None
    ):

        return request.user.is_superuser

    def has_add_permission(self, request):

        return False

    def has_change_permission(
        self, request, obj=None
    ):

        return False

    def has_delete_permission(
        self, request, obj=None
    ):

        return False

    @admin.display(description="Action")
    def action_display(self, obj):

        action_colors = {
            "created": "#198754",
            "updated": "#0d6efd",
            "completed": "#198754",
            "cancelled": "#dc3545",
            "login": "#863b86",
            "logout": "#887b90",
            "downloaded": "#b68a39",
        }

        color = action_colors.get(
            obj.action,
            "#54265f"
        )

        return format_html(
            '<span style="color:{};'
            'font-weight:600;">{}</span>',
            color,
            obj.get_action_display(),
        )