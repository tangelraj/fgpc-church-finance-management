from decimal import Decimal

from django.db import models, transaction
from django.utils import timezone
from django.conf import settings
from django.core.validators import MinValueValidator

from families.models import Family


class OfferingCategory(models.Model):

    GROUP_CHOICES = [
        ('local', 'Local Church'),
        ('denomination', 'Denomination'),
    ]

    name = models.CharField(max_length=150)

    group = models.CharField(
        max_length=20,
        choices=GROUP_CHOICES
    )

    display_order = models.PositiveIntegerField(
        default=0
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Offering Category"
        verbose_name_plural = "Offering Categories"
        ordering = ['group', 'display_order', 'id']

        constraints = [
            models.UniqueConstraint(
                fields=['name', 'group'],
                name='unique_offering_category'
            )
        ]

    def __str__(self):
        return f"{self.name} - {self.get_group_display()}"


class Offering(models.Model):

    PAYMENT_CHOICES = [
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
    ]

    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    receipt_number = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True,
        editable=False
    )

    family = models.ForeignKey(
        Family,
        on_delete=models.PROTECT,
        related_name='offerings',
        null=True,
        blank=True
    )

    donor_name = models.CharField(max_length=150)

    donor_phone = models.CharField(
        max_length=15,
        blank=True
    )

    date = models.DateField(
        default=timezone.localdate
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_CHOICES,
        default='cash'
    )

    transaction_reference = models.CharField(
        max_length=150,
        blank=True
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        editable=False
    )

    amount_in_words = models.CharField(
        max_length=500,
        blank=True,
        editable=False
    )

    notes = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ['-date', '-id']

    @transaction.atomic
    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)

        if not self.receipt_number:

            self.receipt_number = (
                f"FGPC-R-{self.pk:06d}"
            )

            super().save(
                update_fields=['receipt_number']
            )

    def calculate_total(self):

        from .utils import amount_to_words

        total = self.items.aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0.00')

        self.total_amount = total

        self.amount_in_words = amount_to_words(
            total
        )

        self.save(
            update_fields=[
                'total_amount',
                'amount_in_words',
                'updated_at'
            ]
        )

    def __str__(self):
        return f"{self.receipt_number} - {self.donor_name}"


class OfferingItem(models.Model):

    offering = models.ForeignKey(
        Offering,
        on_delete=models.CASCADE,
        related_name='items'
    )

    category = models.ForeignKey(
        OfferingCategory,
        on_delete=models.PROTECT,
        related_name='offering_items'
    )

    purpose = models.CharField(
        max_length=150,
        blank=True
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal('0.01'))
        ]
    )

    class Meta:

        ordering = ['category__display_order', 'id']

        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name='offering_item_positive_amount'
            )
        ]

    def __str__(self):
        return f"{self.category.name} - {self.amount}"