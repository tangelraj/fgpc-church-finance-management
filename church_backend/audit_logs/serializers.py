from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(
    serializers.ModelSerializer
):

    module_name = serializers.CharField(
        source="get_module_display",
        read_only=True,
    )

    action_name = serializers.CharField(
        source="get_action_display",
        read_only=True,
    )

    class Meta:

        model = AuditLog

        fields = [
            "id",
            "username",
            "module",
            "module_name",
            "action",
            "action_name",
            "reference",
            "description",
            "created_at",
        ]

        read_only_fields = fields