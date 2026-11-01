# cards/urls.py
from django.urls import path
from .views import AllCards, SelectedCard

urlpatterns = [
    path('', AllCards.as_view(), name='all_cards'),
    path('<int:id>/', SelectedCard.as_view(), name='selected_card'),
]