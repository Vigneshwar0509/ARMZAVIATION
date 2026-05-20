from django.contrib import admin

from contact.models import ContactMessage, Lead

admin.site.register(ContactMessage)
admin.site.register(Lead)
