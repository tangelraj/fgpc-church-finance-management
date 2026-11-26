from django.db import models


class ChurchSettings(models.Model):

    church_name = models.CharField(
        max_length=250,
        default="FULL GOSPEL PENTECOSTAL CHURCH"
    )

    headquarters = models.CharField(
        max_length=150,
        default="KADAMALAIKUNTU"
    )

    branch_name = models.CharField(
        max_length=150,
        default="YELAHANKA"
    )

    registration_number = models.CharField(
        max_length=100,
        default="64/95"
    )

    registration_details = models.TextField(
        default=(
            "Reg. Society No.64/95 under Tamil Nadu "
            "Societies Registration act 27 of 75 "
            "& under IT act of 1961."
        )
    )

    address = models.TextField(
        default=(
            "Thirumalappa Nagar, Attur 2nd Stage, "
            "Yelahanka, Bangalore - 560064"
        )
    )

    phone = models.CharField(
        max_length=20,
        blank=True
    )

    email = models.EmailField(
        blank=True
    )

    logo = models.ImageField(
        upload_to="church/logo/",
        blank=True,
        null=True
    )

    pastor_name = models.CharField(
        max_length=150,
        blank=True
    )

    cashier_name = models.CharField(
        max_length=150,
        blank=True
    )

    praise_text = models.CharField(
        max_length=150,
        default="PRAISE THE LORD"
    )

    receipt_title = models.CharField(
        max_length=150,
        default="CASH RECEIPT"
    )

    voucher_title = models.CharField(
        max_length=150,
        default="PAYMENT VOUCHER"
    )

    receipt_signature = models.CharField(
        max_length=150,
        default="Pastor / Cashier-in-charge"
    )

    receiver_signature = models.CharField(
        max_length=150,
        default="Receiver Signature"
    )

    cashier_signature = models.CharField(
        max_length=150,
        default="Cashier-in-charge"
    )

    pastor_signature = models.CharField(
        max_length=150,
        default="Pastor"
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:

        verbose_name = "Church Settings"

        verbose_name_plural = "Church Settings"

    def save(self, *args, **kwargs):

        self.pk = 1

        super().save(*args, **kwargs)

    @classmethod
    def load(cls):

        settings, created = cls.objects.get_or_create(
            pk=1
        )

        return settings

    def __str__(self):

        return f"{self.church_name} - {self.branch_name}"