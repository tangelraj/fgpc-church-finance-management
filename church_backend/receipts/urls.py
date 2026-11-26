from django.urls import path

from .views import (
    receipt_pdf,
    download_receipt,
)


app_name = "receipts"


urlpatterns = [

    path(
        "<int:pk>/pdf/",
        receipt_pdf,
        name="receipt-pdf",
    ),

    path(
        "<int:pk>/download/",
        download_receipt,
        name="download-receipt",
    ),

]