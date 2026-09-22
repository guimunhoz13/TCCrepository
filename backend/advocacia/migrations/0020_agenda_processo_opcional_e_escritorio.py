from django.db import migrations, models
import django.db.models.deletion


def preencher_escritorio_existente(apps, schema_editor):
    Agenda = apps.get_model("advocacia", "Agenda")
    for evento in Agenda.objects.filter(escritorio__isnull=True).select_related("processo"):
        evento.escritorio_id = evento.processo.escritorio_id
        evento.save(update_fields=["escritorio"])


def reverter_preenchimento(apps, schema_editor):
    # Nada a fazer: a coluna escritorio é removida pela reversão do AddField.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("advocacia", "0019_alter_cliente_documento_identidade_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="agenda",
            name="processo",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="eventos_agenda",
                to="advocacia.processo",
            ),
        ),
        migrations.AddField(
            model_name="agenda",
            name="escritorio",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="eventos_agenda",
                to="advocacia.escritorio",
            ),
        ),
        migrations.RunPython(
            preencher_escritorio_existente, reverter_preenchimento
        ),
        migrations.AlterField(
            model_name="agenda",
            name="escritorio",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="eventos_agenda",
                to="advocacia.escritorio",
            ),
        ),
    ]
