"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from backend.users.views import CSRFTokenView
from recipes.views import RecipeViewSet

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('backend.users.urls')),
    path('api/csrf/', CSRFTokenView.as_view(), name='csrf_token'), # Endpoint to get CSRF token
    # path('csrf-token/', views.get_csrf_token, name='csrf_token'),
    # path('api/recipes/', include('recipes.urls')),
    path('api/recipes/', RecipeViewSet.as_view({'get': 'list', 'post': 'create'}), name='recipe-list-create'),
    path('api/recipes/<int:pk>/', RecipeViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='recipe-detail'),
]
