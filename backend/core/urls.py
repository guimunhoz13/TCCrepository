from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny

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

if settings.API_DOCS_PUBLICAS:
    documentacao = {"permission_classes": [AllowAny], "authentication_classes": []}
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(**documentacao), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema", **documentacao), name="swagger"),
        path("api/redoc/", SpectacularRedocView.as_view(url_name="schema", **documentacao), name="redoc"),
    ]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)