from django.core.files.base import ContentFile
from django.test import SimpleTestCase

from advocacia.views.comum import _resposta_download_arquivo


class DownloadTipoArquivoTests(SimpleTestCase):
    def test_pdf_com_titulo_sem_extensao_mantem_tipo_e_conteudo(self):
        arquivo = ContentFile(b"%PDF-1.4\nArquivo ficticio", name="documentos/arquivo.pdf")
        resposta = _resposta_download_arquivo(arquivo, "Petição da auditoria")
        try:
            self.assertEqual(resposta["Content-Type"], "application/pdf")
            self.assertIn("attachment;", resposta["Content-Disposition"])
            self.assertEqual(b"".join(resposta.streaming_content), b"%PDF-1.4\nArquivo ficticio")
        finally:
            resposta.close()
