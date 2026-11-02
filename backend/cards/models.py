# cards/models.py
from decimal import Decimal
from django.contrib.auth.models import User
from django.core import validators as v
from django.core.exceptions import ValidationError
from django.db import models
from .validators import validate_last_four


class GiftCard(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cards')
    store_name = models.CharField(max_length=250)
    store_domain = models.CharField(max_length=250, null=True, blank=True)
    card_last_four = models.CharField(max_length=4, validators=[validate_last_four])
    nickname = models.CharField(max_length=250, null=True, blank=True)
    starting_balance = models.DecimalField(
        max_digits=8, decimal_places=2, validators=[v.MinValueValidator(Decimal('0.01'))])
    expiration_date = models.DateField(null=True, blank=True)
    reminder_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def total_spent(self):
        return sum(t.amount for t in self.transactions.all())

    def current_balance(self):
        return self.starting_balance - self.total_spent()

    def clean(self):
        # starting balance can't be edited below what was already spent
        if self.pk and isinstance(self.starting_balance, Decimal) and self.starting_balance < self.total_spent():
            raise ValidationError({'starting_balance': "Can't be less than the amount already spent."})

    def __str__(self):
        # a card must be saved before we can add up its transactions
        if self.pk:
            return f"| {self.store_name} | ****{self.card_last_four} | balance: ${self.current_balance()} |"
        return f"| {self.store_name} | ****{self.card_last_four} |"


class Transaction(models.Model):
    ENTRY_CHOICES = [('manual', 'Typed'), ('scan', 'Scan')]

    gift_card = models.ForeignKey(GiftCard, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(
        max_digits=8, decimal_places=2, validators=[v.MinValueValidator(Decimal('0.01'))])
    date = models.DateField()
    note = models.CharField(max_length=250, blank=True)
    entered_by = models.CharField(max_length=10, choices=ENTRY_CHOICES, default='manual')
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        # a purchase can't exceed the available balance; on edit, leave out its own old amount
        if self.gift_card_id and isinstance(self.amount, Decimal):
            # add up every OTHER purchase on this card (leave out this one's old amount)
            others = sum(t.amount for t in self.gift_card.transactions.all() if t.pk != self.pk)
            available = self.gift_card.starting_balance - others
            if self.amount > available:
                raise ValidationError({'amount': f"This is more than the card's balance of ${available}."})

    def __str__(self):
        # show the date the US way (MM/DD/YYYY) instead of Python's default YYYY-MM-DD
        date_text = self.date.strftime('%m/%d/%Y') if self.date else ''
        return f"| {self.gift_card.store_name} | ${self.amount} | {date_text} |"