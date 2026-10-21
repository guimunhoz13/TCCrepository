from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("advocacia", "0033_rascunhoformulario"),
    ]

    operations = [
        migrations.AddField(
            model_name="registroauditoria",
            name="alteracoes",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
