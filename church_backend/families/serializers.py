from rest_framework import serializers
from .models import Family, FamilyMember


class FamilyMemberSerializer(serializers.ModelSerializer):

    family_name = serializers.CharField(
        source='family.family_head',
        read_only=True
    )

    class Meta:
        model = FamilyMember

        fields = [
            'id',
            'family',
            'family_name',
            'full_name',
            'relationship',
            'gender',
            'date_of_birth',
            'mobile_number',
            'occupation',
            'is_baptized',
            'is_active',
            'created_at',
        ]

        read_only_fields = ['id', 'created_at']


class FamilySerializer(serializers.ModelSerializer):

    members = FamilyMemberSerializer(
        many=True,
        read_only=True
    )

    total_members = serializers.SerializerMethodField()

    class Meta:
        model = Family

        fields = [
            'id',
            'family_id',
            'family_head',
            'mobile_number',
            'whatsapp_number',
            'email',
            'address',
            'photo',
            'joining_date',
            'is_active',
            'notes',
            'total_members',
            'members',
            'created_at',
            'updated_at',
        ]

        read_only_fields = [
            'id',
            'family_id',
            'created_at',
            'updated_at',
        ]

    def get_total_members(self, obj):
        return obj.members.filter(
            is_active=True
        ).count() + 1