try:
    from celery import shared_task
except ImportError:
    def shared_task(*args, **kwargs):
        def decorator(func):
            func.delay = func
            func.apply_async = lambda args=None, kwargs=None, **opts: func(*(args or ()), **(kwargs or {}))
            return func
        return decorator
