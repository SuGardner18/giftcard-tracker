# accounts/serializers.py
#serializer does the user creation
from rest_framework.serializers import ModelSerializer
from django.contrib.auth.models import User


class SignupSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = ["username", "email", "password"]
        extra_kwargs = {
            "password": {"write_only": True},
            "email": {"required": True, "allow_blank": False},
        }

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)