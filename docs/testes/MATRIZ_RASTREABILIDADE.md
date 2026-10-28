# Matriz de rastreabilidade

Data: 27/10/2026 (America/Sao_Paulo). Base `8b41a295e0d7be677600295eb56537bb2c0f871e`.

Fonte dos requisitos: backlog RF01–RF53 e RNF01–RNF21 de `docs/tcc/gerar_rt.js`.
Estado APROVADO refere-se aos cenários locais executados, não à integralidade de cada requisito.
Os limites externos da última coluna continuam BLOQUEADO quando exigem serviços reais.
Cada caso e arquivo pode ser localizado em [INVENTARIO_E_CASOS.md](INVENTARIO_E_CASOS.md) e
[evidencias/casos-executados.json](evidencias/casos-executados.json).

| Requisito | Funcionalidade ou tela/API | Casos/evidência | Estado | Limites |
|---|---|---|---|---|
| RF01 | Cadastro e login de usuário, com bloqueio após tentativas inválidas | `backend/advocacia/tests/test_autenticacao.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF02 | Validação de formulários (e-mail, CPF/CNPJ, telefone, OAB, senha forte) | `backend/advocacia/tests/test_validacoes.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF03 | Cadastro, edição, inativação e exclusão de clientes | `backend/advocacia/tests/test_clientes.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF04 | Cadastro, edição e acompanhamento de processos | `backend/advocacia/tests/test_processos.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF05 | Registro de movimentações do processo | `backend/advocacia/tests/test_processos.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF06 | Upload e organização de documentos do processo | `backend/advocacia/tests/test_processos.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF07 | Controle de prazos e compromissos (agenda) | `backend/advocacia/tests/test_agenda.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF08 | Contratos e honorários, com geração de parcelas | `backend/advocacia/tests/test_financeiro.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF09 | Registro de pagamento de parcelas | `backend/advocacia/tests/test_financeiro.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF10 | Geração de relatórios (PDF e e-mail) | `backend/advocacia/tests/test_relatorios.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Envio real por SMTP/entrega externa BLOQUEADO; testes com mocks/locmem |
| RF11 | Envio de contato ao cliente via WhatsApp | `frontend/src/utils/__tests__/whatsapp.test.js`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF12 | Filtro e busca de clientes e processos | `backend/advocacia/tests/test_busca.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF13 | Listagem de processos ativos e finalizados | `backend/advocacia/tests/test_processos.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF14 | Permissões por tipo de usuário | `backend/advocacia/tests/test_permissoes.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF15 | Cadastro e gerenciamento de advogados | `backend/advocacia/tests/test_cadastro_e_equipe.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF16 | Assistente de inteligência artificial contextual | `backend/advocacia/tests/test_ia.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | OpenAI paga BLOQUEADO; respostas/falhas simuladas e fallback local |
| RF17 | Painel administrativo da plataforma | `backend/advocacia/tests/test_auditoria_e_mestre.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF18 | Registro de auditoria (login e criação/edição/exclusão de dados) | `backend/advocacia/tests/test_auditoria_e_mestre.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF19 | Redefinição de senha por e-mail | `backend/advocacia/tests/test_autenticacao.py`; casos do catálogo | APROVADO | Solicitação/validação com e-mail em memória; entrega SMTP BLOQUEADO |
| RF20 | Confirmação de e-mail no auto-cadastro do escritório (produção) | `backend/advocacia/tests/test_cadastro_e_equipe.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Envio real por SMTP/entrega externa BLOQUEADO; testes com mocks/locmem |
| RF21 | Revogação de sessão ao sair do sistema (logout) | `backend/advocacia/tests/test_autenticacao.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF22 | Cálculo automático de prazo processual em dias úteis | `backend/advocacia/tests/test_feriados_locais.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF23 | Registro de dados jurídicos do processo (área, vara, comarca, valor da causa, parte contrária) | `backend/advocacia/tests/test_processos.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF24 | Estimativa de honorários de sucumbência | `backend/advocacia/tests/test_processos.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF25 | Envio automático de lembretes de prazo/compromisso e resumo semanal por e-mail | `backend/advocacia/tests/test_lembretes_e_avisos.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Envio real por SMTP/entrega externa BLOQUEADO; testes com mocks/locmem |
| RF26 | Apontamento de horas trabalhadas por processo (timesheet) | `backend/advocacia/tests/test_horas_e_despesas.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF27 | Lançamento de custas e despesas processuais reembolsáveis | `backend/advocacia/tests/test_horas_e_despesas.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF28 | Medição do tempo de uso do sistema por usuário | `backend/advocacia/tests/test_horas_e_despesas.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF29 | Consulta processual automática na API pública do DataJud (CNJ) | `backend/advocacia/tests/test_datajud.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Integração externa simulada; credenciais/entrega/agendador remoto BLOQUEADO |
| RF30 | Modelos de documento preenchidos com os dados cadastrados | `backend/advocacia/tests/test_modelos_documento.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF31 | Sincronização periódica e automática dos processos com o DataJud | `backend/advocacia/tests/test_datajud.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Integração externa simulada; credenciais/entrega/agendador remoto BLOQUEADO |
| RF32 | Relatórios de cliente e de processo com contratos, horas e despesas | `backend/advocacia/tests/test_relatorios.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF33 | Indicadores financeiros do escritório no painel inicial | `backend/advocacia/tests/test_dashboard.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF34 | Tarefas com responsável, prioridade, prazo e acompanhamento | `backend/advocacia/tests/test_tarefas.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF35 | Instalação do sistema como aplicativo (PWA), com tela de indisponibilidade | `frontend/src/lib/__tests__/service-worker.test.js`; casos correspondentes do catálogo e execucoes.json | APROVADO | Service worker testado; instalação/entrega push em aparelhos reais BLOQUEADO |
| RF36 | Central de ajuda contextual, acessível de qualquer tela | `frontend/src/lib/__tests__/ajuda.test.js`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF37 | Busca global sobre todas as áreas do sistema | `backend/advocacia/tests/test_busca.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF38 | Perfis de acesso (administrador, advogado, estagiário, financeiro, secretária) | `backend/advocacia/tests/test_permissoes.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF39 | Cadastro de membros da equipe e troca de perfil pelo administrador | `backend/advocacia/tests/test_cadastro_e_equipe.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF40 | Processo em segredo de justiça | `backend/advocacia/tests/test_permissoes.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF41 | Verificação em duas etapas no login (TOTP) | `backend/advocacia/tests/test_autenticacao.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF42 | Direitos do titular (LGPD): consentimento, exportação e anonimização | `backend/advocacia/tests/test_clientes.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF43 | Agenda em iCalendar (.ics) e assinatura em aplicativos de agenda | `backend/advocacia/tests/test_agenda_ics.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Integração externa simulada; credenciais/entrega/agendador remoto BLOQUEADO |
| RF44 | Quadro Kanban de tarefas | `backend/advocacia/tests/test_kanban.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF45 | Cobrança de parcela por PIX (QR code e copia e cola) | `backend/advocacia/tests/test_pix.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF46 | Atualização do andamento para o cliente em linguagem simples (IA) | `backend/advocacia/tests/test_resumo_cliente.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | OpenAI paga BLOQUEADO; respostas/falhas simuladas e fallback local |
| RF47 | Importação de intimações do DJEN com prazo lançado na agenda | `backend/advocacia/tests/test_djen.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF48 | Notificações push no celular e no navegador | `backend/advocacia/tests/test_push.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Integração externa simulada; credenciais/entrega/agendador remoto BLOQUEADO |
| RF49 | Planos de assinatura (Gratuito, Básico e Profissional) com limites e recursos | `backend/advocacia/tests/test_planos.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Catálogo e limites; não existe gateway de cobrança online |
| RF50 | Feriados locais e suspensões de expediente no cálculo de prazos | `backend/advocacia/tests/test_feriados_locais.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |
| RF51 | Preenchimento dos dados da empresa pelo CNPJ (BrasilAPI) | `frontend/src/utils/__tests__/cnpj.test.js + e2e/evolucao.spec.js`; casos correspondentes do catálogo e execucoes.json | APROVADO | Integração externa simulada; credenciais/entrega/agendador remoto BLOQUEADO |
| RF52 | Notificação automática ao cliente a cada atualização | Inspeção do backlog: Adiado; nenhuma implementação n8n encontrada | NÃO APLICÁVEL | Requisito adiado, sem aprovação funcional |
| RF53 | Conferência rastreável de prazos importados do DJEN | `backend/advocacia/tests/test_djen.py`; casos correspondentes do catálogo e execucoes.json | APROVADO | Cenários do runner final; não garante todos os caminhos/volumes |

