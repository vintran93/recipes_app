from rest_framework import viewsets, permissions
from .models import Recipe
from .serializers import RecipeSerializer
from django.middleware.csrf import get_token
from django.http import JsonResponse
from rest_framework.views import APIView # Import APIView

class RecipeViewSet(viewsets.ModelViewSet):
    """
    A ViewSet for viewing and editing Recipe instances.
    Provides CRUD operations for recipes.
    """
    serializer_class = RecipeSerializer
    permission_classes = [permissions.IsAuthenticated] # Only authenticated users can access
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] # Explicitly allow all common methods

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
        serializer.save(user=self.request.user)

class CSRFTokenView(APIView):
    """
    A simple API view to return the CSRF token.
    This helps frontend applications explicitly fetch the token.
    """
    permission_classes = [permissions.AllowAny] # Allow any user to get the token

    def get(self, request):
        token = get_token(request)
        return JsonResponse({'csrfToken': token})