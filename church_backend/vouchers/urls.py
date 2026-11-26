from django.urls import path

from .views import (
    voucher_pdf,
    download_voucher,
)


app_name = "vouchers"


urlpatterns = [

    path(
        "<int:pk>/pdf/",
        voucher_pdf,
        name="voucher-pdf",
    ),

    path(
        "<int:pk>/download/",
        download_voucher,
        name="download-voucher",
    ),

]