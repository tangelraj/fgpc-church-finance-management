from django.core.exceptions import ValidationError
from django.db import transaction, IntegrityError
from django.utils import timezone

from rest_framework import (
    viewsets,
    filters,
    mixins,
    status,
)

from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
    throttle_classes,
    parser_classes,
    action,
)

from rest_framework.permissions import (
    IsAdminUser,
    AllowAny,
    BasePermission,
)

from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.parsers import JSONParser

from django_filters.rest_framework import (
    DjangoFilterBackend
)

from audit_logs.utils import create_audit_log

from .models import (
    Family,
    FamilyMember,
    RegistrationInvitation,
    FamilyRegistration,
    FamilyRegistrationMember,
)

from .serializers import (
    FamilySerializer,
    FamilyMemberSerializer,
    RegistrationInvitationSerializer,
    PublicFamilyRegistrationSerializer,
    FamilyRegistrationSerializer,
    RegistrationRejectSerializer,
)

from .registration_utils import (
    approve_registration,
    reject_registration,
)


# ==========================================
# SUPERUSER PERMISSION
# ==========================================

class IsSuperUser(BasePermission):

    def has_permission(self, request, view):

        return bool(

            request.user

            and request.user.is_authenticated

            and request.user.is_active

            and request.user.is_superuser

        )


# ==========================================
# PUBLIC API RATE LIMITS
# ==========================================

class InvitationCheckThrottle(AnonRateThrottle):

    scope = "invitation_check"

    rate = "30/min"


class RegistrationSubmitThrottle(AnonRateThrottle):

    scope = "registration_submit"

    rate = "10/hour"


# ==========================================
# EXISTING FAMILY VIEWSET
# ==========================================

class FamilyViewSet(viewsets.ModelViewSet):

    queryset = Family.objects.prefetch_related(
        "members"
    ).all()

    serializer_class = FamilySerializer

    permission_classes = [IsAdminUser]

    http_method_names = [
        "get",
        "post",
        "put",
        "patch",
        "head",
        "options",
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "is_active",
        "joining_date",
    ]

    search_fields = [
        "family_id",
        "family_head",
        "mobile_number",
        "whatsapp_number",
        "members__full_name",
    ]

    ordering_fields = [
        "family_id",
        "family_head",
        "joining_date",
        "created_at",
    ]

    ordering = ["family_head"]


# ==========================================
# EXISTING FAMILY MEMBER VIEWSET
# ==========================================

class FamilyMemberViewSet(viewsets.ModelViewSet):

    queryset = FamilyMember.objects.select_related(
        "family"
    ).all()

    serializer_class = FamilyMemberSerializer

    permission_classes = [IsAdminUser]

    http_method_names = [
        "get",
        "post",
        "put",
        "patch",
        "head",
        "options",
    ]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "family",
        "relationship",
        "gender",
        "is_active",
        "is_baptized",
    ]

    search_fields = [
        "full_name",
        "family__family_head",
        "mobile_number",
    ]

    ordering_fields = [
        "full_name",
        "date_of_birth",
        "created_at",
    ]


# ==========================================
# REGISTRATION INVITATION API
# ==========================================

