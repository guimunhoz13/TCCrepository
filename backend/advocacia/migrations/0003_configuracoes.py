from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("advocacia", "0002_escritorio_multitenancy"),
    ]

    operations = [
        migrations.AddField(
            model_name="usuario",
            name="telefone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.CreateModel(
            name="ConfiguracaoEscritorio",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("timezone", models.CharField(default="America/Sao_Paulo", max_length=100)),
                ("formato_data", models.CharField(choices=[("dmy", "DD/MM/AAAA"), ("mdy", "MM/DD/AAAA"), ("iso", "AAAA-MM-DD")], default="dmy", max_length=10)),
                ("retencao_documentos", models.CharField(choices=[("1y", "1 ano"), ("5y", "5 anos"), ("indeterminado", "Por tempo indeterminado")], default="indeterminado", max_length=30)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("escritorio", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="configuracao", to="advocacia.escritorio")),
            ],
        ),
        migrations.CreateModel(
            name="PreferenciasUsuario",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("tema", models.CharField(choices=[("light", "Claro"), ("dark", "Escuro")], default="dark", max_length=10)),
                ("densidade_tabela", models.CharField(choices=[("comfortable", "Confortável"), ("compact", "Compacta")], default="comfortable", max_length=20)),
                ("idioma", models.CharField(choices=[("pt-BR", "Português (Brasil)"), ("en-US", "English (US)"), ("es-ES", "Español")], default="pt-BR", max_length=10)),
                ("pagina_inicial", models.CharField(choices=[("dashboard", "Dashboard"), ("agenda", "Agenda"), ("clientes", "Clientes"), ("processos", "Processos")], default="dashboard", max_length=30)),
                ("notificacao_novo_processo", models.BooleanField(default=True)),
                ("notificacao_novo_documento", models.BooleanField(default=True)),
                ("notificacao_status_processo", models.BooleanField(default=False)),
                ("notificacao_novo_cliente", models.BooleanField(default=False)),
                ("lembrete_audiencia", models.BooleanField(default=True)),
                ("antecedencia_audiencia", models.PositiveSmallIntegerField(default=2)),
                ("lembrete_prazo", models.BooleanField(default=True)),
                ("resumo_semanal", models.BooleanField(default=False)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("usuario", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="preferencias", to="advocacia.usuario")),
            ],
        ),
    ]
