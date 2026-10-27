from django.db import migrations, models


def proteger_fotos(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    schema_editor.execute("ALTER TABLE advocacia_fotopersistente ENABLE ROW LEVEL SECURITY")
    with schema_editor.connection.cursor() as cursor:
        for papel in ("anon", "authenticated"):
            cursor.execute("SELECT 1 FROM pg_roles WHERE rolname = %s", [papel])
            if cursor.fetchone():
                schema_editor.execute(f"REVOKE ALL ON TABLE advocacia_fotopersistente FROM {schema_editor.quote_name(papel)}")


class Migration(migrations.Migration):
    dependencies = [("advocacia", "0036_intimacao_conferencia")]
    operations = [migrations.CreateModel(name="FotoPersistente", fields=[
        ("nome", models.CharField(max_length=500, primary_key=True, serialize=False)),
        ("conteudo", models.BinaryField(editable=False)),
        ("criado_em", models.DateTimeField(auto_now_add=True)),
    ]), migrations.RunPython(proteger_fotos, migrations.RunPython.noop)]
