from rest_framework import viewsets, permissions
from .models import Recipe
from .serializers import RecipeSerializer
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods


class RecipeViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and editing Recipe instances.
    Provides CRUD operations for recipes.
    """
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can access

    def get_queryset(self):
        """
        This view should return a list of all the recipes
        for the currently authenticated user.
        """
        # Ensure only recipes belonging to the current user are returned
        return Recipe.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        """
        When creating a recipe, automatically assign the logged-in user as the creator.
        """
        # This method is called when a new object instance is saved.
        # It ensures the 'user' field of the Recipe is set to the current request's user.
        serializer.save(user=self.request.user)

def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({'csrfToken': token})

@require_http_methods(["GET"])
def get_csrf_token(request):
    token = get_token(request)
    return JsonResponse({'csrfToken': token})