# cards/serializers.py
from rest_framework import serializers
from .models import GiftCard


class GiftCardSerializer(serializers.ModelSerializer):
    # show the calculated balance with 2 decimal places, like starting_balance
    current_balance = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    class Meta:
        model = GiftCard
        fields = ('id', 'store_name', 'store_domain', 'card_last_four', 'nickname',
                  'starting_balance', 'current_balance', 'expiration_date', 'reminder_sent')