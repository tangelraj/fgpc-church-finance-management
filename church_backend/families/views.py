from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from .models import Family, FamilyMember
from .serializers import (
    FamilySerializer,
    FamilyMemberSerializer,
)


class FamilyViewSet(viewsets.ModelViewSet):

    queryset = Family.objects.prefetch_related(
        'members'
    ).all()

    serializer_class = FamilySerializer

    permission_classes = [IsAdminUser]

    http_method_names = [
        'get', 'post', 'put', 'patch', 'head', 'options'
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        'is_active',
        'joining_date',
    ]

    search_fields = [
        'family_id',
        'family_head',
        'mobile_number',
        'whatsapp_number',
        'members__full_name',
    ]

    ordering_fields = [
        'family_id',
        'family_head',
        'joining_date',
        'created_at',
    ]

    ordering = ['family_head']


class FamilyMemberViewSet(viewsets.ModelViewSet):

    queryset = FamilyMember.objects.select_related(
        'family'
    ).all()

    serializer_class = FamilyMemberSerializer

    permission_classes = [IsAdminUser]

    http_method_names = [
        'get', 'post', 'put', 'patch', 'head', 'options'
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        'family',
        'relationship',
        'gender',
        'is_active',
        'is_baptized',
    ]

    search_fields = [
        'full_name',
        'family__family_head',
        'mobile_number',
    ]

    ordering_fields = [
        'full_name',
        'date_of_birth',
        'created_at',
    ]