# cards/views.py
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.views import APIView, Response

from .models import GiftCard
from .serializers import GiftCardSerializer

# Create your views here.


class AllCards(APIView):

    def get(self, request):
        # only this user's cards, alphabetical by store name
        cards = request.user.cards.order_by("store_name")
        serializer = GiftCardSerializer(cards, many=True)
        return Response(serializer.data)

    def post(self, request):
        # build the card from the request body without saving yet.
        # We list the fields ourselves so a caller can't set 'user' or 'reminder_sent'
        new_card = GiftCard(
            user=request.user,
            store_name=request.data.get('store_name'),
            store_domain=request.data.get('store_domain'),
            card_last_four=request.data.get('card_last_four'),
            nickname=request.data.get('nickname'),
            starting_balance=request.data.get('starting_balance'),
            expiration_date=request.data.get('expiration_date'),
        )
        try:
           
            new_card.full_clean()
        except ValidationError as e:
            # send the error messages back so React can show them under each field
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
        new_card.save()
        serializer = GiftCardSerializer(new_card)
        return Response(serializer.data, status=status.HTTP_201_CREATED)