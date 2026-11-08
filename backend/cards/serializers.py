# cards/serializers.py
from rest_framework import serializers
from .models import GiftCard, Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('id', 'amount', 'date', 'note', 'entered_by')


class GiftCardSerializer(serializers.ModelSerializer):
    # show the calculated balance with 2 decimal places, like starting_balance
    current_balance = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    # the logo address from the model's logo_url() method
    logo_url = serializers.CharField(read_only=True)
    class Meta:
        model = GiftCard
        fields = ('id', 'store_name', 'store_domain', 'card_last_four', 'nickname',
                  'starting_balance', 'current_balance', 'expiration_date', 'reminder_sent', 'logo_url')

class GiftCardDetailSerializer(GiftCardSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)
    class Meta(GiftCardSerializer.Meta):
        fields = GiftCardSerializer.Meta.fields + ('transactions',)