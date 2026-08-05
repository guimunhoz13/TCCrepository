# Generated manually for multi-tenancy

import django.db.models.deletion
from django.db import migrations, models


def criar_escritorio_padrao(apps, schema_editor):
    Escritorio = apps.get_model("advocacia", "Escritorio")
    Usuario = apps.get_model("advocacia", "Usuario")
    Cliente = apps.get_model("advocacia", "Cliente")
    Advogado = apps.get_model("advocacia", "Advogado")
    Processo = apps.get_model("advocacia", "Processo")

    if Escritorio.objects.exists():
        return

    escritorio, _ = Escritorio.objects.get_or_create(
        cnpj="00.000.000/0001-00",
        defaults={
            "nome": "Escritório Padrão",
            "email": "contato@escritorio.com",
            "telefone": "(00) 0000-0000",
            "endereco": "Endereço não informado",
        },
    )

    Usuario.objects.filter(escritorio__isnull=True).update(escritorio=escritorio)
    Cliente.objects.filter(escritorio__isnull=True).update(escritorio=escritorio)
    Advogado.objects.filter(escritorio__isnull=True).update(escritorio=escritorio)
    Processo.objects.filter(escritorio__isnull=True).update(escritorio=escritorio)


class Migration(migrations.Migration):

    dependencies = [
        ("advocacia", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Escritorio",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nome", models.CharField(max_length=255)),
                ("cnpj", models.CharField(max_length=18, unique=True)),
                ("email", models.EmailField(max_length=254)),
                ("telefone", models.CharField(max_length=20)),
                ("endereco", models.CharField(max_length=255)),
                ("cidade", models.CharField(blank=True, default="", max_length=100)),
                ("estado", models.CharField(blank=True, default="", max_length=2)),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name_plural": "Escritórios",
            },
        ),
        migrations.AddField(
            model_name="usuario",
            name="escritorio",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="usuarios",
                to="advocacia.escritorio",
            ),
        ),
        migrations.AddField(
            model_name="cliente",
            name="escritorio",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="clientes",
                to="advocacia.escritorio",
            ),
        ),
        migrations.AddField(
            model_name="advogado",
            name="escritorio",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="advogados",
                to="advocacia.escritorio",
            ),
        ),
        migrations.AddField(
            model_name="processo",
            name="escritorio",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="processos",
                to="advocacia.escritorio",
            ),
        ),
        migrations.RunPython(criar_escritorio_padrao, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="usuario",
            name="escritorio",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="usuarios",
                to="advocacia.escritorio",
            ),
        ),
        migrations.AlterField(
            model_name="cliente",
            name="escritorio",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="clientes",
                to="advocacia.escritorio",
            ),
        ),
        migrations.AlterField(
            model_name="advogado",
            name="escritorio",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="advogados",
                to="advocacia.escritorio",
            ),
        ),
        migrations.AlterField(
            model_name="processo",
            name="escritorio",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="processos",
                to="advocacia.escritorio",
            ),
        ),
        migrations.AlterUniqueTogether(
            name="cliente",
            unique_together={("escritorio", "cpf")},
        ),
        migrations.AlterUniqueTogether(
            name="advogado",
            unique_together={("escritorio", "oab")},
        ),
        migrations.AlterUniqueTogether(
            name="processo",
            unique_together={("escritorio", "numero_processo")},
        ),
        migrations.AlterField(
            model_name="cliente",
            name="cpf",
            field=models.CharField(max_length=14),
        ),
        migrations.AlterField(
            model_name="advogado",
            name="oab",
            field=models.CharField(max_length=30),
        ),
        migrations.AlterField(
            model_name="processo",
            name="numero_processo",
            field=models.CharField(max_length=100),
        ),
    ]
