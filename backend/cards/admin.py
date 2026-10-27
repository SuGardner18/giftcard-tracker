from django.contrib import admin

# cards/admin.py
from django.contrib import admin
# Explicit import of GiftCard Model
from .models import GiftCard

# Register your models here.
admin.site.register([GiftCard])