class RegistrationInvitationViewSet(

    mixins.ListModelMixin,

    mixins.RetrieveModelMixin,

    mixins.CreateModelMixin,

    viewsets.GenericViewSet,

):

    queryset = (
        RegistrationInvitation.objects
        .select_related("created_by")
        .all()
    )

    serializer_class = (
        RegistrationInvitationSerializer
    )

    permission_classes = [IsSuperUser]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "is_active",
        "is_used",
    ]

    search_fields = [
        "title",
        "invited_name",
        "invited_mobile",
    ]

    ordering_fields = [
        "created_at",
        "expires_at",
    ]

    ordering = ["-created_at"]

    @transaction.atomic
    def perform_create(self, serializer):

        invitation = serializer.save()

        create_audit_log(

            user=self.request.user,

            module="families",

            action="created",

            reference=str(
                invitation.invitation_id
            ),

            description=(
                "Family registration invitation "
                "created from frontend."
            ),

        )

    # ======================================
    # DISABLE INVITATION
    # ======================================

    @action(
        detail=True,
        methods=["post"]
    )
    @transaction.atomic
    def disable(self, request, pk=None):

        invitation = self.get_object()

        invitation = (
            RegistrationInvitation.objects
            .select_for_update()
            .get(pk=invitation.pk)
        )

        if invitation.is_used:

            return Response(
                {
                    "detail": (
                        "This invitation has already been used."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not invitation.is_active:

            return Response({
                "message": "Invitation is already disabled."
            })

        invitation.is_active = False

        invitation.save(
            update_fields=["is_active"]
        )

        create_audit_log(

            user=request.user,

            module="families",

            action="updated",

            reference=str(
                invitation.invitation_id
            ),

            description=(
                "Family registration invitation disabled."
            ),

        )

        return Response({
            "message": "Invitation disabled successfully."
        })


# ==========================================
# PUBLIC INVITATION VALIDATION API
# ==========================================

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([InvitationCheckThrottle])
@parser_classes([JSONParser])
def validate_registration_invitation(request):

    token = request.data.get("token", "")

    if not isinstance(token, str):

        return Response(
            {
                "valid": False,
                "detail": "Invalid invitation."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    token = token.strip()

    if not token or len(token) > 64:

        return Response(
            {
                "valid": False,
                "detail": "Invalid invitation."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    invitation = (
        RegistrationInvitation.objects
        .filter(token=token)
        .first()
    )

    if not invitation or not invitation.is_valid:

        return Response(
            {
                "valid": False,
                "detail": (
                    "This registration link is invalid, "
                    "expired, disabled or already used."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    return Response({

        "valid": True,

        "church_name": (
            "FULL GOSPEL PENTECOSTAL CHURCH"
        ),

        "branch_name": "YELAHANKA",

        "expires_at": invitation.expires_at,

    })


# ==========================================
# PUBLIC FAMILY REGISTRATION SUBMISSION
# ==========================================

@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
@throttle_classes([RegistrationSubmitThrottle])
@parser_classes([JSONParser])
def submit_family_registration(request):

    serializer = PublicFamilyRegistrationSerializer(
        data=request.data
    )

    serializer.is_valid(
        raise_exception=True
    )

    data = dict(serializer.validated_data)

    token = data.pop("token")

    members = data.pop("members", [])

    try:

        with transaction.atomic():

            invitation = (
                RegistrationInvitation.objects
                .select_for_update()
                .filter(token=token)
                .first()
            )

            if not invitation or not invitation.is_valid:

                return Response(
                    {
                        "detail": (
                            "This registration link is invalid, "
                            "expired, disabled or already used."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check duplicate registration

            if FamilyRegistration.objects.filter(

                invitation=invitation

            ).exists():

                return Response(
                    {
                        "detail": (
                            "This invitation has already "
                            "been submitted."
                        )
                    },
                    status=status.HTTP_409_CONFLICT
                )

            # Save family registration

            registration = (
                FamilyRegistration.objects.create(

                    invitation=invitation,

                    **data,

                    consent_at=timezone.now(),

                    status="pending",

                )
            )

            # Save all family members

            FamilyRegistrationMember.objects.bulk_create([

                FamilyRegistrationMember(

                    registration=registration,

                    **member

                )

                for member in members

            ])

            # Mark invitation as used

            invitation.is_used = True

            invitation.used_at = timezone.now()

            invitation.save(
                update_fields=[
                    "is_used",
                    "used_at",
                ]
            )

            # Save audit activity

            create_audit_log(

                user=None,

                module="families",

                action="created",

                reference=str(
                    registration.registration_id
                ),

                description=(
                    "New public family registration "
                    "submitted for administrator approval."
                ),

            )

    except IntegrityError:

        return Response(
            {
                "detail": (
                    "Registration could not be saved. "
                    "The invitation may already be used."
                )
            },
            status=status.HTTP_409_CONFLICT
        )

    return Response(
        {
            "message": (
                "Family registration submitted successfully. "
                "Please wait for administrator approval."
            ),

            "registration_id": str(
                registration.registration_id
            ),

            "status": "pending",

        },
        status=status.HTTP_201_CREATED
    )


# ==========================================
# ADMIN REGISTRATION REQUEST API
# ==========================================

class FamilyRegistrationViewSet(

    mixins.ListModelMixin,

    mixins.RetrieveModelMixin,

    viewsets.GenericViewSet,

):

    queryset = (
        FamilyRegistration.objects
        .select_related(
            "approved_family",
            "reviewed_by",
            "invitation",
        )
        .prefetch_related("members")
        .all()
    )

    serializer_class = FamilyRegistrationSerializer

    permission_classes = [IsSuperUser]

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]

    filterset_fields = [
        "status",
    ]

    search_fields = [
        "family_head",
        "mobile_number",
        "whatsapp_number",
        "email",
        "members__full_name",
    ]

    ordering_fields = [
        "submitted_at",
        "family_head",
        "reviewed_at",
    ]

    ordering = ["-submitted_at"]

    # ======================================
    # APPROVE REGISTRATION
    # ======================================

    @action(
        detail=True,
        methods=["post"]
    )
    def approve(self, request, pk=None):

        registration = self.get_object()

        try:

            family = approve_registration(

                registration.pk,

                request.user,

            )

        except ValidationError as error:

            return Response(
                {
                    "detail": " ".join(error.messages)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({

            "message": (
                "Family registration approved successfully."
            ),

            "family_id": family.family_id,

            "family_pk": family.pk,

            "status": "approved",

        })

    # ======================================
    # REJECT REGISTRATION
    # ======================================

    @action(
        detail=True,
        methods=["post"]
    )
    def reject(self, request, pk=None):

        registration = self.get_object()

        serializer = RegistrationRejectSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:

            reject_registration(

                registration.pk,

                request.user,

                serializer.validated_data["reason"],

            )

        except ValidationError as error:

            return Response(
                {
                    "detail": " ".join(error.messages)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({

            "message": (
                "Family registration rejected successfully."
            ),

            "status": "rejected",

        })

    # ======================================
    # REGISTRATION SUMMARY
    # ======================================

    @action(
        detail=False,
        methods=["get"]
    )
    def summary(self, request):

        registrations = FamilyRegistration.objects.all()

        return Response({

            "total": registrations.count(),

            "pending": registrations.filter(
                status="pending"
            ).count(),

            "approved": registrations.filter(
                status="approved"
            ).count(),

            "rejected": registrations.filter(
                status="rejected"
            ).count(),

        })