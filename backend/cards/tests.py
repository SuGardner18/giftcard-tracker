import json
from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import GiftCard, Transaction

# Create your tests here.
#Test cases written with the help of AI

class giftcard_test(TestCase):

    def setUp(self):
        # every card needs a user, so we create one before each test
        self.user = User.objects.create_user(username='su@example.com', password='testpass123')

    def make_card(self, **kwargs):
        # build a valid card; each test changes only what it wants to check
        data = {
            'user': self.user,
            'store_name': 'Target',
            'card_last_four': '1234',
            'starting_balance': Decimal('50.00'),
        }
        data.update(kwargs)
        return GiftCard(**data)

    def test_01_create_giftcard_instance(self):
        new_card = self.make_card()
        try:
            new_card.full_clean()
            self.assertIsNotNone(new_card)
        except ValidationError as e:
            self.fail()

    def test_02_last_four_must_be_four_digits(self):
        new_card = self.make_card(card_last_four='12a4')
        try:
            new_card.full_clean()
            self.fail()
        except ValidationError as e:
            self.assertTrue('card_last_four' in e.message_dict)

    def test_03_starting_balance_must_be_positive(self):
        new_card = self.make_card(starting_balance=Decimal('0'))
        try:
            new_card.full_clean()
            self.fail()
        except ValidationError as e:
            self.assertTrue('starting_balance' in e.message_dict)

    def test_04_store_name_is_required(self):
        new_card = self.make_card(store_name='')
        try:
            new_card.full_clean()
            self.fail()
        except ValidationError as e:
            self.assertTrue('store_name' in e.message_dict)

    def test_05_expiration_date_is_optional(self):
        new_card = self.make_card()
        try:
            new_card.full_clean()
            self.assertIsNone(new_card.expiration_date)
        except ValidationError as e:
            self.fail()


class transaction_test(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='su@example.com', password='testpass123')
        # transactions need a saved card, so this one is created in the database
        self.card = GiftCard.objects.create(
            user=self.user, store_name='Target', card_last_four='1234',
            starting_balance=Decimal('50.00'))

    def test_01_create_transaction_instance(self):
        new_transaction = Transaction(
            gift_card=self.card, amount=Decimal('20.00'), date=date(2026, 10, 28))
        try:
            new_transaction.full_clean()
            self.assertIsNotNone(new_transaction)
        except ValidationError as e:
            self.fail()

    def test_02_amount_must_be_greater_than_zero(self):
        new_transaction = Transaction(
            gift_card=self.card, amount=Decimal('0'), date=date(2026, 10, 28))
        try:
            new_transaction.full_clean()
            self.fail()
        except ValidationError as e:
            self.assertTrue('amount' in e.message_dict)

    def test_03_amount_cannot_exceed_balance(self):
        new_transaction = Transaction(
            gift_card=self.card, amount=Decimal('60.00'), date=date(2026, 10, 28))
        try:
            new_transaction.full_clean()
            self.fail()
        except ValidationError as e:
            self.assertTrue('amount' in e.message_dict)

    def test_04_editing_a_transaction_ignores_its_own_old_amount(self):
        saved = Transaction.objects.create(
            gift_card=self.card, amount=Decimal('40.00'), date=date(2026, 10, 28))
        # only $10 is left, but raising this purchase to $45 is fine
        # because the old $40 is not counted against itself
        saved.amount = Decimal('45.00')
        try:
            saved.full_clean()
        except ValidationError as e:
            self.fail()

    def test_05_current_balance_subtracts_transactions(self):
        Transaction.objects.create(
            gift_card=self.card, amount=Decimal('20.00'), date=date(2026, 10, 28))
        self.assertEqual(self.card.current_balance(), Decimal('30.00'))

    def test_06_starting_balance_cannot_go_below_amount_spent(self):
        Transaction.objects.create(
            gift_card=self.card, amount=Decimal('40.00'), date=date(2026, 10, 28))
        self.card.starting_balance = Decimal('30.00')
        try:
            self.card.full_clean()
            self.fail()
        except ValidationError as e:
            self.assertTrue('starting_balance' in e.message_dict)

    def test_07_amount_sent_as_text_zero_fails_cleanly(self):
        # amounts arrive as text from the API; this used to crash with a TypeError
        new_transaction = Transaction(
            gift_card=self.card, amount='0', date=date(2026, 10, 28))
        try:
            new_transaction.full_clean()
            self.fail()
        except ValidationError as e:
            self.assertTrue('amount' in e.message_dict)

