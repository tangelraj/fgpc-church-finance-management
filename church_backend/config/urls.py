from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static

from django.http import JsonResponse


# ==========================================
# BACKEND HOME
# ==========================================

def home(request):

    return JsonResponse({

        "message": "FGPC Yelahanka Church API",

        "status": "Backend running successfully",

    })


# ==========================================
# URL PATTERNS
# ==========================================

urlpatterns = [

    # Home

    path("", home),


    # Django Admin

    path("admin/", admin.site.urls),


    # Authentication

    path(
        "api/auth/",
        include("accounts.urls"),
    ),


    # Family Management

    path(
        "api/",
        include("families.urls"),
    ),


    # Offering Management

    path(
        "api/",
        include("offerings.urls"),
    ),


    # Cash Receipts

    path(
        "api/receipts/",
        include("receipts.urls"),
    ),


    # Expense Management

    path(
        "api/",
        include("expenses.urls"),
    ),


    # Payment Vouchers

    path(
        "api/vouchers/",
        include("vouchers.urls"),
    ),


    # Dashboard and Reports

    path(
        "api/",
        include("reports.urls"),
    ),


    # Church Settings

    path(
        "api/settings/",
        include("church_settings.urls"),
    ),


    # Database Backup

    path(
        "api/backups/",
        include("backups.urls"),
    ),


    # REST Framework Authentication

    path(
        "api-auth/",
        include("rest_framework.urls"),
    ),

]


# ==========================================
# MEDIA FILES - LOCAL DEVELOPMENT
# ==========================================

if settings.DEBUG:

    urlpatterns += static(

        settings.MEDIA_URL,

        document_root=settings.MEDIA_ROOT,

    )


# ==========================================
# DJANGO ADMIN CUSTOMIZATION
# ==========================================

admin.site.site_header = (
    "FGPC Yelahanka Administration"
)

admin.site.site_title = (
    "FGPC Church Admin"
)

admin.site.index_title = (
    "Church Finance Management"
)