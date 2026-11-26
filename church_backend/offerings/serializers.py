from decimal import Decimal
from django.db import transaction
from rest_framework import serializers

from .models import (
    OfferingCategory,
    Offering,
    OfferingItem,
)


class OfferingCategorySerializer(
    serializers.ModelSerializer
):

    group_name = serializers.CharField(
        source='get_group_display',
        read_only=True
    )

    class Meta:

        model = OfferingCategory

        fields = [
            'id',
            'name',
            'group',
            'group_name',
            'display_order',
            'is_active',
        ]


class OfferingItemSerializer(
    serializers.ModelSerializer
):

    category_name = serializers.CharField(
        source='category.name',
        read_only=True
    )

    category_group = serializers.CharField(
        source='category.group',
        read_only=True
    )

    class Meta:

        model = OfferingItem

        fields = [
            'id',
            'category',
            'category_name',
            'category_group',
            'purpose',
            'amount',
        ]

        read_only_fields = ['id']

    def validate_category(self, value):

        if not value.is_active:

            raise serializers.ValidationError(
                "This offering category is inactive."
            )

        return value


class OfferingSerializer(
    serializers.ModelSerializer
):

    items = OfferingItemSerializer(many=True)

    donor_name = serializers.CharField(
        required=False,
        allow_blank=True
    )

    family_name = serializers.CharField(
        source='family.family_head',
        read_only=True
    )

    family_code = serializers.CharField(
        source='family.family_id',
        read_only=True
    )

    payment_method_name = serializers.CharField(
        source='get_payment_method_display',
        read_only=True
    )

    class Meta:

        model = Offering

        fields = [
            'id',
            'receipt_number',
            'family',
            'family_name',
            'family_code',
            'donor_name',
            'donor_phone',
            'date',
            'payment_method',
            'payment_method_name',
            'transaction_reference',
            'total_amount',
            'amount_in_words',
            'notes',
            'status',
            'items',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'receipt_number',
            'total_amount',
            'amount_in_words',
            'status',
            'created_at',
            'updated_at',
        ]

    def validate(self, attrs):

        family = attrs.get('family')

        donor_name = attrs.get(
            'donor_name', ''
        ).strip()

        items = attrs.get('items', [])

        if not family and not donor_name:

            raise serializers.ValidationError({
                'donor_name':
                    'Select a family or enter donor name.'
            })

        if family and not family.is_active:

            raise serializers.ValidationError({
                'family': 'This family is inactive.'
            })

        if not items:

            raise serializers.ValidationError({
                'items':
                    'Add at least one offering item.'
            })

        total = sum(
            (item['amount'] for item in items),
            Decimal('0.00')
        )

        if total <= 0:

            raise serializers.ValidationError({
                'items':
                    'Total amount must be greater than zero.'
            })

        if total > Decimal('9999999999.99'):

            raise serializers.ValidationError({
                'items': 'Total amount exceeds allowed limit.'
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        items_data = validated_data.pop('items')

        family = validated_data.get('family')

        if family:

            if not validated_data.get('donor_name'):

                validated_data['donor_name'] = (
                    family.family_head
                )

            if not validated_data.get('donor_phone'):

                validated_data['donor_phone'] = (
                    family.whatsapp_number
                    or family.mobile_number
                )

        request = self.context.get('request')

        offering = Offering.objects.create(
            **validated_data,
            created_by=request.user,
            status='draft'
        )

        for item in items_data:

            OfferingItem.objects.create(
                offering=offering,
                **item
            )

        offering.calculate_total()

        offering.status = 'completed'

        offering.save(
            update_fields=[
                'status',
                'updated_at'
            ]
        )

        return offering