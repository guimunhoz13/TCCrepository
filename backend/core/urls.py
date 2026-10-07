from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

from advocacia.views import LoginSegundoFatorView, LoginView, LogoutView, RenovarTokenView


urlpatterns = [

    path(
        "admin/",
        admin.site.urls
    ),

    path(
        "api/login/",
        LoginView.as_view(),
        name="login"
    ),

    path(
        "api/login/2fa/",
        LoginSegundoFatorView.as_view(),
        name="login-2fa"
    ),

    path(
        "api/token/refresh/",
        RenovarTokenView.as_view(),
        name="token_refresh"
    ),

    path(
        "api/logout/",
        LogoutView.as_view(),
        name="logout"
    ),

    path(
        "api/",
        include("advocacia.urls")
    ),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)