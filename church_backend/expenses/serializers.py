from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from .models import (
    ExpenseCategory,
    Expense,
    ExpenseItem,
)


# ==========================================
# EXPENSE CATEGORY SERIALIZER
# ==========================================

class ExpenseCategorySerializer(serializers.ModelSerializer):

    class Meta:

        model = ExpenseCategory

        fields = [
            'id',
            'name',
            'description',
            'is_active',
        ]


# ==========================================
# EXPENSE ITEM SERIALIZER
# ==========================================

class ExpenseItemSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )

    class Meta:

        model = ExpenseItem

        fields = [
            'id',
            'category',
            'category_name',
            'particulars',
            'amount',
        ]

        read_only_fields = ['id']

    def validate_category(self, value):

        if not value.is_active:

            raise serializers.ValidationError(
                "This expense category is inactive."
            )

        return value

    def validate_amount(self, value):

        if value <= 0:

            raise serializers.ValidationError(
                "Amount must be greater than zero."
            )

        return value


# ==========================================
# EXPENSE SERIALIZER
# ==========================================

class ExpenseSerializer(serializers.ModelSerializer):

    items = ExpenseItemSerializer(
        many=True
    )

    fund_name = serializers.CharField(
        source='get_fund_display',
        read_only=True
    )

    payment_method_name = serializers.CharField(
        source='get_payment_method_display',
        read_only=True
    )

    created_by_name = serializers.CharField(
        source='created_by.username',
        read_only=True,
        default=''
    )

    class Meta:

        model = Expense

        fields = [
            'id',
            'voucher_number',
            'paid_to',
            'phone_number',
            'date',
            'fund',
            'fund_name',
            'payment_method',
            'payment_method_name',
            'transaction_reference',
            'total_amount',
            'amount_in_words',
            'notes',
            'status',
            'items',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'voucher_number',
            'total_amount',
            'amount_in_words',
            'status',
            'created_by',
            'created_at',
            'updated_at',
        ]

    def validate_items(self, items):

        if not items:

            raise serializers.ValidationError(
                "Add at least one expense item."
            )

        total = sum(
            (item['amount'] for item in items),
            Decimal('0.00')
        )

        if total > Decimal('9999999999.99'):

            raise serializers.ValidationError(
                "Total amount exceeds the allowed limit."
            )

        return items

    @transaction.atomic
    def create(self, validated_data):

        items_data = validated_data.pop('items')

        expense = Expense.objects.create(
            **validated_data,
            created_by=self.context['request'].user,
            status='draft'
        )

        for item_data in items_data:

            ExpenseItem.objects.create(
                expense=expense,
                **item_data
            )

        expense.calculate_total()

        expense.status = 'completed'

        expense.save(
            update_fields=[
                'status',
                'updated_at',
            ]
        )

        return expense