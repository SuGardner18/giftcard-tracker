import json

from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse

# Create your tests here.
#Test cases written with the help of AI

class accounts_test(TestCase):

    def test_01_signup_creates_user(self):
        result = self.client.post(reverse('signup'), data={
            'username': 'testuser', 'email': 'test@example.com', 'password': 'testpass123'})
        self.assertEqual(result.status_code, 201)
        self.assertTrue(User.objects.filter(username='testuser').exists())

    def test_02_signup_response_does_not_include_password(self):
        result = self.client.post(reverse('signup'), data={
            'username': 'testuser', 'email': 'test@example.com', 'password': 'testpass123'})
        response_body = json.loads(result.content)
        self.assertFalse('password' in response_body)

    def test_03_signup_requires_email(self):
        result = self.client.post(reverse('signup'), data={
            'username': 'testuser', 'password': 'testpass123'})
        response_body = json.loads(result.content)
        self.assertEqual(result.status_code, 400)
        self.assertTrue('email' in response_body)

    def test_04_signup_hashes_the_password(self):
        self.client.post(reverse('signup'), data={
            'username': 'testuser', 'email': 'test@example.com', 'password': 'testpass123'})
        user = User.objects.get(username='testuser')
        # the stored password is a hash, not the plain text
        self.assertNotEqual(user.password, 'testpass123')
        self.assertTrue(user.check_password('testpass123'))

    def test_05_login_returns_a_token(self):
        User.objects.create_user(username='testuser', password='testpass123')
        result = self.client.post(reverse('get-token'), data={
            'username': 'testuser', 'password': 'testpass123'})
        response_body = json.loads(result.content)
        self.assertEqual(result.status_code, 200)
        self.assertTrue('token' in response_body)