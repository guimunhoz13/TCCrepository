"""Registro de auditoria do escritório."""


from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from ..mixins import (
    EscritorioScopedMixin,
)
from ..models import (
    RegistroAuditoria,
)
from ..serializers import (
    RegistroAuditoriaSerializer,
)

# =========================================================
# AUDITORIA
# =========================================================

class AuditoriaViewSet(EscritorioScopedMixin, viewsets.ReadOnlyModelViewSet):

    queryset = RegistroAuditoria.objects.all()

    serializer_class = RegistroAuditoriaSerializer

    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        usuario = self.get_usuario()

        if not usuario or usuario.tipo_usuario != "admin":
            return RegistroAuditoria.objects.none()

        return (
            super()
            .get_queryset()
            .select_related("usuario", "escritorio")
            .order_by("-criado_em")
        )
