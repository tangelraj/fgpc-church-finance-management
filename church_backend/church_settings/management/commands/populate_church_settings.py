from django.core.management.base import BaseCommand
from django.db import transaction

from church_settings.models import ChurchSettings


class Command(BaseCommand):

    help = "Create default FGPC Yelahanka church settings"

    @transaction.atomic
    def handle(self, *args, **options):

        church_settings, created = (
            ChurchSettings.objects.get_or_create(
                pk=1,
                defaults={

                    # ==============================
                    # CHURCH INFORMATION
                    # ==============================

                    "church_name": (
                        "FULL GOSPEL PENTECOSTAL CHURCH"
                    ),

                    "headquarters": "KADAMALAIKUNTU",

                    "branch_name": "YELAHANKA",

                    "registration_number": "64/95",

                    "registration_details": (
                        "Reg. Society No.64/95 under Tamil Nadu "
                        "Societies Registration act 27 of 75 "
                        "& under IT act of 1961."
                    ),

                    "address": (
                        "Thirumalappa Nagar, Attur 2nd Stage, "
                        "Yelahanka, Bangalore - 560064"
                    ),

                    # ==============================
                    # CONTACT INFORMATION
                    # ==============================

                    "phone": "",

                    "email": "",

                    "pastor_name": "",

                    "cashier_name": "",

                    # ==============================
                    # RECEIPT SETTINGS
                    # ==============================

                    "praise_text": "PRAISE THE LORD",

                    "receipt_title": "CASH RECEIPT",

                    "receipt_signature": (
                        "Pastor / Cashier-in-charge"
                    ),

                    # ==============================
                    # VOUCHER SETTINGS
                    # ==============================

                    "voucher_title": "PAYMENT VOUCHER",

                    "receiver_signature": (
                        "Receiver Signature"
                    ),

                    "cashier_signature": (
                        "Cashier-in-charge"
                    ),

                    "pastor_signature": "Pastor",

                }
            )
        )

        if created:

            self.stdout.write(
                self.style.SUCCESS(
                    "Church settings created successfully."
                )
            )

        else:

            self.stdout.write(
                self.style.SUCCESS(
                    "Church settings already exist. "
                    "Existing details preserved."
                )
            )

        self.stdout.write(
            f"Church: {church_settings.church_name}"
        )

        self.stdout.write(
            f"Branch: {church_settings.branch_name}"
        )