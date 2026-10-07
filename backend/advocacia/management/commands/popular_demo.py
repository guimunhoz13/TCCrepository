"""Cria um escritório de demonstração com dados realistas.

Serve para três coisas: apresentar o sistema (banca do TCC), testar à mão
depois de um deploy limpo e dar dados conhecidos aos testes de ponta a
ponta (Playwright) no CI.

    python manage.py popular_demo                # cria, se ainda não existir
    python manage.py popular_demo --recriar      # apaga e cria de novo
    python manage.py popular_demo --senha Outra@123

Todos os usuários entram com a mesma senha (padrão Demo@1234):
    admin@demo.lexoffice.app       Administrador
    advogada@demo.lexoffice.app    Advogado
    estagiario@demo.lexoffice.app  Estagiário
    financeiro@demo.lexoffice.app  Financeiro
    secretaria@demo.lexoffice.app  Secretária
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from advocacia.models import (
    Advogado,
    Agenda,
    ApontamentoHora,
    Cliente,
    ConfiguracaoEscritorio,
    Contrato,
    Despesa,
    Escritorio,
    FeriadoLocal,
    Movimentacao,
    Parcela,
    PreferenciasUsuario,
    Processo,
    Tarefa,
    Usuario,
)

CNPJ_DEMO = "00.000.000/0001-91"
DOMINIO = "demo.lexoffice.app"


class Command(BaseCommand):
    help = "Cria o escritório de demonstração (usuários, clientes, processos, agenda, tarefas e contrato)."

    def add_arguments(self, parser):
        parser.add_argument("--recriar", action="store_true", help="Apaga a demonstração existente e cria de novo.")
        parser.add_argument("--senha", default="Demo@1234", help="Senha de todos os usuários (padrão: Demo@1234).")

    def handle(self, *args, **opcoes):
        existente = Escritorio.objects.filter(cnpj=CNPJ_DEMO).first()
        if existente and not opcoes["recriar"]:
            self.stdout.write("O escritório de demonstração já existe. Use --recriar para começar do zero.")
            return
        with transaction.atomic():
            if existente:
                self._apagar(existente)
            self._criar(opcoes["senha"])
        self.stdout.write(self.style.SUCCESS(
            f"Demonstração pronta. Entre com admin@{DOMINIO} e a senha informada."
        ))

    def _apagar(self, escritorio):
        # Processo protege cliente e advogado (PROTECT): apaga na ordem.
        Processo.objects.filter(escritorio=escritorio).delete()
        Tarefa.objects.filter(escritorio=escritorio).delete()
        FeriadoLocal.objects.filter(escritorio=escritorio).delete()
        Usuario.objects.filter(escritorio=escritorio).delete()
        escritorio.delete()

    def _criar(self, senha):
        agora = timezone.now()
        hoje = timezone.localdate()

        def quando(dias, hora=14):
            return timezone.make_aware(datetime.combine(hoje + timedelta(days=dias), time(hora, 0)))

        escritorio = Escritorio.objects.create(
            nome="Silva & Sabino Advocacia (demonstração)",
            cnpj=CNPJ_DEMO,
            email=f"contato@{DOMINIO}",
            telefone="(18) 3321-0000",
            endereco="Av. Brasília, 1000 - Centro",
            cidade="Araçatuba",
            estado="SP",
            plano="profissional",
        )
        ConfiguracaoEscritorio.objects.create(
            escritorio=escritorio,
            tipo_chave_pix="email",
            chave_pix=f"financeiro@{DOMINIO}",
            nome_recebedor_pix="Silva Sabino Advocacia",
            cidade_pix="Aracatuba",
        )

        def usuario(email, nome, tipo, oab=None):
            pessoa = Usuario.objects.create(
                escritorio=escritorio,
                nome=nome,
                email=f"{email}@{DOMINIO}",
                senha=make_password(senha),
                telefone="(18) 99999-0000",
                tipo_usuario=tipo,
            )
            PreferenciasUsuario.objects.create(usuario=pessoa)
            if oab:
                return Advogado.objects.create(
                    escritorio=escritorio, usuario=pessoa, oab=oab,
                    especialidade="Cível e Trabalhista", valor_hora_padrao=Decimal("350.00"),
                )
            return pessoa

        dono = usuario("admin", "Guilherme Munhoz", "admin", oab="123456/SP")
        advogada = usuario("advogada", "Ana Beatriz Lima", "advogado", oab="234567/SP")
        estagiario = usuario("estagiario", "Lucas Pereira", "estagiario")
        usuario("financeiro", "Paula Martins", "financeiro")
        usuario("secretaria", "Rita Souza", "secretaria")

        maria = Cliente.objects.create(
            escritorio=escritorio, nome="Maria Fernanda Costa", cpf="123.456.789-00",
            email="maria.costa@example.com", telefone="(18) 99711-2233",
            endereco="Rua das Flores, 120 - Araçatuba/SP", consentimento_lgpd=True,
        )
        roberto = Cliente.objects.create(
            escritorio=escritorio, nome="Roberto Almeida Lima", cpf="987.654.321-00",
            email="roberto.lima@example.com", telefone="(18) 99822-3344",
            endereco="Av. Saudade, 455 - Birigui/SP", consentimento_lgpd=True,
        )
        empresa = Cliente.objects.create(
            escritorio=escritorio, tipo_pessoa="juridica", nome="Comercial Noroeste Ltda.",
            cnpj="11.222.333/0001-81", email="juridico@noroeste.example.com",
            telefone="(18) 3622-4455", endereco="Rua XV de Novembro, 800 - Araçatuba/SP",
        )

        trabalhista = Processo.objects.create(
            escritorio=escritorio, cliente=maria, advogado=dono,
            numero_processo="0001234-56.2026.5.15.0002", titulo="Reclamação trabalhista — horas extras",
            descricao="Cobrança de horas extras e reflexos.", area_direito="trabalhista",
            vara="2ª Vara do Trabalho de Araçatuba", comarca="Araçatuba", valor_causa=Decimal("48500.00"),
            nome_parte_contraria="Transportes Rápido S.A.", data_inicio=hoje - timedelta(days=120),
        )
        civel = Processo.objects.create(
            escritorio=escritorio, cliente=roberto, advogado=advogada,
            numero_processo="0005678-90.2026.8.26.0032", titulo="Ação de cobrança",
            descricao="Cobrança de contrato de prestação de serviços.", area_direito="civel",
            vara="1ª Vara Cível de Araçatuba", comarca="Araçatuba", valor_causa=Decimal("23800.00"),
            data_inicio=hoje - timedelta(days=60),
        )
        Processo.objects.create(
            escritorio=escritorio, cliente=maria, advogado=advogada, sigiloso=True,
            numero_processo="0009999-11.2026.8.26.0032", titulo="Guarda e alimentos",
            descricao="Segredo de justiça.", area_direito="familia",
            vara="Vara de Família de Araçatuba", comarca="Araçatuba",
        )
        Processo.objects.create(
            escritorio=escritorio, cliente=empresa, advogado=dono,
            numero_processo="0008888-22.2025.8.26.0100", titulo="Execução fiscal",
            descricao="Defesa em execução fiscal municipal.", area_direito="tributario",
            status="Suspenso", valor_causa=Decimal("12750.00"),
        )

        for dias, texto in ((2, "Conclusos para decisão"), (9, "Juntada de Petição de contestação"),
                            (20, "Audiência de conciliação realizada sem acordo")):
            Movimentacao.objects.create(
                processo=trabalhista, descricao=texto, origem="datajud",
                data_movimentacao=agora - timedelta(days=dias),
            )
        Movimentacao.objects.create(
            processo=civel, descricao="Citação do réu expedida", criado_por=advogada.usuario,
            data_movimentacao=agora - timedelta(days=5),
        )

        Agenda.objects.create(
            escritorio=escritorio, processo=trabalhista, tipo="prazo", prioridade="fatal",
            titulo="Prazo: réplica à contestação", descricao="15 dias úteis da intimação.",
            data_evento=quando(1, 18),
        )
        Agenda.objects.create(
            escritorio=escritorio, processo=trabalhista, tipo="compromisso",
            titulo="Audiência de instrução", descricao="Levar as testemunhas.",
            data_evento=quando(12, 14), local_evento="2ª Vara do Trabalho de Araçatuba",
        )
        Agenda.objects.create(
            escritorio=escritorio, processo=civel, tipo="prazo",
            titulo="Prazo: manifestação sobre a citação", descricao="",
            data_evento=quando(6, 18),
        )
        Agenda.objects.create(
            escritorio=escritorio, tipo="compromisso", titulo="Reunião com Comercial Noroeste",
            descricao="Primeira reunião sobre o contencioso tributário.", data_evento=quando(3, 10),
            local_evento="Escritório",
        )

        for titulo, responsavel, prioridade, situacao, dias in (
            ("Revisar a minuta da réplica", dono.usuario, "alta", "em_andamento", 1),
            ("Levantar jurisprudência sobre horas in itinere", estagiario, "media", "aberta", 5),
            ("Ligar para a testemunha", advogada.usuario, "alta", "aberta", 2),
            ("Renovar o certificado digital do escritório", dono.usuario, "baixa", "aberta", 20),
        ):
            Tarefa.objects.create(
                escritorio=escritorio, titulo=titulo, responsavel=responsavel, prioridade=prioridade,
                status=situacao, prazo=hoje + timedelta(days=dias), criado_por=dono.usuario,
                processo=trabalhista if "réplica" in titulo or "testemunha" in titulo else None,
            )

        # Feriados da comarca, que entram no cálculo de prazos.
        FeriadoLocal.objects.create(
            escritorio=escritorio, data=date(hoje.year, 7, 9), descricao="Revolução Constitucionalista",
            abrangencia="Estado de São Paulo", anual=True,
        )
        FeriadoLocal.objects.create(
            escritorio=escritorio, data=date(hoje.year, 12, 2), descricao="Aniversário de Araçatuba",
            abrangencia="Comarca de Araçatuba", anual=True,
        )

        contrato = Contrato.objects.create(
            escritorio=escritorio, processo=trabalhista, tipo_honorario="fixo",
            valor_total=Decimal("6000.00"), forma_pagamento="parcelado", numero_parcelas=3,
        )
        for numero in range(1, 4):
            Parcela.objects.create(
                contrato=contrato, numero=numero, valor=Decimal("2000.00"),
                data_vencimento=hoje + timedelta(days=30 * (numero - 1) - 10),
                status="pago" if numero == 1 else "pendente",
                pago_em=agora - timedelta(days=8) if numero == 1 else None,
            )

        ApontamentoHora.objects.create(
            escritorio=escritorio, processo=trabalhista, usuario=dono.usuario,
            data=hoje - timedelta(days=3), descricao="Elaboração da réplica",
            minutos=210, valor_hora=Decimal("350.00"),
        )
        Despesa.objects.create(
            escritorio=escritorio, processo=civel, tipo="custas", descricao="Custas iniciais",
            valor=Decimal("287.40"), data=hoje - timedelta(days=58), criado_por=advogada.usuario,
        )
