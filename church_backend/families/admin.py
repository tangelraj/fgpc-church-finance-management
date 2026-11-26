from django.contrib import admin
from .models import Family, FamilyMember


class FamilyMemberInline(admin.TabularInline):

    model = FamilyMember

    extra = 1

    fields = (
        'full_name',
        'relationship',
        'gender',
        'date_of_birth',
        'mobile_number',
        'occupation',
        'is_baptized',
        'is_active',
    )


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):

    list_display = (
        'family_id',
        'family_head',
        'mobile_number',
        'whatsapp_number',
        'total_members',
        'joining_date',
        'is_active',
    )

    search_fields = (
        'family_id',
        'family_head',
        'mobile_number',
        'whatsapp_number',
        'members__full_name',
    )

    list_filter = (
        'is_active',
        'joining_date',
    )

    readonly_fields = (
        'family_id',
        'created_at',
        'updated_at',
    )

    list_per_page = 20

    inlines = [FamilyMemberInline]

    fieldsets = (
        ('Family Information', {
            'fields': (
                'family_id',
                'family_head',
                'photo',
                'joining_date',
                'is_active',
            )
        }),

        ('Contact Information', {
            'fields': (
                'mobile_number',
                'whatsapp_number',
                'email',
                'address',
            )
        }),

        ('Additional Information', {
            'fields': (
                'notes',
                'created_at',
                'updated_at',
            )
        }),
    )

    @admin.display(description='Total Members')
    def total_members(self, obj):
        return obj.members.filter(is_active=True).count() + 1


@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):

    list_display = (
        'full_name',
        'family',
        'relationship',
        'gender',
        'date_of_birth',
        'is_baptized',
        'is_active',
    )

    search_fields = (
        'full_name',
        'family__family_head',
        'mobile_number',
    )

    list_filter = (
        'relationship',
        'gender',
        'is_baptized',
        'is_active',
    )