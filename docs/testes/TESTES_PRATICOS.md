# Testes práticos na conta autorizada

Data: **27/10/2026**, America/Sao_Paulo. Aplicação:
https://lexnexo.vercel.app. Execução por interface de navegador, usando a
conta administrativa indicada pelo usuário. Credenciais e dados de outros
cadastros não são reproduzidos neste documento. A versão implantada não foi
associada a um commit verificável; o commit base local não deve ser atribuído
automaticamente ao site publicado.

O usuário autorizou criar dados de teste, autorizou os avisos automáticos da
aplicação e pediu expressamente para **manter os registros**. Nenhum cadastro
existente foi excluído, anonimizado ou inativado. As contas, perfis, senhas,
2FA e configurações de produção não foram alterados. Não houve cobrança,
pagamento real, mensagem manual a clientes ou chamada paga de IA.

## Registros preservados

Foram confirmados **19 registros de negócio**, incluindo três parcelas
criadas automaticamente. Rascunhos, tokens e registros de auditoria gerados
pelo funcionamento normal não entram nessa contagem.

| Entidade | Quantidade | Identificação e estado observado |
|---|---:|---|
| Clientes | 2 | AUDITORIA TCC — Cliente Fictício Alfa; AUDITORIA TCC — Cliente Fictício Beta; ambos ativos |
| Processos | 2 | AUDITORIA-TCC-20261027-01, título Processo cível Alfa; AUDITORIA-TCC-20261027-02, título Processo Beta sigiloso; ambos em andamento |
| Audiências/compromissos | 2 | Audiência de conciliação Alfa, 10/11/2026 14:30; Audiência de instrução Beta, 18/11/2026 09:00; pendentes |
| Prazos | 2 | Prazo fatal de manifestação Alfa, 04/11/2026 18:00; Prazo normal de revisão Beta, 12/11/2026 16:00; pendentes |
| Tarefas | 2 | Preparar documentos Alfa, alta, 03/11, em andamento; Revisar minuta Beta, média, 11/11, aberta; atribuídas à própria conta autorizada |
| Contrato | 1 | Processo Alfa, R$ 120,00 fictícios, parcelado; observação explícita de ausência de obrigação/cobrança real |
| Parcelas | 3 | R$ 40,00 cada, pendentes; vencimentos gravados em 28/10, 28/11 e 28/12/2026; preservadas como foram geradas |
| Apontamento | 1 | Alfa, 27/10/2026, 90 minutos, R$ 200/h, cálculo de R$ 300,00 fictícios |
| Despesa | 1 | Cópias fictícias Alfa, 27/10/2026, R$ 15,50 fictícios, a reembolsar |
| Documento | 1 | AUDITORIA TCC — Anexo fictício da marca LexNexo, no Alfa; arquivo público de marca, sem documento pessoal |
| Movimentação | 1 | Texto manual identificado como AUDITORIA TCC, sem andamento judicial real, no Alfa |
| Modelo | 1 | AUDITORIA TCC — Declaração fictícia de validação; tipo Declaração, com variáveis de cliente e processo |

Os números de documento dos clientes são sequências fictícias e os contatos
usam example.com e telefone sem uso real. O vínculo profissional foi escolhido
entre os cadastros existentes, sem modificar o profissional ou seus dados.

## Casos executados pela interface

Pré-condição comum: sessão administrativa autorizada, aplicação publicada
disponível e dados sintéticos acima. Passos seguem o
[manual](ARQUITETURA_API_E_MANUAL.md). Evidências: estados visíveis, confirmação
das listagens/ficha e capturas em `evidencias/pratico-*.png`. Esses resultados
não representam teste com usuário profissional nem validação de todos os perfis.

