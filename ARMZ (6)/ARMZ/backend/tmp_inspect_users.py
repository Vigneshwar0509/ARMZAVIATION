import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
print('count', User.objects.count())
for u in User.objects.all()[:10]:
    print('user:', u.id, u.email, 'super=' + str(u.is_superuser), 'staff=' + str(u.is_staff))
