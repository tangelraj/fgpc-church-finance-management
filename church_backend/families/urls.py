from django.urls import path, include

from rest_framework.routers import DefaultRouter

from .views import (

    FamilyViewSet,

    FamilyMemberViewSet,

    RegistrationInvitationViewSet,

    FamilyRegistrationViewSet,

    validate_registration_invitation,

    submit_family_registration,

)


router = DefaultRouter()


# Existing family APIs

router.register(

    r"families",

    FamilyViewSet,

    basename="families"

)

router.register(

    r"family-members",

    FamilyMemberViewSet,

    basename="family-members"

)


# Registration invitation APIs

router.register(

    r"registration-invitations",

    RegistrationInvitationViewSet,

    basename="registration-invitations"

)


# Registration request APIs

router.register(

    r"family-registrations",

    FamilyRegistrationViewSet,

    basename="family-registrations"

)


urlpatterns = [

    # Public registration APIs

    path(

        "public/family-registration/validate/",

        validate_registration_invitation,

        name="validate-registration-invitation"

    ),

    path(

        "public/family-registration/submit/",

        submit_family_registration,

        name="submit-family-registration"

    ),

    # Admin APIs

    path("", include(router.urls)),

]