from django.http import FileResponse
from django.shortcuts import get_object_or_404

from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAdminUser

from offerings.models import Offering

from .pdf_generator import generate_receipt_pdf


@api_view(['GET'])
@permission_classes([IsAdminUser])
def receipt_pdf(request, pk):

    offering = get_object_or_404(
        Offering.objects.prefetch_related(
            'items__category'
        ),
        pk=pk,
        status='completed'
    )

    pdf_buffer = generate_receipt_pdf(
        offering
    )

    filename = (
        f"{offering.receipt_number}.pdf"
    )

    response = FileResponse(
        pdf_buffer,
        content_type='application/pdf',
        as_attachment=False,
        filename=filename
    )

    response['Cache-Control'] = 'private, no-store'

    return response


@api_view(['GET'])
@permission_classes([IsAdminUser])
def download_receipt(request, pk):

    offering = get_object_or_404(
        Offering.objects.prefetch_related(
            'items__category'
        ),
        pk=pk,
        status='completed'
    )

    pdf_buffer = generate_receipt_pdf(
        offering
    )

    filename = (
        f"{offering.receipt_number}.pdf"
    )

    response = FileResponse(
        pdf_buffer,
        content_type='application/pdf',
        as_attachment=True,
        filename=filename
    )

    response['Cache-Control'] = 'private, no-store'

    return response