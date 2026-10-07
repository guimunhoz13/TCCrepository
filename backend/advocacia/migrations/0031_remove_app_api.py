"""Remove os restos do app `api`, um protótipo do início do projeto.

O app tinha um modelo Cliente próprio e rotas que nunca foram ligadas às
URLs do sistema; o cliente de verdade sempre foi advocacia.Cliente. Com o
app fora do INSTALLED_APPS, o Django não apaga a tabela sozinho, por isso
esta migração faz isso em quem já a tinha. Também tira do histórico uma
migração 0017_seguranca_clientes_agenda que existe só em um banco antigo e
nunca esteve no repositório.
"""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("advocacia", "0030_feriados_locais"),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                "DROP TABLE IF EXISTS api_cliente;",
                "DELETE FROM django_migrations WHERE app = 'api';",
                "DELETE FROM django_migrations WHERE app = 'advocacia' AND name = '0017_seguranca_clientes_agenda';",
            ],
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
