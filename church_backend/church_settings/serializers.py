from rest_framework import serializers

from .models import ChurchSettings


class ChurchSettingsSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = ChurchSettings

        fields = "__all__"

        read_only_fields = (
            "id",
            "updated_at",
        )

    def validate_logo(self, value):

        if value and value.size > 2 * 1024 * 1024:

            raise serializers.ValidationError(
                "Logo size must not exceed 2 MB."
            )

        return value