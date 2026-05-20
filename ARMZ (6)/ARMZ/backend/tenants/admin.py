from django.contrib import admin

from tenants.models import Tenant, TenantUsage

admin.site.register([Tenant, TenantUsage])
