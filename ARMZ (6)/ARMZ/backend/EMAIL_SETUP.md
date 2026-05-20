Enable SMTP email delivery for development

1) In `backend/.env` set these values (example for Gmail + app password):

EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your.account@gmail.com
EMAIL_HOST_PASSWORD=your_app_password_here
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=no-reply@armz.local

2) Restart the Django server so environment changes take effect:

# from the repo root
cd backend
python manage.py runserver

3) Notes and recommendations:
- For Gmail use an app password (recommended) instead of your account password.
- Consider a testing SMTP service (Mailtrap, Ethereal) for development to avoid sending real emails.
- If you want, provide SMTP credentials and I can apply them and restart the server for you.
