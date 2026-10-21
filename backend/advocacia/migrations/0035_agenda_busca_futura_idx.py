from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("advocacia", "0034_registroauditoria_alteracoes"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="agenda",
            index=models.Index(
                fields=["escritorio", "tipo", "cumprido", "data_evento"],
                name="agenda_busca_futura_idx",
            ),
        ),
    ]