## Requisitos não funcionais

| Requisito | Critério | Evidência | Estado | Limite |
|---|---|---|---|---|
| RNF01 | O sistema deve funcionar nos principais navegadores modernos | Playwright Chromium desktop/Pixel 7 | BLOQUEADO | Firefox/WebKit não instalados; não há conclusão multibrowser |
| RNF02 | O sistema deve possuir interface responsiva (desktop e dispositivos móveis) | e2e/responsividade.spec.js, celular.spec.js e rolagem.spec.js | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF03 | O sistema deve possuir autenticação segura de usuários, via token JWT | test_autenticacao.py; teste sem JavaScript; check --deploy | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF04 | O sistema deve isolar completamente os dados entre escritórios (multi-tenant) | test_permissoes.py; testes IDOR/sigilo e de relações | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF05 | O sistema deve oferecer suporte a modo claro e escuro | e2e/preferencias.spec.js; PreferencesContext | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF06 | O sistema deve oferecer suporte a múltiplos idiomas (português, inglês e espanhol) | lib/__tests__/i18n.test.js | BLOQUEADO | Traduções testadas; percurso completo em inglês/espanhol não executado |
| RNF07 | O sistema deve limitar a taxa de requisições (rate limiting) em endpoints sensíveis a abuso, como login, cadastro e redefinição de senha | test_autenticacao.py (throttles reativados pontualmente) | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF08 | As listagens da API devem ser paginadas, para que o tempo de resposta não cresça de forma ilimitada com o volume de dados de um escritório | test_clientes.py/test_processos.py; paginação e medição SQL | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF09 | A sessão de um usuário deve poder ser encerrada de forma efetiva no servidor (não apenas apagando o token no navegador), reduzindo o risco de uso indevido de um token copiado | test_autenticacao.py; E2E logout | APROVADO | Logout revoga refresh; access copiado pode durar até 30 minutos (comportamento documentado) |
| RNF10 | O conteúdo de um modelo de documento, escrito pelo próprio usuário, deve ser tratado como dado e nunca interpretado como código: o preenchimento resolve apenas variáveis de um catálogo fechado, de modo que não seja possível, a partir de um modelo, alcançar dados não previstos | test_modelos_documento.py; preview sintético da conta | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF11 | A integração com serviços externos não deve derrubar a operação: indisponibilidade de rede, credencial ausente ou resposta em formato inesperado devem resultar em mensagem específica ao usuário, e não em erro genérico. | test_ia.py/test_datajud.py/test_djen.py/test_push.py | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF12 | Nenhum dado de processo, cliente ou financeiro pode ser armazenado no dispositivo do usuário pelo mecanismo de funcionamento offline: sendo o sistema multi-escritório e autenticado por token, um armazenamento local de respostas da API exibiria dados de um escritório a quem usasse o mesmo aparelho em seguida, e apresentaria informação desatualizada como se fosse o estado atual | lib/__tests__/service-worker.test.js e inspeção do service worker | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF13 | As cores utilizadas para distinguir categorias em gráficos devem ser legíveis também por usuários com deficiência na percepção de cores, verificando-se a separação entre cores vizinhas sob protanopia, deuteranopia e tritanopia, além do contraste em relação ao fundo de cada tema | Inspeção de temas e axe; sem simulação cromática completa | BLOQUEADO | Falta revisão humana e simulação de deficiências cromáticas |
| RNF14 | Um mesmo conceito deve receber a mesma cor em toda a interface: o estado de um processo apresentado em uma tabela e no gráfico do painel não pode ser representado por cores distintas | lib/__tests__/statusProcesso.test.js e tabela de cores compartilhada | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF15 | As permissões de acesso devem ser verificadas no servidor, a cada requisição; a interface apenas deixa de exibir o que a API recusaria, de modo que esconder um botão nunca seja a única proteção | test_auditoria.py; 155 operações anônimas; ficha por perfil | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF16 | O contexto da IA deve minimizar dados pessoais: omitir CPF/CNPJ, endereço, e-mail e telefone dos campos estruturados, abreviar nomes e mascarar identificadores reconhecidos nos textos. A minimização automática não garante a remoção de todo dado pessoal em texto livre; o usuário deve revisar o conteúdo enviado e gerado | test_ia.py/test_resumo_cliente.py; minimização e prompt injection por inspeção | APROVADO | Texto livre pode conter dados sensíveis; sem certificação LGPD |
| RNF17 | As notificações push devem ser cifradas de ponta a ponta para o aparelho de destino (RFC 8291) e assinadas pelo servidor (VAPID, RFC 8292); sem as chaves configuradas, o recurso fica desligado sem afetar o restante do sistema | test_push.py decifra mensagem e verifica VAPID; requests mockado | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF18 | A API deve ser documentada no padrão OpenAPI 3, com o esquema gerado a partir do próprio código e validado automaticamente, de modo que a documentação não se desatualize em relação às rotas | spectacular --validate --fail-on-warn; test_documentacao_api.py | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF19 | Cada alteração deve passar, em integração contínua, por testes automatizados em três níveis — API, componentes de interface e ponta a ponta — e por uma checagem automática de acessibilidade WCAG 2 AA das telas principais | .github/workflows/ci.yml inspecionado e suítes locais executadas | BLOQUEADO | Execução remota do GitHub Actions e proteção de branch não consultadas |
| RNF20 | O código do backend deve ser organizado por domínio (um módulo de views e um de testes por assunto), para que uma alteração em uma área não exija percorrer arquivos de milhares de linhas | Módulos backend/advocacia/views e tests separados por domínio | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |
| RNF21 | Consultas a serviços públicos externos feitas pelo navegador, como o BrasilAPI e o ViaCEP, devem estar autorizadas na política de segurança de conteúdo (CSP) e nunca condicionar a operação: a indisponibilidade do serviço apenas deixa de preencher os campos, sem impedir o cadastro. | next.config.mjs; testes CNPJ/CEP/falha BrasilAPI no navegador | APROVADO | Escopo das verificações indicadas; acessibilidade automática não é certificação |

