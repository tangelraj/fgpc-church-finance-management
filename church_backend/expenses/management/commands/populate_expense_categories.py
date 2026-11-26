from django.core.management.base import BaseCommand

from expenses.models import ExpenseCategory


class Command(BaseCommand):

    help = "Create default church expense categories"

    def handle(self, *args, **options):

        categories = [

            'Church Rent',
            'Electricity Bill',
            'Water Bill',
            'Pastor Support',
            'Church Maintenance',
            'Building Expenses',
            'Cleaning Expenses',
            'Musical Instruments',
            'Sound System',
            'Church Events',
            'Sunday School',
            'Charity',
            'Missionary Support',
            'Travel Expenses',
            'Food and Refreshments',
            'Printing and Stationery',
            'Denomination Payment',
            'Other Expenses',

        ]

        count = 0

        for name in categories:

            category, created = (
                ExpenseCategory.objects.get_or_create(
                    name=name
                )
            )

            if created:
                count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{count} expense categories "
                "created successfully."
            )
        )