class cards_api_test(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.other_user = User.objects.create_user(username='otheruser', password='testpass123')
        # a token for the first user, sent with every request from this client
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.card = GiftCard.objects.create(
            user=self.user, store_name='Target', card_last_four='1234',
            starting_balance=Decimal('50.00'))
        # this card belongs to someone else and must never show up
        self.other_card = GiftCard.objects.create(
            user=self.other_user, store_name='Amazon', card_last_four='9999',
            starting_balance=Decimal('25.00'))

    def test_001_requires_a_token(self):
        # an empty credentials() call removes the token
        self.client.credentials()
        response = self.client.get(reverse('all_cards'))
        self.assertEqual(response.status_code, 401)

    def test_002_get_only_my_cards(self):
        response = self.client.get(reverse('all_cards'))
        response_body = json.loads(response.content)
        self.assertEqual(len(response_body), 1)
        self.assertEqual(response_body[0]['store_name'], 'Target')

    def test_003_current_balance_has_two_decimal_places(self):
        response = self.client.get(reverse('all_cards'))
        response_body = json.loads(response.content)
        self.assertEqual(response_body[0]['current_balance'], '50.00')

    def test_004_create_a_card(self):
        response = self.client.post(reverse('all_cards'), data={
            'store_name': 'Olive Garden',
            'card_last_four': '0077',
            'starting_balance': '30.00',
        }, format='json')
        self.assertEqual(response.status_code, 201)
        # the new card belongs to the logged in user
        self.assertEqual(self.user.cards.count(), 2)

    def test_005_bad_card_is_refused(self):
        response = self.client.post(reverse('all_cards'), data={
            'store_name': 'Olive Garden',
            'card_last_four': '12',
            'starting_balance': '30.00',
        }, format='json')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertTrue('card_last_four' in response_body)
        # nothing was saved
        self.assertEqual(self.user.cards.count(), 1)

    def test_006_get_one_card_with_its_transactions(self):
        Transaction.objects.create(
            gift_card=self.card, amount=Decimal('20.00'), date=date(2026, 10, 28))
        response = self.client.get(reverse('selected_card', args=[self.card.id]))
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response_body['transactions']), 1)
        self.assertEqual(response_body['current_balance'], '30.00')

    def test_007_cannot_get_someone_elses_card(self):
        response = self.client.get(reverse('selected_card', args=[self.other_card.id]))
        self.assertEqual(response.status_code, 404)

    def test_008_update_a_card(self):
        response = self.client.put(reverse('selected_card', args=[self.card.id]), data={
            'nickname': 'Birthday card',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        updated_card = GiftCard.objects.get(id=self.card.id)
        self.assertEqual(updated_card.nickname, 'Birthday card')

    def test_009_bad_update_is_refused_and_not_saved(self):
        response = self.client.put(reverse('selected_card', args=[self.card.id]), data={
            'card_last_four': '12',
        }, format='json')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertTrue('card_last_four' in response_body)
        unchanged_card = GiftCard.objects.get(id=self.card.id)
        self.assertEqual(unchanged_card.card_last_four, '1234')

    def test_010_new_expiration_date_resets_the_reminder(self):
        self.card.reminder_sent = True
        self.card.save()
        self.client.put(reverse('selected_card', args=[self.card.id]), data={
            'expiration_date': '2026-12-01',
        }, format='json')
        updated_card = GiftCard.objects.get(id=self.card.id)
        self.assertFalse(updated_card.reminder_sent)

    def test_011_delete_a_card_and_its_transactions(self):
        Transaction.objects.create(
            gift_card=self.card, amount=Decimal('20.00'), date=date(2026, 10, 28))
        response = self.client.delete(reverse('selected_card', args=[self.card.id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.user.cards.count(), 0)
        self.assertEqual(Transaction.objects.count(), 0)

    def test_012_cannot_delete_someone_elses_card(self):
        response = self.client.delete(reverse('selected_card', args=[self.other_card.id]))
        self.assertEqual(response.status_code, 404)
        self.assertTrue(GiftCard.objects.filter(id=self.other_card.id).exists())

    def test_013_starting_balance_of_zero_is_refused_not_a_crash(self):
        response = self.client.put(reverse('selected_card', args=[self.card.id]), data={
            'starting_balance': '0',
        }, format='json')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertTrue('starting_balance' in response_body)


class transactions_api_test(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.other_user = User.objects.create_user(username='otheruser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.card = GiftCard.objects.create(
            user=self.user, store_name='Target', card_last_four='1234',
            starting_balance=Decimal('50.00'))
        # this card belongs to someone else
        self.other_card = GiftCard.objects.create(
            user=self.other_user, store_name='Amazon', card_last_four='9999',
            starting_balance=Decimal('25.00'))

    def test_001_create_a_transaction(self):
        response = self.client.post(reverse('all_transactions', args=[self.card.id]), data={
            'amount': '20.00', 'date': '2026-10-28', 'note': 'Groceries',
        }, format='json')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response_body['amount'], '20.00')
        self.assertEqual(response_body['entered_by'], 'manual')
        self.assertEqual(self.card.transactions.count(), 1)
        # the balance is calculated from the transactions
        self.assertEqual(self.card.current_balance(), Decimal('30.00'))

    def test_002_cannot_spend_more_than_the_balance(self):
        response = self.client.post(reverse('all_transactions', args=[self.card.id]), data={
            'amount': '100.00', 'date': '2026-10-28',
        }, format='json')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertTrue('amount' in response_body)
        self.assertEqual(self.card.transactions.count(), 0)

    def test_003_amount_of_zero_is_refused_not_a_crash(self):
        # this is the case that used to crash with a 500 error
        response = self.client.post(reverse('all_transactions', args=[self.card.id]), data={
            'amount': '0', 'date': '2026-10-28',
        }, format='json')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertTrue('amount' in response_body)
        self.assertEqual(self.card.transactions.count(), 0)

    def test_004_date_is_required(self):
        response = self.client.post(reverse('all_transactions', args=[self.card.id]), data={
            'amount': '10.00',
        }, format='json')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertTrue('date' in response_body)

    def test_005_card_that_does_not_exist(self):
        response = self.client.post(reverse('all_transactions', args=[9999]), data={
            'amount': '10.00', 'date': '2026-10-28',
        }, format='json')
        self.assertEqual(response.status_code, 404)

    def test_006_cannot_add_to_someone_elses_card(self):
        response = self.client.post(reverse('all_transactions', args=[self.other_card.id]), data={
            'amount': '10.00', 'date': '2026-10-28',
        }, format='json')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(self.other_card.transactions.count(), 0)

    def test_007_requires_a_token(self):
        # an empty credentials() call removes the token
        self.client.credentials()
        response = self.client.post(reverse('all_transactions', args=[self.card.id]), data={
            'amount': '10.00', 'date': '2026-10-28',
        }, format='json')
        self.assertEqual(response.status_code, 401)

    def test_008_update_a_transaction(self):
        transaction = Transaction.objects.create(
            gift_card=self.card, amount=Decimal('20.00'), date=date(2026, 10, 28))
        response = self.client.put(
            reverse('selected_transaction', args=[self.card.id, transaction.id]),
            data={'amount': '25.00', 'note': 'Groceries and snacks'}, format='json')
        self.assertEqual(response.status_code, 200)
        updated_transaction = Transaction.objects.get(id=transaction.id)
        self.assertEqual(updated_transaction.amount, Decimal('25.00'))
        # the card's balance follows the edit
        self.assertEqual(self.card.current_balance(), Decimal('25.00'))

    def test_009_edit_can_use_the_full_balance(self):
        # the transaction's own old amount is left out of the check,
        # so a $20 purchase can be raised to the card's full $50
        transaction = Transaction.objects.create(
            gift_card=self.card, amount=Decimal('20.00'), date=date(2026, 10, 28))
        response = self.client.put(
            reverse('selected_transaction', args=[self.card.id, transaction.id]),
            data={'amount': '50.00'}, format='json')
        self.assertEqual(response.status_code, 200)

    def test_010_edit_over_the_balance_is_refused_and_not_saved(self):
        transaction = Transaction.objects.create(
            gift_card=self.card, amount=Decimal('20.00'), date=date(2026, 10, 28))
        response = self.client.put(
            reverse('selected_transaction', args=[self.card.id, transaction.id]),
            data={'amount': '100.00'}, format='json')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertTrue('amount' in response_body)
        unchanged_transaction = Transaction.objects.get(id=transaction.id)
        self.assertEqual(unchanged_transaction.amount, Decimal('20.00'))

    def test_011_edit_to_zero_is_refused_not_a_crash(self):
        transaction = Transaction.objects.create(
            gift_card=self.card, amount=Decimal('20.00'), date=date(2026, 10, 28))
        response = self.client.put(
            reverse('selected_transaction', args=[self.card.id, transaction.id]),
            data={'amount': '0'}, format='json')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertTrue('amount' in response_body)

    def test_012_transaction_must_belong_to_the_card_in_the_address(self):
        transaction = Transaction.objects.create(
            gift_card=self.card, amount=Decimal('20.00'), date=date(2026, 10, 28))
        # a second card of mine; the transaction does not belong to it
        second_card = GiftCard.objects.create(
            user=self.user, store_name='Olive Garden', card_last_four='0077',
            starting_balance=Decimal('30.00'))
        response = self.client.put(
            reverse('selected_transaction', args=[second_card.id, transaction.id]),
            data={'amount': '10.00'}, format='json')
        self.assertEqual(response.status_code, 404)
        unchanged_transaction = Transaction.objects.get(id=transaction.id)
        self.assertEqual(unchanged_transaction.amount, Decimal('20.00'))

    def test_013_cannot_edit_a_transaction_on_someone_elses_card(self):
        other_transaction = Transaction.objects.create(
            gift_card=self.other_card, amount=Decimal('5.00'), date=date(2026, 10, 28))
        response = self.client.put(
            reverse('selected_transaction', args=[self.other_card.id, other_transaction.id]),
            data={'amount': '10.00'}, format='json')
        self.assertEqual(response.status_code, 404)
        unchanged_transaction = Transaction.objects.get(id=other_transaction.id)
        self.assertEqual(unchanged_transaction.amount, Decimal('5.00'))


    def test_014_delete_a_transaction(self):
        transaction = Transaction.objects.create(
            gift_card=self.card, amount=Decimal('20.00'), date=date(2026, 10, 28))
        response = self.client.delete(
            reverse('selected_transaction', args=[self.card.id, transaction.id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.card.transactions.count(), 0)
        # the balance goes back up, since it is calculated from the transactions
        self.assertEqual(self.card.current_balance(), Decimal('50.00'))

    def test_015_delete_a_transaction_that_does_not_exist(self):
        response = self.client.delete(
            reverse('selected_transaction', args=[self.card.id, 9999]))
        self.assertEqual(response.status_code, 404)

    def test_016_cannot_delete_a_transaction_on_someone_elses_card(self):
        other_transaction = Transaction.objects.create(
            gift_card=self.other_card, amount=Decimal('5.00'), date=date(2026, 10, 28))
        response = self.client.delete(
            reverse('selected_transaction', args=[self.other_card.id, other_transaction.id]))
        self.assertEqual(response.status_code, 404)
        self.assertTrue(Transaction.objects.filter(id=other_transaction.id).exists())