from django.http import FileResponse
from django.shortcuts import get_object_or_404

from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAdminUser

from expenses.models import Expense

from .pdf_generator import generate_voucher_pdf


# ==========================================
# VIEW AND PRINT VOUCHER
# ==========================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def voucher_pdf(request, pk):

    expense = get_object_or_404(

        Expense.objects.prefetch_related(
            'items__category'
        ),

        pk=pk,

        status='completed'
    )

    pdf_buffer = generate_voucher_pdf(
        expense
    )

    response = FileResponse(

        pdf_buffer,

        content_type='application/pdf',

        as_attachment=False,

        filename=f"{expense.voucher_number}.pdf"
    )

    response['Cache-Control'] = 'private, no-store'

    return response


# ==========================================
# DOWNLOAD VOUCHER
# ==========================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def download_voucher(request, pk):

    expense = get_object_or_404(

        Expense.objects.prefetch_related(
            'items__category'
        ),

        pk=pk,

        status='completed'
    )

    pdf_buffer = generate_voucher_pdf(
        expense
    )

    response = FileResponse(

        pdf_buffer,

        content_type='application/pdf',

        as_attachment=True,

        filename=f"{expense.voucher_number}.pdf"
    )

    response['Cache-Control'] = 'private, no-store'

    return response