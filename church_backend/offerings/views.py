from rest_framework import viewsets, filters, mixins
from rest_framework.permissions import IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction

from .models import OfferingCategory, Offering

from .serializers import (
    OfferingCategorySerializer,
    OfferingSerializer,
)


class OfferingCategoryViewSet(
    viewsets.ModelViewSet
):

    queryset = OfferingCategory.objects.all()

    serializer_class = OfferingCategorySerializer

    permission_classes = [IsAdminUser]

    http_method_names = [
        'get',
        'post',
        'put',
        'patch',
        'head',
        'options',
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
    ]

    filterset_fields = [
        'group',
        'is_active',
    ]

    search_fields = ['name']


class OfferingViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet
):

    queryset = Offering.objects.select_related(
        'family',
        'created_by'
    ).prefetch_related(
        'items__category'
    ).all()

    serializer_class = OfferingSerializer

    permission_classes = [IsAdminUser]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = {
        'family': ['exact'],
        'date': ['exact', 'gte', 'lte'],
        'payment_method': ['exact'],
        'status': ['exact'],
    }

    search_fields = [
        'receipt_number',
        'donor_name',
        'donor_phone',
        'family__family_id',
        'family__family_head',
    ]

    ordering_fields = [
        'date',
        'total_amount',
        'created_at',
    ]

    ordering = ['-date', '-id']

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def cancel(self, request, pk=None):

        if not request.user.is_superuser:

            return Response(
                {
                    'error':
                        'Only administrators can cancel receipts.'
                },
                status=status.HTTP_403_FORBIDDEN
            )

        offering = Offering.objects.select_for_update().get(
            pk=self.get_object().pk
        )

        if offering.status == 'cancelled':

            return Response(
                {'error': 'Receipt already cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        offering.status = 'cancelled'

        offering.save(
            update_fields=[
                'status',
                'updated_at'
            ]
        )

        return Response({
            'message': 'Receipt cancelled successfully.',
            'receipt_number': offering.receipt_number
        })