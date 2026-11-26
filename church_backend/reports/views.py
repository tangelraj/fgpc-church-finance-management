from decimal import Decimal
from datetime import date

from django.db.models import Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.utils.dateparse import parse_date

from rest_framework.decorators import (
    api_view,
    permission_classes,
)

from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework import status

from families.models import Family, FamilyMember
from offerings.models import Offering, OfferingItem
from expenses.models import Expense


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def get_total(queryset, field):

    return queryset.aggregate(
        total=Sum(field)
    )['total'] or Decimal('0.00')


def money(value):

    return f"{value:.2f}"


# ==========================================
# DASHBOARD API
# ==========================================

@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_summary(request):

    today = timezone.localdate()

    # ======================================
    # OPTIONAL DATE FILTER
    # ======================================

    start_date = request.query_params.get(
        'start_date'
    )

    end_date = request.query_params.get(
        'end_date'
    )

    try:

        start = (
            parse_date(start_date)
            if start_date else None
        )

        end = (
            parse_date(end_date)
            if end_date else None
        )

    except ValueError:

        return Response(
            {'error': 'Invalid date.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if (start_date and not start) or (
        end_date and not end
    ):

        return Response(
            {
                'error': 'Use YYYY-MM-DD date format.'
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if start and end and start > end:

        return Response(
            {
                'error': (
                    'Start date cannot be after end date.'
                )
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # ======================================
    # COMPLETED RECORDS ONLY
    # ======================================

    offerings = Offering.objects.filter(
        status='completed'
    )

    expenses = Expense.objects.filter(
        status='completed'
    )

    if start:

        offerings = offerings.filter(
            date__gte=start
        )

        expenses = expenses.filter(
            date__gte=start
        )

    if end:

        offerings = offerings.filter(
            date__lte=end
        )

        expenses = expenses.filter(
            date__lte=end
        )

    # ======================================
    # TOTAL INCOME AND EXPENSES
    # ======================================

    total_income = get_total(
        offerings,
        'total_amount'
    )

    total_expenses = get_total(
        expenses,
        'total_amount'
    )

    available_balance = (
        total_income - total_expenses
    )

    # ======================================
    # LOCAL CHURCH FUND
    # ======================================

    local_income = get_total(

        OfferingItem.objects.filter(
            offering__in=offerings,
            category__group='local'
        ),

        'amount'
    )

    local_expenses = get_total(

        expenses.filter(
            fund='local'
        ),

        'total_amount'
    )

    local_balance = (
        local_income - local_expenses
    )

    # ======================================
    # DENOMINATION FUND
    # ======================================

    denomination_income = get_total(

        OfferingItem.objects.filter(
            offering__in=offerings,
            category__group='denomination'
        ),

        'amount'
    )

    denomination_expenses = get_total(

        expenses.filter(
            fund='denomination'
        ),

        'total_amount'
    )

    denomination_balance = (
        denomination_income
        - denomination_expenses
    )

    # ======================================
    # FAMILY AND MEMBER COUNTS
    # ======================================

    total_families = Family.objects.filter(
        is_active=True
    ).count()

    total_members = (

        FamilyMember.objects.filter(
            is_active=True,
            family__is_active=True
        ).count()

        + total_families
    )

    # ======================================
    # TODAY'S TRANSACTIONS
    # ======================================

    today_income = get_total(

        offerings.filter(
            date=today
        ),

        'total_amount'
    )

    today_expenses = get_total(

        expenses.filter(
            date=today
        ),

        'total_amount'
    )

    # ======================================
    # MONTHLY CHART DATA
    # ======================================

    month_start = date(
        today.year,
        today.month,
        1
    )

    months = []

    # Generate the last six months

    for offset in range(5, -1, -1):

        month_index = (
            month_start.year * 12
            + month_start.month
            - 1
            - offset
        )

        year, month = divmod(
            month_index,
            12
        )

        months.append(
            date(year, month + 1, 1)
        )

    # ======================================
    # MONTHLY INCOME
    # ======================================

    income_by_month = {

        row['month']: row['total']

        for row in offerings.filter(

            date__gte=months[0],
            date__lte=today

        ).order_by().annotate(

            month=TruncMonth('date')

        ).values(

            'month'

        ).annotate(

            total=Sum('total_amount')

        ).order_by('month')

    }

    # ======================================
    # MONTHLY EXPENSES
    # ======================================

    expenses_by_month = {

        row['month']: row['total']

        for row in expenses.filter(

            date__gte=months[0],
            date__lte=today

        ).order_by().annotate(

            month=TruncMonth('date')

        ).values(

            'month'

        ).annotate(

            total=Sum('total_amount')

        ).order_by('month')

    }

    # ======================================
    # PREPARE MONTHLY CHART RESPONSE
    # ======================================

    monthly_chart = []

    for month in months:

        monthly_chart.append({

            'month': month.strftime('%b %Y'),

            'income': money(
                income_by_month.get(
                    month,
                    Decimal('0.00')
                )
            ),

            'expenses': money(
                expenses_by_month.get(
                    month,
                    Decimal('0.00')
                )
            ),

        })

    # ======================================
    # RECENT OFFERINGS
    # ======================================

    recent_offerings = []

    for offering in offerings.order_by(
        '-date',
        '-id'
    )[:5]:

        recent_offerings.append({

            'id': offering.id,

            'receipt_number': (
                offering.receipt_number
            ),

            'donor_name': offering.donor_name,

            'date': offering.date,

            'amount': money(
                offering.total_amount
            ),

            'payment_method': (
                offering.get_payment_method_display()
            ),

        })

    # ======================================
    # RECENT EXPENSES
    # ======================================

    recent_expenses = []

    for expense in expenses.order_by(
        '-date',
        '-id'
    )[:5]:

        recent_expenses.append({

            'id': expense.id,

            'voucher_number': (
                expense.voucher_number
            ),

            'paid_to': expense.paid_to,

            'date': expense.date,

            'amount': money(
                expense.total_amount
            ),

            'fund': expense.get_fund_display(),

        })

    # ======================================
    # OFFERING CATEGORY SUMMARY
    # ======================================

    category_summary = (

        OfferingItem.objects.filter(
            offering__in=offerings
        )

        .order_by()

        .values(
            'category__name',
            'category__group'
        )

        .annotate(
            total=Sum('amount')
        )

        .order_by('-total')

    )

    category_data = [

        {

            'category': row['category__name'],

            'group': row['category__group'],

            'amount': money(row['total']),

        }

        for row in category_summary

    ]

    # ======================================
    # FINAL RESPONSE
    # ======================================

    return Response({

        'summary': {

            'total_income': money(
                total_income
            ),

            'total_expenses': money(
                total_expenses
            ),

            'available_balance': money(
                available_balance
            ),

            'total_families': total_families,

            'total_members': total_members,

            'total_receipts': offerings.count(),

            'total_vouchers': expenses.count(),

            'today_income': money(
                today_income
            ),

            'today_expenses': money(
                today_expenses
            ),

        },

        'local_fund': {

            'income': money(local_income),

            'expenses': money(local_expenses),

            'balance': money(local_balance),

        },

        'denomination_fund': {

            'income': money(
                denomination_income
            ),

            'expenses': money(
                denomination_expenses
            ),

            'balance': money(
                denomination_balance
            ),

        },

        'monthly_chart': monthly_chart,

        'recent_offerings': recent_offerings,

        'recent_expenses': recent_expenses,

        'offering_categories': category_data,

    })