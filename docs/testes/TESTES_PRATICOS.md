# Testes práticos na conta autorizada

<!-- auditoria-2026-11-09:inicio -->

## Auditoria final de 09/11/2026 — TDS-2026-038

**APTO COM RESSALVAS.** Referência final: **885 testes** — 550 Django, 290 Jest e
45 Playwright (44 cenários de navegador, três deles em viewport móvel, e um
HTTP/proxy sem UI). Rodadas e repetições entre navegadores não se somam.
Cobertura de linhas: **91,85% backend e 38,03% frontend**. A meta frontend de
70% permanece pendente; não foram excluídos componentes para elevar a medida.

Sete achados adicionais, A24–A30, foram corrigidos e retestados: consistência
contrato/parcelas, estorno e auditoria, entradas malformadas, cálculo de prazo,
vínculo cliente/processo no modelo, erro de baixa e foco/Escape em Configurações.
A aplicação `98ff6bf` foi publicada na Vercel e no Render. O CI dessa versão
aprovou 884 casos; o CI complementar [42620912216](https://github.com/guimunhoz13/TCCrepository/actions/runs/42620912216) aprovou 885 após acrescentar o caso PWA.

Na conta publicada: **37 APROVADO e 1 BLOQUEADO em 38 verificações**, com **15 novos
registros principais mantidos**. Cliente e processo foram criados pela interface;
os demais lançamentos tiveram conferência autenticada e confirmação visual na ficha.
Nenhum pagamento real, exclusão ou anonimização foi feito em produção. Cinco
anexos conservaram bytes/SHA-256 e os IDs anteriores de 13 famílias foram preservados.
A inspeção visual da nova aba PDF foi bloqueada pela política de URL blob da
ferramenta; a verificação binária da API tem evidência independente.

Fontes: [execuções](evidencias/2026-11-09/execucoes.json),
[catálogo](evidencias/2026-11-09/inventario-e-casos.md),
[práticos](evidencias/2026-11-09/praticos.json),
[publicação](PUBLICACAO-2026-11-09.md) e [métricas únicas](evidencias/metricas-atuais.json).
[38 casos publicados](evidencias/2026-11-09/praticos.json): 37 APROVADO,
1 BLOQUEADO por inspeção da aba blob no navegador integrado. Dois cadastros foram
feitos pela interface; demais lançamentos e regressões usam a API autenticada e
conferência da ficha. Consultas e verificações não contam como registros criados.

Foram mantidos 15 registros principais: cliente #9, processo #9, feriado #2,
eventos #15/#16, tarefa #8, movimento #4, modelo #4, documento #5, hora #3,
despesa #3, contrato #5 e parcelas #9/#10/#11. Localize 20261109 na busca.
A audiência é 26/11 14h30, prazo 17/11 18h, horas R$ 180,00 e despesa R$ 23,47.
Contrato R$ 100,01: 33,33 + 33,33 + 33,35, parcelas pendentes. O PDF sintético
reutiliza conteúdo de 03/11. Feriado restrito à comarca sintética. Nenhuma
exclusão, anonimização, mudança de credenciais ou pagamento real em produção.

Os registros Gama/Delta e os anteriores permanecem. Cinco anexos privados foram
comparados antes/depois do deploy, com bytes idênticos; IDs anteriores em 13
famílias foram preservados. Compromissos manteve modo compacto na conferência.

As seções datadas anteriores são histórico e não substituem esta referência.

<!-- auditoria-2026-11-09:fim -->

<!-- auditoria-2026-11-05:inicio -->

## Referência atual de 05/11/2026

Grupo confirmado: **TDS-2026-038**. A rodada local final possui **863 testes
aprovados** (536 Django, 288 Jest, 39 Playwright).
Consulte o [relatório de validação](RELATORIO_VALIDACAO.md), a
[fonte única de métricas](evidencias/metricas-atuais.json) e o
[catálogo atualizado](evidencias/2026-11-05/inventario-e-casos.md).
Abertura de documentos/relatórios e MIME PDF corrigidos localmente; publicação
aguarda reconexão ao Render e conferência do armazenamento. Vídeo a gravar pelos
integrantes. As seções abaixo conservam as datas e resultados históricos.

<!-- auditoria-2026-11-05:fim -->

<!-- auditoria-2026-11-04:inicio -->

## Nova rodada de 03 de novembro consolidada em 04 de novembro de 2026

Conta administrativa autorizada, site https://lexnexo.vercel.app, prefixo
**AUDITORIA TCC 20261103**. Pré-condições, passos, dados e evidências de cada
caso: [praticos.json](evidencias/2026-11-03/praticos.json). Retestes de A19/A20
foram realizados após a publicação de 7219e13; a observação anterior é mantida
no campo observado e o resultado final no campo reteste.

**Inventário mantido:** cliente #8; processos #7/#8; quatro eventos #11–14;
tarefa #7; contrato #4 e três parcelas; apontamento #2; despesa #2; modelo #3;
documento #4; movimentação #3; feriado #1. São 18 registros de negócio,
além de uma foto sintética e dos registros auxiliares automáticos. Todos
permanecem no sistema. O feriado tem abrangência fictícia específica, sem
regra global. As duas audiências e os dois prazos relacionam-se ao Gama;
o Delta sigiloso também foi criado e verificado, sem alterar cadastros reais.

Contrato R$ 100,01, parcelas antigas desta criação 33,34+33,34+33,33, todas
pendentes. O PIX foi apenas simulado. Horas: 75 min a 120/h = R$ 150,00,
com data efetivamente salva **27/10/2026**, restaurada do rascunho; não se afirma
que a data foi 03/11. Despesa R$ 23,45. Download do PDF comparado byte a byte
(SHA-256 em api-publicada.json). A foto está persistida; a primeira consulta
não preservou se o envio que gravou foi o da UI ou a tentativa complementar
por API, por isso não se atribui sucesso isolado ao upload da UI.

Resultado atual: **41 APROVADO, 0 REPROVADO,
2 BLOQUEADO, 0 NÃO APLICÁVEL** em 43 verificações.
Os bloqueios de abertura por nova aba continuam separados dos downloads/API.

| ID | Módulo | Cenário | Esperado | Observado inicial | Estado final |
|---|---|---|---|---|---|
| PR26-01 | Sessão | Login autorizado | Dashboard autenticada | Dashboard carregou com perfil Administrador; registros antigos AUDITORIA TCC presentes. | APROVADO |
| PR26-02 | Clientes | Criar cliente sintético | Cliente novo persistido | Cliente Gama salvo; total passou de 6 para 7; não foi marcado consentimento LGPD fictício. | APROVADO |
| PR26-03 | Clientes | Busca e edição do novo cliente | Busca encontra cliente e alteração é salva | Filtro retornou um resultado; endereço atualizado e mensagem de sucesso. | APROVADO |
| PR26-04 | Processos | Criar processo vinculado | Processo vinculado ao cliente e responsável | AUDITORIA-TCC-20261103-01 salvo com cliente Gama e responsável existente; estimativa de sucumbência 100,00 sobre 1000,00 a 10%. | APROVADO |
| PR26-05 | Agenda | Agendar audiência | Audiência com vínculo, dia e hora informados | Audiência Gama em 16/11/2026 às 14:30 exibida na lista com vínculo ao processo novo. | APROVADO |
| PR26-06 | Agenda | Feriado local com abrangência isolada | Suspensão com abrangência sintética, sem efeito global | 13/11/2026 salvo, abrangência AUDITORIA TCC 20261103; não se aplica a comarcas reais. | APROVADO |
| PR26-07 | Prazos | Calcular cinco dias úteis | Cinco dias úteis após 03/11 resultam em 10/11 | Referência 03/11/2026, excluída da contagem; resultado 10/11/2026. | APROVADO |
| PR26-08 | Prazos | Salvar prazo fatal | Prazo fatal com data e vínculo corretos | Prazo Gama listado para 10/11/2026 18:00; sino passou a dois fatais. | APROVADO |
| PR26-09 | Prazos | Salvar prazo normal | Prazo normal distinto do fatal | Prazo Delta em 24/11/2026 às 16:00 listado sem prioridade fatal. | APROVADO |
| PR26-10 | Agenda | Segunda audiência | Segunda audiência independente | Audiência Delta salva em 25/11/2026 às 09:00. | APROVADO |
| PR26-11 | Tarefas | Criar tarefa com prazo e responsável | Tarefa atribuída à própria conta com prazo | Tarefa Gama salva para Gui, alta prioridade, prazo 09/11. | APROVADO |
| PR26-12 | Kanban | Mover tarefa própria para Fazendo | Tarefa muda de coluna e persiste | Tarefa Gama aparece na coluna Fazendo com prazo e responsável preservados. | APROVADO |
| PR26-13 | Contratos | Criar contrato e conferir centavos | Parcelas somam exatamente 100,01 e ficam pendentes | Contrato 100,01; parcelas 33,34 + 33,34 + 33,33 = 100,01; todas pendentes, vencimentos 03/11,03/12,03/01. | APROVADO |
| PR26-14 | PIX | Simular pagamento sem alterar parcela | Simulação sem dinheiro e sem baixa real | Mensagem confirma simulação sem dinheiro e parcela real pendente. | APROVADO |
| PR26-15 | Horas | Apontar 75 minutos a 120 por hora | 75 minutos a 120/h resultam em 150; data efetiva identificada | 1h15 = R$ 150,00; registro manteve 27/10/2026 restaurado do rascunho e foi preservado com essa data. Total geral 2h45/R$450,00. | APROVADO |
| PR26-16 | Despesas | Lançar despesa reembolsável | Despesa 23,45 com reembolso | R$ 23,45 em 03/11; total de despesas 38,95 com registro anterior preservado. | APROVADO |
| PR26-17 | Modelos | Criar modelo com variáveis | Modelo novo com variáveis permitidas | Declaração Gama listada com data 03/11; modelo anterior preservado. | APROVADO |
| PR26-18 | Modelos | Gerar declaração por processo | Preview substitui variáveis sem executar código | Preview substituiu nome do cliente, número do processo e data atual 03/11/2026. | APROVADO |
| PR26-19 | Documentos | Selecionar arquivo pelo navegador integrado | PDF anexado ao processo correto | Após repetir o seletor pela ação acessível, o PDF foi enviado. Novo anexo listado em 03/11/2026 20:12:03; total de documentos passou de 2 para 3. A primeira leitura de input.files ocorreu antes da conclusão. | APROVADO |
| PR26-20 | Navegação | Compromissos após criar audiências | Compromissos preserva aparência entre rotas | Gama 16/11 14:30 e Delta 25/11 09:00 presentes; controle de densidade permaneceu compacto. | APROVADO |
| PR26-21 | Documentos | Abrir PDF pelo navegador integrado | PDF aberto em nova aba observável | Clique em Abrir sem nova aba ou conteúdo observável; sem erros no console. Upload confirmado; abertura/download por UI não comprovados. | BLOQUEADO |
| PR26-22 | Processos | Criar segundo processo com sigilo | Segundo processo marcado sigiloso | Delta salvo e disponível ao administrador com comarca AUDITORIA TCC 20261103; isolamento negativo exercitado apenas na suíte local. | APROVADO |
| PR26-23 | Ficha do processo | Consolidar vínculos e valores | Ficha reúne dados sintéticos relacionados | Ficha Gama reúne quatro eventos, tarefa em andamento, anexo, contrato 100,01 pendente, 150,00 de horas e 23,45 de despesas. | APROVADO |
| PR26-24 | Movimentações | Lançar andamento manual | Movimentação manual salva | Andamento sintético aparece na ficha do processo Gama. | APROVADO |
| PR26-25 | Comunicação | Preparar resumo sem envio | Resumo por fallback do plano, sem envio externo | Resumo identificado como Modelo automático, com andamento e eventos de Gama. Não acionado WhatsApp nem geração repetida. | APROVADO |
| PR26-26 | Documentos | Download autenticado por API | Download autenticado idêntico ao PDF original | HTTP 200; 1783 bytes; SHA-256 idêntico ao PDF original. Não equivale à abertura pelo navegador integrado. | APROVADO |
| PR26-27 | Relatórios | Relatório do processo via API | Relatório do processo coerente com ficha | Gama: 4 eventos, 1 documento, contrato 100,01; horas 150,00; despesas 23,45. | APROVADO |
| PR26-28 | Relatórios | Relatório do cliente via API | Relatório do cliente reúne dois processos | Cliente Gama reúne os dois processos sintéticos. | APROVADO |
| PR26-29 | Relatórios | Abrir relatório em nova aba pela interface | Relatório visual aberto em nova aba observável | Aplicação exibiu mensagem de relatório gerado; navegador integrado não expôs nova aba. Conteúdo foi conferido pela API em PR26-27/28. | BLOQUEADO |
| PR26-30 | Auditoria | Trilha das inclusões e edições | Auditoria registra criações sem exclusões da rodada | Registro de auditoria mostra criações de Cliente #8, Processos #7/#8, Agenda #11–#14, Tarefa #7, Contrato #4, Documento #4 e demais entidades; sem exclusões nesta rodada. | APROVADO |
| PR26-31 | Configurações | Inspecionar abas administrativas | Abas de configuração acessíveis sem alterações | Conta, Escritório/equipe, Notificações, Aparência, Dados, Relatórios, Auditoria e Faturamento abriram. Não alteradas credenciais, perfis, retenção ou assinatura; inspeção não comprova entrega SMTP/push. | APROVADO |
| PR26-32 | Busca | Buscar prefixo da auditoria em todas as áreas | Busca global agrupa novos registros | Busca 20261103 agrupou cliente, dois processos, tarefa, quatro eventos, anexo, contrato, horas e modelo. | APROVADO |
| PR26-33 | Equipe | Consultar advogados e vínculo existente | Cadastro existente de advogados acessível | Listagem carregou o profissional já vinculado aos processos; nenhum membro criado ou perfil alterado. | APROVADO |
| PR26-34 | Planos | Consultar plano e limites | Plano e limites correntes informados | Gratuito, 3/3 usuários e 5/30 processos; botões dos planos pagos identificados como teste. Nenhuma assinatura alterada. | APROVADO |
| PR26-35 | Assistente IA | Coerência da página com plano Gratuito | Plano Gratuito não oferece chat exclusivo de plano pago | Página ofereceu campo de pergunta no Gratuito. API protegida; nenhuma pergunta enviada. Correção A19 local com quatro regressões aprovadas, aguardando publicação. | APROVADO |
| PR26-36 | Contato | Consultar informações do sistema | Informação de contato acessível sem mensagem | Painel Contato & Informações carregou; nenhuma comunicação externa foi enviada. | APROVADO |
| PR26-37 | Ajuda | Pesquisar orientações sobre prazo | Ajuda encontra assunto pesquisado | Busca filtrou assuntos e destacou tópicos relacionados a prazos. | APROVADO |
| PR26-38 | Ajuda/navegação | Fechar ajuda após pesquisar | Fechar busca não solicita descarte de cadastro | Foi solicitada confirmação de alterações não salvas após uma simples busca. A20 reproduzido por duas regressões locais, com proteção de cadastros preservada. | APROVADO |
| PR26-39 | Alertas | Prazo fatal novo no sino | Sino mostra alertas de prazos | Sino informa 3 alertas, 2 fatais e inclui Gama em 10/11 18h. | APROVADO |
| PR26-40 | Calendário | Consultar dia da audiência | Calendário destaca audiência agendada | 16/11 exibe Audiência Gama às 14:30 no local fictício; feriado sintético também aparece no mês. | APROVADO |
| PR26-41 | Sessão | Sair pelo botão do sistema | Logout impede permanência autenticada | Logout redirecionou para a página pública; sessão auxiliar da API também encerrada. | APROVADO |
| PR26-42 | Persistência | Reabrir ficha após logout e novo login | Novo login conserva os dados criados | Gama manteve quatro eventos, anexo, tarefa, contrato pendente, movimentação, 75 minutos e despesa; segundo processo também permaneceu na dashboard. | APROVADO |
| PR26-43 | Fotos/proxy | Foto sintética do cliente Gama pela interface e API | Imagem persistida acessível autenticadamente tanto pela origem da interface quanto pela API; acesso anônimo negado. | Foto persistida como WEBP 128×128, 572 bytes; API direta 200, mesma rota pela Vercel 404. Correção de rewrite em validação. | APROVADO |

As 43 verificações não representam todos os estados possíveis. Entrega real
de SMTP/push, IA paga, agendador, ACL/bucket, restore, carga e estudo com
profissionais seguem bloqueados. Exclusão/anonimização/cobrança real não
foram feitas na conta; seus cenários negativos são locais. As capturas e
JSONs não divulgam credenciais nem cadastros de terceiros.

## Histórico dos testes práticos anteriores

<!-- auditoria-2026-11-04:fim -->

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

## Complemento publicado de 28/10/2026

Após a autorização para publicar, o commit 89b675f foi conferido na Vercel e no
Render. Foram exercitados os modos compacto/confortável, o menu recolhido,
Dashboard/Compromissos, voltar/avançar e a Agenda. As preferências originais foram
restauradas. Não houve inclusão ou exclusão de registros de negócio nessa rodada.
O bloqueio histórico de download de anexo não foi encerrado por esse smoke.
Veja [o registro de publicação](PUBLICACAO-2026-10-28.md).
