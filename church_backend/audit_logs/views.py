from rest_framework import viewsets
from rest_framework import mixins
from rest_framework import filters

from rest_framework.permissions import BasePermission
from rest_framework.pagination import PageNumberPagination

from django_filters import rest_framework as django_filters

from .models import AuditLog
from .serializers import AuditLogSerializer


class IsSuperUser(BasePermission):

    def has_permission(self, request, view):

        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class AuditLogPagination(PageNumberPagination):

    page_size = 25

    page_size_query_param = "page_size"

    max_page_size = 100


class AuditLogFilter(django_filters.FilterSet):

    start_date = django_filters.DateFilter(
        field_name="created_at",
        lookup_expr="date__gte",
    )

    end_date = django_filters.DateFilter(
        field_name="created_at",
        lookup_expr="date__lte",
    )

    class Meta:

        model = AuditLog

        fields = [
            "module",
            "action",
            "username",
        ]


class AuditLogViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):

    queryset = AuditLog.objects.all()

    serializer_class = AuditLogSerializer

    permission_classes = [IsSuperUser]

    pagination_class = AuditLogPagination

    filter_backends = [
        django_filters.DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_class = AuditLogFilter

    search_fields = [
        "username",
        "reference",
        "description",
    ]

    ordering_fields = [
        "created_at",
        "username",
        "module",
        "action",
    ]

    ordering = [
        "-created_at",
        "-id",
    ]