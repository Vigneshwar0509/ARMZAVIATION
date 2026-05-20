from django.core import mail
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="no-reply@armz.local",
    CONTACT_INBOX_EMAIL="prawin55577@gmail.com",
)
class ContactViewTests(APITestCase):
    def test_contact_submission_sends_email_to_configured_inbox(self):
        response = self.client.post(
            "/contact",
            {
                "fullName": "John Doe",
                "email": "john@example.com",
                "phone": "+91 8220551116",
                "subject": "Course enquiry",
                "message": "I would like to know more about your aviation courses and admissions process.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json()["success"], True)
        self.assertEqual(len(mail.outbox), 1)

        sent_email = mail.outbox[0]
        self.assertEqual(sent_email.to, ["prawin55577@gmail.com"])
        self.assertEqual(sent_email.reply_to, ["john@example.com"])
        self.assertEqual(sent_email.subject, "[ARMZ Contact] Course enquiry")
        self.assertIn("John Doe", sent_email.body)
        self.assertIn("+91 8220551116", sent_email.body)
