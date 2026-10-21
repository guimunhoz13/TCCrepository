from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("advocacia", "0032_remove_feriadolocal_feriado_local_unico_por_data_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="RascunhoFormulario",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("chave", models.CharField(max_length=80)),
                ("dados", models.JSONField(default=dict)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("escritorio", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="rascunhos_formulario", to="advocacia.escritorio")),
                ("usuario", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="rascunhos_formulario", to="advocacia.usuario")),
            ],
            options={"ordering": ["-atualizado_em"]},
        ),
        migrations.AddConstraint(
            model_name="rascunhoformulario",
            constraint=models.UniqueConstraint(fields=("usuario", "chave"), name="rascunho_formulario_unico_por_usuario"),
        ),
    ]
