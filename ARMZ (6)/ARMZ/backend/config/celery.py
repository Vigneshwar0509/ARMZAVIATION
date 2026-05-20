import os
from celery import Celery
from celery.schedules import crontab
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('armz')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Production Celery configuration
app.conf.update(
    # Broker
    broker_url=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=10,
    broker_heartbeat=30,
    
    # Result backend
    result_backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    result_expires=3600,
    
    # Task serialization
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
    
    # Worker
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Retry
    task_autoretry_for=(Exception,),
    task_max_retries=3,
    task_default_retry_delay=60,
    
    # Timeouts
    task_soft_time_limit=300,
    task_time_limit=600,
)

# Task routing
app.conf.task_routes = {
    'accounts.tasks.*': {'queue': 'accounts'},
    'payments.tasks.*': {'queue': 'payments'},
    'core.tasks.*': {'queue': 'core'},
}

# Beat schedule
app.conf.beat_schedule = {
    'send-daily-digest': {
        'task': 'core.tasks.send_daily_digest',
        'schedule': crontab(hour=8, minute=0),
    },
    'cleanup-tokens': {
        'task': 'accounts.tasks.cleanup_expired_tokens',
        'schedule': crontab(hour=2, minute=0),
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')