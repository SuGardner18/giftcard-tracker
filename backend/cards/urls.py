# cards/urls.py
from django.urls import path
from .views import AllCards

urlpatterns = [
    path('', AllCards.as_view(), name='all_cards'),
]