# accounts/urls.py
from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from .views import SignupView

urlpatterns = [
    path('get-token', obtain_auth_token, name='get-token'),
    path('signup', SignupView.as_view(), name='signup')
]