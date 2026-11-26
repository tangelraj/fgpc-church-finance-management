from django.db import models
from django.utils import timezone


class Family(models.Model):

    family_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        editable=False
    )

    family_head = models.CharField(max_length=150)

    mobile_number = models.CharField(max_length=15)

    whatsapp_number = models.CharField(
        max_length=15,
        blank=True
    )

    email = models.EmailField(blank=True)

    address = models.TextField(blank=True)

    photo = models.ImageField(
        upload_to='families/',
        blank=True,
        null=True
    )

    joining_date = models.DateField(
        default=timezone.localdate
    )

    is_active = models.BooleanField(default=True)

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Family"
        verbose_name_plural = "Families"
        ordering = ['family_head']

    def save(self, *args, **kwargs):

        super().save(*args, **kwargs)

        if not self.family_id:
            self.family_id = f"FAM-{self.pk:04d}"

            super().save(update_fields=['family_id'])

    def __str__(self):
        return f"{self.family_id} - {self.family_head}"


class FamilyMember(models.Model):

    RELATIONSHIP_CHOICES = [
        ('husband', 'Husband'),
        ('wife', 'Wife'),
        ('son', 'Son'),
        ('daughter', 'Daughter'),
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('brother', 'Brother'),
        ('sister', 'Sister'),
        ('other', 'Other'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        related_name='members'
    )

    full_name = models.CharField(max_length=150)

    relationship = models.CharField(
        max_length=20,
        choices=RELATIONSHIP_CHOICES
    )

    gender = models.CharField(
        max_length=10,
        choices=GENDER_CHOICES,
        blank=True
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True
    )

    mobile_number = models.CharField(
        max_length=15,
        blank=True
    )

    occupation = models.CharField(
        max_length=100,
        blank=True
    )

    is_baptized = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Family Member"
        verbose_name_plural = "Family Members"
        ordering = ['id']

    def __str__(self):
        return self.full_name