from django.db import models
from django.core import validators as v

# Create your models here.

class GiftCard(models.Model):
    # The store or brand the card is for
    merchant = models.CharField(max_length=250, blank=False, null=False)
    # The money left on the card; it can't be negative
    balance = models.DecimalField(
        max_digits=8, decimal_places=2, default=0, validators=[v.MinValueValidator(0)])
    # The date the card expires; optional because some cards never expire
    expiration_date = models.DateField(null=True, blank=True)
    # Anything else worth remembering about the card
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"| {self.merchant} | balance: ${self.balance} | expires: {self.expiration_date} |"