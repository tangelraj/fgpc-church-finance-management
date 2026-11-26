from django.db import models
from django.conf import settings


class AuditLog(models.Model):

    MODULE_CHOICES = [
        ("offerings", "Offerings"),
        ("expenses", "Expenses"),
        ("families", "Families"),
        ("settings", "Settings"),
        ("accounts", "Accounts"),
        ("backups", "Backups"),
    ]

    ACTION_CHOICES = [
        ("created", "Created"),
        ("updated", "Updated"),
        ("cancelled", "Cancelled"),
        ("completed", "Completed"),
        ("login", "Login"),
        ("logout", "Logout"),
        ("downloaded", "Downloaded"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )

    username = models.CharField(
        max_length=150
    )

    module = models.CharField(
        max_length=30,
        choices=MODULE_CHOICES,
    )

    action = models.CharField(
        max_length=30,
        choices=ACTION_CHOICES,
    )

    reference = models.CharField(
        max_length=150,
        blank=True,
    )

    description = models.TextField(
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:

        ordering = ["-created_at", "-id"]

        verbose_name = "Audit Log"

        verbose_name_plural = "Audit Logs"

        indexes = [
            models.Index(
                fields=["module", "action"]
            ),
        ]

    def __str__(self):

        return (
            f"{self.username} - "
            f"{self.module} - "
            f"{self.action}"
        )