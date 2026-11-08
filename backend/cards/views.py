# cards/views.py
import datetime

from urllib.parse import quote

import requests
from django.conf import settings
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.views import APIView, Response

from .models import GiftCard, Transaction
from .serializers import GiftCardSerializer, GiftCardDetailSerializer, TransactionSerializer

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

class SelectedCard(APIView):

    def get(self, request, id):
        try:
            # look the card up through the user, so you can only reach your own cards
            card = request.user.cards.get(id=id)
        except GiftCard.DoesNotExist:
            return Response({"error": "Card not found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = GiftCardDetailSerializer(card)
        return Response(serializer.data)

    def put(self, request, id):
        try:
            card = request.user.cards.get(id=id)
        except GiftCard.DoesNotExist:
            return Response({"error": "Card not found"}, status=status.HTTP_404_NOT_FOUND)
        old_expiration_date = card.expiration_date
        for field in ('store_name', 'store_domain', 'card_last_four', 'nickname',
                      'starting_balance', 'expiration_date'):
            if field in request.data:
                setattr(card, field, request.data[field])
        try:
            card.full_clean()
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
        # a new expiration date means the reminder email can be sent again
        if card.expiration_date != old_expiration_date:
            card.reminder_sent = False
        card.save()
        serializer = GiftCardDetailSerializer(card)
        return Response(serializer.data)

    def delete(self, request, id):
        try:
            card = request.user.cards.get(id=id)
        except GiftCard.DoesNotExist:
            return Response({"error": "Card not found"}, status=status.HTTP_404_NOT_FOUND)
        # grab the name before deleting to use in the response message
        store_name = card.store_name
        card.delete()
        return Response(f"{store_name} card was deleted")


class AllTransactions(APIView):

    def post(self, request, card_id):
        try:
            # look the card up through the user, so you can only add to your own cards
            card = request.user.cards.get(id=card_id)
        except GiftCard.DoesNotExist:
            return Response({"error": "Card not found"}, status=status.HTTP_404_NOT_FOUND)
        # build the transaction without saving it yet
        new_transaction = Transaction(
            gift_card=card,
            amount=request.data.get('amount'),
            date=request.data.get('date'),
            note=request.data.get('note', ''),
            entered_by=request.data.get('entered_by', 'manual'),
        )
        try:
            # validate BEFORE save; this also runs the "can't spend more than the balance" rule
            new_transaction.full_clean()
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
        new_transaction.save()
        serializer = TransactionSerializer(new_transaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SelectedTransaction(APIView):

    def put(self, request, card_id, transaction_id):
        try:
            card = request.user.cards.get(id=card_id)
            # look the transaction up THROUGH the card, so it must belong to it
            transaction = card.transactions.get(id=transaction_id)
        except (GiftCard.DoesNotExist, Transaction.DoesNotExist):
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)
        # only these fields can be updated; set them first, then validate BEFORE saving
        for field in ('amount', 'date', 'note'):
            if field in request.data:
                setattr(transaction, field, request.data[field])
        try:
            transaction.full_clean()
        except ValidationError as e:
            return Response(e.message_dict, status=status.HTTP_400_BAD_REQUEST)
        transaction.save()
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data)

    def delete(self, request, card_id, transaction_id):
        try:
            card = request.user.cards.get(id=card_id)
            transaction = card.transactions.get(id=transaction_id)
        except (GiftCard.DoesNotExist, Transaction.DoesNotExist):
            return Response({"error": "Transaction not found"}, status=status.HTTP_404_NOT_FOUND)
        transaction.delete()
        return Response("Transaction was deleted")


class SendReminders(APIView):

    def post(self, request):
        if not settings.RESEND_API_KEY:
            return Response({"error": "Email is not set up on the server."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)
        if not request.user.email:
            return Response({"error": "Your account has no email address."},
                            status=status.HTTP_400_BAD_REQUEST)

        # find this user's cards that expire within 30 days, still have money, and have no reminder yet
        today = datetime.date.today()
        expiring = []
        for card in request.user.cards.filter(reminder_sent=False):
            if card.expiration_date and card.current_balance() > 0:
                days_left = (card.expiration_date - today).days
                if 0 <= days_left <= 30:
                    expiring.append(card)

        if len(expiring) == 0:
            return Response({"sent": 0, "message": "No cards need a reminder right now."})

        lines = []
        for card in expiring:
            lines.append(
                f"- {card.store_name} ****{card.card_last_four}: ${card.current_balance()} left, "
                f"expires {card.expiration_date.strftime('%m/%d/%Y')}"
            )
        body = (
            f"Hi {request.user.username},\n\n"
            "These gift cards expire within 30 days:\n\n"
            + "\n".join(lines)
            + "\n\nUse them up before they expire!\n\nGFiles"
        )

        try:
            # our server calls Resend's server, the same pattern as the PokeAPI lesson
            response = requests.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                json={
                    "from": settings.RESEND_FROM,
                    "to": [request.user.email],
                    "subject": "Your gift cards are expiring soon",
                    "text": body,
                },
                timeout=30,
            )
        except requests.RequestException:
            return Response({"error": "Could not reach the email service."},
                            status=status.HTTP_502_BAD_GATEWAY)

        if response.status_code != 200:
            return Response({"error": f"The email service refused the request: {response.text}"},
                            status=status.HTTP_502_BAD_GATEWAY)

        # the email went out, so remember it. Each card gets one reminder
        for card in expiring:
            card.reminder_sent = True
            card.save()
        return Response({"sent": len(expiring), "message": f"Emailed a reminder for {len(expiring)} card(s)."})


class BrandSearch(APIView):

    def get(self, request):
        name = request.query_params.get("name", "").strip()
        # too short to search for
        if len(name) < 2:
            return Response({"results": []})
        if not settings.BRANDFETCH_CLIENT_ID:
            return Response({"error": "Logo search is not set up on the server."},
                            status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            # our server calls Brandfetch's server, the same pattern as the PokeAPI lesson
            response = requests.get(
                "https://api.brandfetch.io/v2/search/" + quote(name, safe=""),
                params={"c": settings.BRANDFETCH_CLIENT_ID},
                timeout=10,
            )
        except requests.RequestException:
            return Response({"error": "Could not reach the logo service."},
                            status=status.HTTP_502_BAD_GATEWAY)

        if response.status_code != 200:
            return Response({"error": "The logo service could not search right now."},
                            status=status.HTTP_502_BAD_GATEWAY)

        # keep just the first five matches, and only the parts the app needs
        results = []
        for brand in response.json()[:5]:
            if brand.get("domain"):
                results.append({
                    "name": brand.get("name"),
                    "domain": brand.get("domain"),
                    "icon": brand.get("icon"),
                })
        return Response({"results": results})
