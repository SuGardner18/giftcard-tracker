import json
from datetime import date, timedelta
from unittest.mock import patch
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
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


    def test_06_starting_balance_cannot_be_negative(self):
        new_card = self.make_card(starting_balance=Decimal('-5.00'))
        try:
            new_card.full_clean()
            self.fail()
        except ValidationError as e:
            self.assertTrue('starting_balance' in e.message_dict)

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


    def test_017_negative_amount_is_refused(self):
        response = self.client.post(reverse('all_transactions', args=[self.card.id]), data={
            'amount': '-5.00', 'date': '2026-10-28',
        }, format='json')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 400)
        self.assertTrue('amount' in response_body)
        self.assertEqual(self.card.transactions.count(), 0)


# a fake key, so these tests never depend on the real one
@override_settings(RESEND_API_KEY="test-key")
class reminders_api_test(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser', password='testpass123', email='su@example.com')
        self.other_user = User.objects.create_user(
            username='otheruser', password='testpass123', email='other@example.com')
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        # a card that expires in 10 days and still has money
        self.card = GiftCard.objects.create(
            user=self.user, store_name='Target', card_last_four='1234',
            starting_balance=Decimal('50.00'),
            expiration_date=date.today() + timedelta(days=10))

    @patch('cards.views.requests.post')
    def test_001_sends_a_reminder_and_marks_the_card(self, mock_post):
        mock_post.return_value.status_code = 200
        response = self.client.post(reverse('send_reminders'))
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response_body['sent'], 1)
        self.assertEqual(mock_post.call_count, 1)
        # the email goes to the user's own address
        self.assertEqual(mock_post.call_args.kwargs['json']['to'], ['su@example.com'])
        self.card.refresh_from_db()
        self.assertTrue(self.card.reminder_sent)

    @patch('cards.views.requests.post')
    def test_002_does_not_send_twice(self, mock_post):
        self.card.reminder_sent = True
        self.card.save()
        response = self.client.post(reverse('send_reminders'))
        response_body = json.loads(response.content)
        self.assertEqual(response_body['sent'], 0)
        self.assertEqual(mock_post.call_count, 0)

    @patch('cards.views.requests.post')
    def test_003_card_not_expiring_soon_is_skipped(self, mock_post):
        self.card.expiration_date = date.today() + timedelta(days=60)
        self.card.save()
        response = self.client.post(reverse('send_reminders'))
        response_body = json.loads(response.content)
        self.assertEqual(response_body['sent'], 0)
        self.assertEqual(mock_post.call_count, 0)

    @patch('cards.views.requests.post')
    def test_004_card_with_no_money_left_is_skipped(self, mock_post):
        Transaction.objects.create(
            gift_card=self.card, amount=Decimal('50.00'), date=date.today())
        response = self.client.post(reverse('send_reminders'))
        response_body = json.loads(response.content)
        self.assertEqual(response_body['sent'], 0)
        self.assertEqual(mock_post.call_count, 0)

    @patch('cards.views.requests.post')
    def test_005_a_failed_email_does_not_mark_the_card(self, mock_post):
        mock_post.return_value.status_code = 403
        mock_post.return_value.text = 'not allowed'
        response = self.client.post(reverse('send_reminders'))
        self.assertEqual(response.status_code, 502)
        self.card.refresh_from_db()
        self.assertFalse(self.card.reminder_sent)

    @patch('cards.views.requests.post')
    def test_006_other_users_cards_are_never_included(self, mock_post):
        mock_post.return_value.status_code = 200
        GiftCard.objects.create(
            user=self.other_user, store_name='Amazon', card_last_four='9999',
            starting_balance=Decimal('25.00'),
            expiration_date=date.today() + timedelta(days=5))
        response = self.client.post(reverse('send_reminders'))
        response_body = json.loads(response.content)
        self.assertEqual(response_body['sent'], 1)
        self.assertNotIn('Amazon', mock_post.call_args.kwargs['json']['text'])

    @patch('cards.views.requests.post')
    def test_007_user_with_no_email_gets_a_clear_error(self, mock_post):
        self.user.email = ''
        self.user.save()
        response = self.client.post(reverse('send_reminders'))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(mock_post.call_count, 0)

    def test_008_requires_a_token(self):
        self.client.credentials()
        response = self.client.post(reverse('send_reminders'))
        self.assertEqual(response.status_code, 401)


@override_settings(BRANDFETCH_CLIENT_ID="test-id")
class brand_search_api_test(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        self.fake_brands = [
            {"name": "Target", "domain": "target.com", "icon": "https://cdn.example/target.webp", "brandId": "1"},
            {"name": "Target Global", "domain": "targetglobal.vc", "icon": None, "brandId": "2"},
            {"name": "No domain", "domain": None, "icon": None, "brandId": "3"},
        ]

    @patch('cards.views.requests.get')
    def test_001_returns_the_matches(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = self.fake_brands
        response = self.client.get(reverse('brand_search') + '?name=target')
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        # the brand with no domain is left out
        self.assertEqual(len(response_body['results']), 2)
        self.assertEqual(response_body['results'][0]['domain'], 'target.com')
        self.assertEqual(response_body['results'][0]['name'], 'Target')

    @patch('cards.views.requests.get')
    def test_002_sends_the_name_and_client_id_to_brandfetch(self, mock_get):
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = []
        self.client.get(reverse('brand_search') + '?name=olive garden')
        self.assertEqual(mock_get.call_count, 1)
        # the space is made safe for a web address
        self.assertTrue(mock_get.call_args.args[0].endswith('/olive%20garden'))
        self.assertEqual(mock_get.call_args.kwargs['params']['c'], 'test-id')

    @patch('cards.views.requests.get')
    def test_003_a_name_that_is_too_short_does_not_call_brandfetch(self, mock_get):
        response = self.client.get(reverse('brand_search') + '?name=a')
        response_body = json.loads(response.content)
        self.assertEqual(response_body['results'], [])
        self.assertEqual(mock_get.call_count, 0)

    @patch('cards.views.requests.get')
    def test_004_a_failed_search_gives_a_clear_error(self, mock_get):
        mock_get.return_value.status_code = 500
        response = self.client.get(reverse('brand_search') + '?name=target')
        self.assertEqual(response.status_code, 502)

    def test_005_requires_a_token(self):
        self.client.credentials()
        response = self.client.get(reverse('brand_search') + '?name=target')
        self.assertEqual(response.status_code, 401)


@override_settings(BRANDFETCH_CLIENT_ID="test-id")
class logo_url_test(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def make_card(self, **kwargs):
        values = dict(user=self.user, store_name='Target', card_last_four='1234',
                      starting_balance=Decimal('10.00'))
        values.update(kwargs)
        return GiftCard.objects.create(**values)

    def test_001_logo_url_uses_the_domain_and_client_id(self):
        card = self.make_card(store_domain='target.com')
        self.assertEqual(
            card.logo_url(),
            'https://cdn.brandfetch.io/target.com/w/128/h/128/icon.png?c=test-id')

    def test_002_no_domain_means_no_logo(self):
        card = self.make_card()
        self.assertIsNone(card.logo_url())

    @override_settings(BRANDFETCH_CLIENT_ID="")
    def test_003_no_client_id_means_no_logo(self):
        card = self.make_card(store_domain='target.com')
        self.assertIsNone(card.logo_url())

    def test_004_the_cards_list_includes_the_logo_url(self):
        self.make_card(store_domain='target.com')
        response = self.client.get(reverse('all_cards'))
        response_body = json.loads(response.content)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response_body[0]['logo_url'].startswith('https://cdn.brandfetch.io/target.com'))
