from rest_framework import serializers
from .models import Recipe

class RecipeSerializer(serializers.ModelSerializer):
    # Read-only field to display the username of the recipe creator
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Recipe
        fields = [
            'id', 'user', 'username', 'title', 'description', 'cuisine_type', 
            'ingredients', 'instructions', 'image_url', 
            'external_link', 'created_at', 'updated_at'
        ]
        # 'user' is read-only because it's set by perform_create, not sent by the client
        read_only_fields = ['user', 'created_at', 'updated_at'] 