 # cards/validators.py
from django.core.exceptions import ValidationError

def validate_last_four(value):
    if len(value) != 4 or not value.isdigit():
        raise ValidationError("Must be exactly 4 digits.")