from django.contrib.auth import authenticate

from rest_framework import serializers


class LoginSerializer(serializers.Serializer):

    username = serializers.CharField()

    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False
    )

    def validate(self, data):

        username = data.get('username')

        password = data.get('password')

        user = authenticate(

            request=self.context.get('request'),

            username=username,

            password=password

        )

        if user is None:

            raise serializers.ValidationError(
                "Invalid username or password."
            )

        if not user.is_active:

            raise serializers.ValidationError(
                "Your account is inactive."
            )

        if not user.is_staff:

            raise serializers.ValidationError(
                "You are not authorized to access this system."
            )

        data['user'] = user

        return data
        