from django.test import TestCase
from django.core.exceptions import ValidationError
from .models import GiftCard  # import the GiftCard model

# Create your tests here.


class giftcard_test(TestCase):

    def test_01_create_giftcard_instance(self):
        # Here we create a valid gift card instance
        new_card = GiftCard(merchant='Target', balance=25.00)
        try:
            # validators are not run on our new instance until we run full_clean
            new_card.full_clean()
            # here we ensure our instance is actually created
            self.assertIsNotNone(new_card)
        except ValidationError as e:
            # if it sends an error we want to ensure this test fails
            self.fail()

    def test_02_create_giftcard_with_negative_balance(self):
        # a negative balance should be rejected by our MinValueValidator
        new_card = GiftCard(merchant='Target', balance=-5)
        try:
            new_card.full_clean()
            # if no error is thrown, our validator is not working, so fail
            self.fail()
        except ValidationError as e:
            # the error should be attached to the balance field
            self.assertTrue('balance' in e.message_dict)

    def test_03_create_giftcard_without_merchant(self):
        # merchant has blank=False, so an empty merchant should be rejected
        new_card = GiftCard(balance=10)
        try:
            new_card.full_clean()
            self.fail()
        except ValidationError as e:
            self.assertTrue('merchant' in e.message_dict)

    def test_04_create_giftcard_without_expiration_date(self):
        # expiration_date is optional, so this card should be valid
        new_card = GiftCard(merchant='Target', balance=10)
        try:
            new_card.full_clean()
            self.assertIsNone(new_card.expiration_date)
        except ValidationError as e:
            self.fail()

