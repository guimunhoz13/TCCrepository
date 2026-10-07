from io import StringIO

from django.core.management import call_command
from django.test import TestCase


class DocumentacaoDaAPITestCase(TestCase):

    def test_esquema_openapi_publico_cobre_as_rotas_principais(self):
        resposta = self.client.get("/api/schema/", HTTP_ACCEPT="application/vnd.oai.openapi+json")
        self.assertEqual(resposta.status_code, 200)
        esquema = resposta.json()
        self.assertEqual(esquema["info"]["title"], "LexOffice API")
        for rota in ("/api/login/", "/api/login/2fa/", "/api/processos/{id}/ficha/",
                     "/api/intimacoes/buscar/", "/api/parcelas/{id}/pix/", "/api/dashboard/"):
            self.assertIn(rota, esquema["paths"])
        self.assertEqual(
            esquema["components"]["securitySchemes"]["jwtAuth"]["scheme"], "bearer"
        )

    def test_swagger_e_redoc_abrem_sem_login(self):
        self.assertEqual(self.client.get("/api/docs/").status_code, 200)
        self.assertEqual(self.client.get("/api/redoc/").status_code, 200)

    def test_esquema_valido_e_sem_avisos(self):
        erros = StringIO()
        call_command("spectacular", "--validate", "--fail-on-warn", "--file", "/dev/null", stderr=erros)
        self.assertNotIn("Warning", erros.getvalue())
