from django.urls import path
from .views import (
    RegisterView, 
    LoginView, 
    LogoutView, 
    UserDetailView, 
    ChangePasswordView,
    CurrentUserView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    CSRFTokenView  # Don't forget to add this if you're using it
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('me/', CurrentUserView.as_view(), name='current_user'),  # MOVED BEFORE the generic pattern
    path('<str:username>/', UserDetailView.as_view(), name='user_detail'),  # Keep this last
]