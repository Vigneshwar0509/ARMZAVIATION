from django.conf import settings


def _cookie_options(max_age):
    return {
        "max_age": max_age,
        "httponly": True,
        "secure": not settings.DEBUG,
        "samesite": "Lax",
        "path": "/",
    }


def set_auth_cookies(response, refresh):
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    response.set_cookie(
        settings.AUTH_COOKIE_ACCESS,
        access_token,
        **_cookie_options(int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds())),
    )
    response.set_cookie(
        settings.AUTH_COOKIE_REFRESH,
        refresh_token,
        **_cookie_options(int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds())),
    )
    return response


def clear_auth_cookies(response):
    response.delete_cookie(settings.AUTH_COOKIE_ACCESS, path="/", samesite="Lax")
    response.delete_cookie(settings.AUTH_COOKIE_REFRESH, path="/", samesite="Lax")
    return response
