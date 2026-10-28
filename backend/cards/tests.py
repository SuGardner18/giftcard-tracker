from datetime import date
from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import TestCase

from .models import GiftCard, Transaction

# Create your tests here.


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