## Cobertura dos contratos e das ações

O [inventário](INVENTARIO_E_CASOS.md) relaciona as 166 operações canônicas da API,
13 páginas e 27 modelos. CRUD, ações de usuário e serviços são agrupados nas famílias
acima; cada família aponta a casos realmente executados. Ausência de gateway de
pagamento, peticionamento com certificado e automação n8n não foi tratada como
funcionalidade entregue. Nenhuma aprovação implica verificação de produção.

As metas de cobertura estão no relatório: backend supera 80% de linhas; frontend
fica abaixo de 70%. Os 155 cenários sem token são subtestes de um único teste Django
e não foram adicionados à contagem de 532 testes como se fossem métodos separados.

## Complemento de 28/10/2026

RNF02 recebeu duas verificações adicionais de estabilidade da interface na
navegação Dashboard/Compromissos: E2E-035 e E2E-036, aprovadas após corrigir A13.
Elas observam densidade e estado do menu durante a transição, o histórico do
navegador e a abertura da Agenda. A suíte atual tem 36 E2E aprovados.
Resultados e limites estão no
[reteste da dashboard](RELATORIO_VALIDACAO.md#reteste-da-dashboard).

## CI e publicação verificados em 28/10/2026

A execução remota 40785092492 do commit 89b675f aprovou os jobs de backend,
frontend, E2E e Compose. Isso comprova a execução dos três níveis de testes de
RNF19 na versão publicada; a `main` foi consultada e não tem proteção de branch
configurada, portanto passagem do CI não deve ser descrita como bloqueio
obrigatório de merge. O escopo da checagem de acessibilidade continua limitado
aos casos existentes. RNF02 também recebeu smoke publicado da navegação nos
dois modos de densidade. Evidências e limites:
[PUBLICACAO-2026-10-28.md](PUBLICACAO-2026-10-28.md).
