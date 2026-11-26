from django.db import transaction

from rest_framework import (
    viewsets,
    mixins,
    filters,
    status,
)

from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from django_filters.rest_framework import (
    DjangoFilterBackend,
)

from .models import (
    ExpenseCategory,
    Expense,
)

from .serializers import (
    ExpenseCategorySerializer,
    ExpenseSerializer,
)


# ==========================================
# EXPENSE CATEGORY API
# ==========================================

class ExpenseCategoryViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet
):

    queryset = ExpenseCategory.objects.all()

    serializer_class = ExpenseCategorySerializer

    permission_classes = [IsAdminUser]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = ['is_active']

    search_fields = ['name']

    ordering_fields = ['name']

    ordering = ['name']


# ==========================================
# EXPENSE API
# ==========================================

class ExpenseViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
):

    queryset = Expense.objects.select_related(
        'created_by'
    ).prefetch_related(
        'items__category'
    ).all()

    serializer_class = ExpenseSerializer

    permission_classes = [IsAdminUser]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        'date',
        'fund',
        'payment_method',
        'status',
    ]

    search_fields = [
        'voucher_number',
        'paid_to',
        'phone_number',
        'items__particulars',
    ]

    ordering_fields = [
        'date',
        'total_amount',
        'created_at',
    ]

    ordering = [
        '-date',
        '-id',
    ]

    # ======================================
    # CANCEL EXPENSE
    # ======================================

    @action(
        detail=True,
        methods=['post']
    )
    @transaction.atomic
    def cancel(self, request, pk=None):

        if not request.user.is_superuser:

            return Response(
                {
                    'error': (
                        'Only administrators can '
                        'cancel expenses.'
                    )
                },
                status=status.HTTP_403_FORBIDDEN
            )

        expense = self.get_object()

        expense = Expense.objects.select_for_update().get(
            pk=expense.pk
        )

        if expense.status == 'cancelled':

            return Response(
                {
                    'error': 'Expense already cancelled.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        expense.status = 'cancelled'

        expense.save(
            update_fields=[
                'status',
                'updated_at',
            ]
        )

        return Response({
            'message': 'Expense cancelled successfully.',
            'voucher_number': expense.voucher_number,
        })