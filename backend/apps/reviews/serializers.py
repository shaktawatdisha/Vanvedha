from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'user', 'rating', 'title', 'body', 'is_approved', 'created_at')
        read_only_fields = ('id', 'user', 'is_approved', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['product'] = self.context['product']
        return super().create(validated_data)
