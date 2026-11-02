# cards/urls.py
from django.urls import path
from .views import AllCards, SelectedCard, AllTransactions, SelectedTransaction

urlpatterns = [
    path('', AllCards.as_view(), name='all_cards'),
    path('<int:id>/', SelectedCard.as_view(), name='selected_card'),
    path('<int:card_id>/transactions/', AllTransactions.as_view(), name='all_transactions'),
    path('<int:card_id>/transactions/<int:transaction_id>/', SelectedTransaction.as_view(), name='selected_transaction'),
]