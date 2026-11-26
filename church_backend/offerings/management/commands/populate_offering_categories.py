from django.core.management.base import BaseCommand
from offerings.models import OfferingCategory


class Command(BaseCommand):

    help = "Create default church offering categories"

    def handle(self, *args, **options):

        categories = [

            # Local Church

            ('Tithe', 'local', 1),
            ('Offering', 'local', 2),
            ('Building Fund', 'local', 3),
            ('Poor Fund', 'local', 4),
            ('Other Local Offering', 'local', 5),

            # Denomination

            ('North India', 'denomination', 8),
            ('Charity', 'denomination', 9),
            ('Bible School', 'denomination', 10),
            ('H.Q', 'denomination', 11),
            ('Zerubbabel Fund', 'denomination', 12),
            ('Other Denomination Offering',
             'denomination', 13),
        ]

        created_count = 0

        for name, group, order in categories:

            category, created = (
                OfferingCategory.objects.get_or_create(
                    name=name,
                    group=group,
                    defaults={
                        'display_order': order,
                        'is_active': True,
                    }
                )
            )

            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"{created_count} offering categories "
                "created successfully."
            )
        )