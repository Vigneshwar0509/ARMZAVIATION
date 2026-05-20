from django.contrib import admin

from bookings.models import Application, Booking, SavedJob

admin.site.register(Booking)
admin.site.register(Application)
admin.site.register(SavedJob)
