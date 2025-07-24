from rest_framework.routers import DefaultRouter
from .views import RecipeViewSet

router = DefaultRouter()
# The DefaultRouter automatically maps POST requests to the 'create' action
# of the RecipeViewSet for the /api/recipes/ endpoint.
router.register(r'recipes', RecipeViewSet, basename='recipe')

urlpatterns = router.urls
