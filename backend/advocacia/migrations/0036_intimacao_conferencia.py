from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("advocacia", "0035_agenda_busca_futura_idx")]

    operations = [
        migrations.AddField(model_name="intimacao", name="conferido_em", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="intimacao", name="conferido_por", field=models.ForeignKey(
            blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL,
            related_name="intimacoes_conferidas", to="advocacia.usuario")),
        migrations.AddField(model_name="intimacao", name="observacao_conferencia", field=models.TextField(blank=True, default="")),
    ]
