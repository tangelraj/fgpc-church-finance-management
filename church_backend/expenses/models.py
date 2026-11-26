from decimal import Decimal

from django.db import models, transaction
from django.utils import timezone
from django.conf import settings
from django.core.validators import MinValueValidator

from offerings.utils import amount_to_words


# ==========================================
# EXPENSE CATEGORY
# ==========================================

class ExpenseCategory(models.Model):

    name = models.CharField(
        max_length=150,
        unique=True
    )

    description = models.TextField(
        blank=True
    )

    is_active = models.BooleanField(
        default=True
    )

    class Meta:
        verbose_name_plural = "Expense Categories"
        ordering = ['name']

    def __str__(self):
        return self.name


# ==========================================
# EXPENSE / PAYMENT VOUCHER
# ==========================================

class Expense(models.Model):

    FUND_CHOICES = [
        ('local', 'Local Church'),
        ('denomination', 'Denomination'),
    ]

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

    voucher_number = models.CharField(
        max_length=30,
        unique=True,
        null=True,
        blank=True,
        editable=False
    )

    paid_to = models.CharField(
        max_length=150
    )

    phone_number = models.CharField(
        max_length=15,
        blank=True
    )

    date = models.DateField(
        default=timezone.localdate
    )

    fund = models.CharField(
        max_length=20,
        choices=FUND_CHOICES,
        default='local'
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

    notes = models.TextField(
        blank=True
    )

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

        if not self.voucher_number:

            self.voucher_number = (
                f"FGPC-V-{self.pk:06d}"
            )

            super().save(
                update_fields=['voucher_number']
            )

    def calculate_total(self):

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
                'updated_at',
            ]
        )

    def __str__(self):

        return (
            f"{self.voucher_number} - "
            f"{self.paid_to}"
        )


# ==========================================
# EXPENSE PARTICULARS
# ==========================================

class ExpenseItem(models.Model):

    expense = models.ForeignKey(
        Expense,
        on_delete=models.CASCADE,
        related_name='items'
    )

    category = models.ForeignKey(
        ExpenseCategory,
        on_delete=models.PROTECT
    )

    particulars = models.CharField(
        max_length=250
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal('0.01'))
        ]
    )

    class Meta:

        ordering = ['id']

        constraints = [
            models.CheckConstraint(
                condition=models.Q(amount__gt=0),
                name='expense_item_positive_amount'
            )
        ]

    def __str__(self):

        return (
            f"{self.particulars} - "
            f"{self.amount}"
        )