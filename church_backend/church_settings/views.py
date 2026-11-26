from django.contrib.auth import get_user_model

from django.contrib.auth.password_validation import (
    validate_password
)

from django.core.exceptions import ValidationError

from rest_framework import status

from rest_framework.decorators import (
    api_view,
    permission_classes,
    parser_classes,
    throttle_classes,
)

from rest_framework.permissions import IsAdminUser

from rest_framework.parsers import (
    JSONParser,
    MultiPartParser,
    FormParser,
)

from rest_framework.response import Response

from rest_framework.authtoken.models import Token

from rest_framework.throttling import UserRateThrottle

from .models import ChurchSettings

from .serializers import ChurchSettingsSerializer


User = get_user_model()


class PasswordChangeThrottle(UserRateThrottle):

    rate = "5/min"


# ======================================
# CHURCH SETTINGS
# ======================================

@api_view(["GET", "PATCH"])
@permission_classes([IsAdminUser])
@parser_classes([
    JSONParser,
    MultiPartParser,
    FormParser
])
def church_settings_view(request):

    church = ChurchSettings.load()

    if request.method == "GET":

        serializer = ChurchSettingsSerializer(
            church,
            context={"request": request}
        )

        return Response(serializer.data)

    if not request.user.is_superuser:

        return Response(
            {
                "detail": (
                    "Only administrators can update "
                    "church settings."
                )
            },
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = ChurchSettingsSerializer(
        church,
        data=request.data,
        partial=True,
        context={"request": request}
    )

    serializer.is_valid(raise_exception=True)

    serializer.save()

    return Response(serializer.data)


# ======================================
# CHANGE PASSWORD
# ======================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
@throttle_classes([PasswordChangeThrottle])
def change_password(request):

    user = request.user

    current_password = request.data.get(
        "current_password", ""
    )

    new_password = request.data.get(
        "new_password", ""
    )

    confirm_password = request.data.get(
        "confirm_password", ""
    )

    if not all(
        isinstance(value, str)
        for value in (
            current_password,
            new_password,
            confirm_password
        )
    ):

        return Response(
            {"detail": "Invalid password values."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not user.check_password(current_password):

        return Response(
            {
                "detail": (
                    "Current password is incorrect."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if new_password != confirm_password:

        return Response(
            {
                "detail": (
                    "New passwords do not match."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if current_password == new_password:

        return Response(
            {
                "detail": (
                    "New password must be different "
                    "from your current password."
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:

        validate_password(
            new_password,
            user=user
        )

    except ValidationError as error:

        return Response(
            {
                "detail": " ".join(error.messages)
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)

    user.save()

    # Invalidate existing login tokens

    Token.objects.filter(user=user).delete()

    return Response({

        "message": (
            "Password changed successfully. "
            "Please log in again."
        )

    })


# ======================================
# STAFF ACCOUNTS
# ======================================

@api_view(["GET"])
@permission_classes([IsAdminUser])
def staff_list(request):

    if not request.user.is_superuser:

        return Response(
            {
                "detail": (
                    "Administrator access required."
                )
            },
            status=status.HTTP_403_FORBIDDEN
        )

    users = User.objects.filter(
        is_staff=True
    ).order_by("username")

    data = [

        {
            "id": user.id,

            "username": user.username,

            "full_name": (
                user.get_full_name()
                or user.username
            ),

            "email": user.email,

            "role": (
                "Administrator"
                if user.is_superuser
                else "Church Staff"
            ),

            "is_active": user.is_active,
        }

        for user in users

    ]

    return Response(data)