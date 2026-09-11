# Bloqueio de login, prazos na agenda, contratos/honorários e administrador do sistema

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("advocacia", "0005_cliente_estado_civil_cliente_nacionalidade_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="SuperAdmin",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("nome", models.CharField(max_length=255)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("senha", models.CharField(max_length=255)),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Administrador do sistema",
                "verbose_name_plural": "Administradores do sistema",
            },
        ),
        migrations.AddField(
            model_name="agenda",
            name="cumprido",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="agenda",
            name="tipo",
            field=models.CharField(
                choices=[("compromisso", "Compromisso"), ("prazo", "Prazo")],
                default="compromisso",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="escritorio",
            name="plano",
            field=models.CharField(
                choices=[
                    ("gratuito", "Gratuito"),
                    ("basico", "Básico"),
                    ("profissional", "Profissional"),
                ],
                default="gratuito",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="escritorio",
            name="plano_validade",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="usuario",
            name="bloqueado_ate",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="usuario",
            name="tentativas_login",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AlterField(
            model_name="agenda",
            name="local_evento",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.CreateModel(
            name="Contrato",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "tipo_honorario",
                    models.CharField(
                        choices=[
                            ("fixo", "Valor fixo"),
                            ("exito", "Percentual de êxito"),
                            ("hora", "Por hora trabalhada"),
                        ],
                        default="fixo",
                        max_length=20,
                    ),
                ),
                ("valor_total", models.DecimalField(decimal_places=2, max_digits=12)),
                (
                    "forma_pagamento",
                    models.CharField(
                        choices=[("avista", "À vista"), ("parcelado", "Parcelado")],
                        default="avista",
                        max_length=20,
                    ),
                ),
                ("numero_parcelas", models.PositiveSmallIntegerField(default=1)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("ativo", "Ativo"),
                            ("quitado", "Quitado"),
                            ("cancelado", "Cancelado"),
                        ],
                        default="ativo",
                        max_length=20,
                    ),
                ),
                ("observacoes", models.TextField(blank=True, default="")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                (
                    "escritorio",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="contratos",
                        to="advocacia.escritorio",
                    ),
                ),
                (
                    "processo",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="contrato",
                        to="advocacia.processo",
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Parcela",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("numero", models.PositiveSmallIntegerField()),
                ("valor", models.DecimalField(decimal_places=2, max_digits=12)),
                ("data_vencimento", models.DateField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pendente", "Pendente"),
                            ("pago", "Pago"),
                            ("atrasado", "Atrasado"),
                        ],
                        default="pendente",
                        max_length=20,
                    ),
                ),
                ("pago_em", models.DateTimeField(blank=True, null=True)),
                (
                    "contrato",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="parcelas",
                        to="advocacia.contrato",
                    ),
                ),
            ],
            options={
                "ordering": ["numero"],
            },
        ),
    ]