| ID | Módulo | Cenário/passos | Esperado | Observado | Status | Evidência |
|---|---|---|---|---|---|---|
| PR01 | Sessão | Login com a conta indicada | Dashboard administrativa | Dashboard carregada | APROVADO | Navegação real |
| PR02 | Clientes | Criar Alfa e Beta | Dois cadastros distintos | Dois clientes ativos na lista | APROVADO | Listagem e seletores seguintes |
| PR03 | Clientes | Editar endereço de Alfa | Alteração persistida | Mensagem de atualização e cadastro reutilizado | APROVADO | Edição real |
| PR04 | Clientes | Buscar por AUDITORIA TCC | Encontrar cadastros sintéticos | Alfa/Beta encontrados | APROVADO | Busca real |
| PR05 | Processos | Criar Alfa e Beta | Vínculos corretos | Dois processos nas listas/dashboard | APROVADO | Ficha e agenda |
| PR06 | Sigilo | Marcar Beta sigiloso como admin | Indicação de sigilo | Registro criado com opção ativa | APROVADO | Formulário; teste negativo por outro perfil só local |
| PR07 | Agenda | Criar duas audiências | Datas/horários e processo corretos | 10/11 14:30 Alfa e 18/11 09:00 Beta | APROVADO | Agenda real |
| PR08 | Calculadora | Referência 27/10, cinco dias úteis | 04/11, excluindo fim de semana e 02/11 | 04/11 retornado | APROVADO | Valor visível no formulário |
| PR09 | Agenda | Salvar prazo fatal Alfa e normal Beta | Prioridade/vínculos distintos | Dois prazos distintos após edição corretiva | APROVADO | pratico-prazos.png |
| PR10 | Tarefas | Criar duas tarefas para a própria conta | Responsável, prazo e prioridade | Alta/03-11 Alfa e média/11-11 Beta | APROVADO | Minhas tarefas |
| PR11 | Kanban | Alterar tarefa Alfa para em andamento | Estado atualizado | Ficha consolidada mostra Em andamento | APROVADO | Ficha real |
| PR12 | Contrato | Criar R$ 120 parcelados em três | Três parcelas de R$ 40 | Total e três parcelas confirmados | APROVADO | Lista expandida e ficha |
| PR13 | Documentos | Enviar PNG público da marca | Anexo vinculado ao Alfa | Mensagem de envio e item na lista/ficha | APROVADO | Listagem real |
| PR14 | Documentos | Clicar Abrir no anexo sintético | Visualização/download observável | Não houve nova aba observável no navegador integrado | BLOQUEADO | Ação executada; repetir em navegador com popups |
| PR15 | Horas | Registrar 1h30 a R$ 200/h | 90 min, R$ 300 | 1h30/R$ 300 na lista e ficha | APROVADO | Lista Horas |
| PR16 | Despesas | Registrar cópias de R$ 15,50 | Valor e reembolso corretos | Total/a reembolsar R$ 15,50 | APROVADO | Lista Despesas |
| PR17 | Ficha | Abrir Alfa com dados relacionados | Blocos coerentes | Contrato, parcelas, horas, despesas, tarefa, agenda e anexo | APROVADO | Ficha real |
| PR18 | Movimentações | Lançar descrição manual fictícia | Linha do tempo atualizada | Texto registrado e visível | APROVADO | Ficha real |
| PR19 | Modelos | Criar declaração fictícia | Modelo persistido | Listagem de modelos atualizada | APROVADO | Lista Modelos |
| PR20 | Geração | Gerar preview do modelo para Alfa | Substituir variáveis por dados sintéticos | Nome de Alfa e número do processo no preview | APROVADO | pratico-modelo.png |
| PR21 | Sessão | Sair e entrar novamente | Nova sessão funcional | Dashboard carregada novamente | APROVADO | Navegação real |
| PR22 | Persistência | Reabrir agenda após novo login | Manter dois prazos e duas audiências | Quatro linhas sintéticas na agenda; filtro Prazos mostra duas | APROVADO | pratico-prazos.png, recapturado após login |

Resultado: **21 APROVADO, 0 REPROVADO, 1 BLOQUEADO, 0 NÃO APLICÁVEL**.
São casos de verificação manual por agente; não somar seus registros de banco
à quantidade de testes automatizados.

## Problemas observados e tratamento

O formulário novo de agenda restaurou um rascunho anterior após a digitação,
resultando em um segundo prazo Alfa. O registro foi **editado** para o cenário
Beta planejado; nenhum dos dois foi apagado. A disputa assíncrona foi
reproduzida e corrigida no código local (A07), não no site publicado.

A primeira parcela foi gerada como 28/10 enquanto a data local ainda era
27/10. Os formulários de horas/despesas também sugeriram 28/10. As datas dos
lançamentos foram preenchidas manualmente como 27/10; as parcelas existentes
foram preservadas. A correção A08 vale para criações futuras após publicação.

Os avisos automáticos foram autorizados pelo usuário, mas a entrega efetiva
por SMTP/push não foi confirmada. Não confundir cadastro bem-sucedido com
comprovação de recebimento de e-mail. As credenciais da conta não foram
adicionadas a arquivos, scripts, relatórios ou testes.
