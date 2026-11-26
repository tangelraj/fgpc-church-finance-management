from rest_framework import status

from rest_framework.decorators import (
    api_view,
    permission_classes,
    throttle_classes,
)

from rest_framework.permissions import (
    AllowAny,
    IsAdminUser,
)

from rest_framework.response import Response

from rest_framework.authtoken.models import Token

from rest_framework.throttling import AnonRateThrottle

from .serializers import LoginSerializer


# ==========================================
# LOGIN RATE LIMIT
# ==========================================

class LoginThrottle(AnonRateThrottle):

    rate = '10/min'


# ==========================================
# USER INFORMATION
# ==========================================

def user_data(user):

    return {

        'id': user.id,

        'username': user.username,

        'first_name': user.first_name,

        'last_name': user.last_name,

        'full_name': (
            user.get_full_name() or user.username
        ),

        'email': user.email,

        'is_staff': user.is_staff,

        'is_superuser': user.is_superuser,

        'role': (
            'Administrator'
            if user.is_superuser
            else 'Church Staff'
        ),

    }


# ==========================================
# LOGIN API
# ==========================================

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login_view(request):

    serializer = LoginSerializer(

        data=request.data,

        context={'request': request}

    )

    serializer.is_valid(
        raise_exception=True
    )

    user = serializer.validated_data['user']

    token, created = Token.objects.get_or_create(
        user=user
    )

    return Response({

        'message': 'Login successful',

        'token': token.key,

        'user': user_data(user),

    }, status=status.HTTP_200_OK)


# ==========================================
# CURRENT USER API
# ==========================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def profile_view(request):

    return Response(
        user_data(request.user)
    )


# ==========================================
# LOGOUT API
# ==========================================

@api_view(['POST'])
@permission_classes([IsAdminUser])
def logout_view(request):

    Token.objects.filter(
        user=request.user
    ).delete()

    return Response({

        'message': 'Logout successful'

    }, status=status.HTTP_200_OK)