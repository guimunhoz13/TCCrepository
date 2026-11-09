# Roteiro de vídeo da pré-banca — LexNexo

Grupo TDS-2026-038 | revisão de 09/11/2026

## Roteiro de gravação LexNexo

Pré-banca 2026 | TDS-2026-038 | Revisão com slides em 09/11/2026

Guilherme Rossato Munhoz e João Henrique Souza Sabino. Tecnologia em Desenvolvimento de Sistemas. Orientador: Prof. Sérgio Luiz Tonsig. Coorientador: Prof. Francisco Antônio de Souza.

### Tempo total de até 20 minutos

| Tempo no vídeo | Parte | Duração | Apresentação |
| --- | --- | --- | --- |
| 00:00–03:00 | 1. Contexto e proposta | 3 min | Guilherme |
| 03:00–06:00 | 2. Arquitetura e tecnologias | 3 min | Guilherme / João |
| 06:00–12:00 | 3. Sistema em uso | 6 min | Guilherme |
| 12:00–17:00 | 4. Implementação | 5 min | João |
| 17:00–20:00 | 5. Resultados e fechamento | 3 min | Guilherme / João |

A divisão segue os cinco blocos sugeridos no PDF do professor. O encerramento está previsto para 19:45; os 15 segundos finais são margem para transições e corte, dentro do último bloco.

### Como usar este roteiro

As páginas 3 a 9 são a sequência de gravação. Cada cena traz o tempo, quem fala, o que deixar na tela e uma fala-base. Falem com suas palavras e façam pequenas pausas para a banca enxergar o resultado de cada clique. Guilherme apresenta o frontend e conduz a demonstração; João apresenta backend, APIs e banco de dados. Na parte técnica, Guilherme pode operar a interface enquanto João explica o processamento. Essa divisão de fala não declara autoria exclusiva de módulos.

### Escolham uma versão para mostrar

Para apresentar as correções mais recentes e alternar perfis sem afetar a conta real, prefiram uma base local isolada, identificada na abertura. Se usarem o site publicado, confiram primeiro a versão implantada. Em 09/11, as correções da aplicação 98ff6bf foram publicadas na Vercel e no Render. Confiram a versão novamente no dia da gravação. A base local continua indicada para exclusão, anonimização e troca de credenciais.

O vídeo deve mostrar o sistema funcionando. Diagramas e trechos de código complementam a demonstração; não substituem as ações na interface.

## Preparação antes de gravar

Façam um ensaio completo e deixem as abas na ordem de uso.

### Uma história principal, com dados fictícios

Use o cliente “Cliente Demonstração 038” e um processo com título “Caso Demonstração 038”. Prepare dados para copiar: CPF de teste livre na base, e-mail demonstracao038@example.com, telefone fictício e endereço fictício. Valide o cadastro no ensaio. Não marque consentimento em nome de uma pessoa real.

Prepare um contrato de R$ 100,01 em três parcelas, um prazo, uma audiência e uma declaração com variáveis. Na versão corrigida publicada em 09/11, as parcelas novas são R$ 33,33 + R$ 33,33 + R$ 33,35. A soma é R$ 100,01. Contratos antigos mantêm os valores com que foram criados; não recalcular só para a gravação.

Os registros AUDITORIA TCC 20261109 podem servir de referência no site: cliente e processo Ômega, agenda, documento e contrato. Gama e Delta anteriores continuam preservados. O processo Gama já possui contrato; para demonstrar criação de outro contrato, use um novo processo. Preserve esses registros e tudo que criar no sistema publicado.

### Abas e sessões preparadas

1. Apresentação com os seis slides prontos. 2. C1/C2/C3 completos e DER do RT apenas como apoio. 3. LexNexo como administrador. 4. Outra sessão local como estagiário ou outro perfil restrito. 5. Painel mestre local. 6. Editor com os arquivos da página 10. 7. Tabela de testes datada. Use dois perfis de navegador para não sobrescrever a sessão ao trocar de usuário.

### Pontos que precisam de ensaio próprio

| Ponto | Preparar antes |
| --- | --- |
| BrasilAPI e DataJud | Consultar apenas um CNPJ público e um processo público permitidos para demonstração. Não esperar que o número fictício do Gama retorne andamentos reais. |
| LGPD | Cliente fictício separado na base local para exportar e anonimizar. Não anonimizar os registros publicados que devem ser mantidos. |
| IA, e-mail e push | Confirmar plano, configuração e recebimento real. Se não estiverem disponíveis, usar a fala de limitação da página 8, sem apresentar mock como integração real. |
| Tela e áudio | Gravar em 1080p, aumentar fonte do editor e fechar avisos pessoais. Senhas, tokens, .env, QR TOTP e dados de clientes reais ficam fora do enquadramento. |

## Parte 1  Contexto e proposta

00:00–03:00 | Guilherme | Capa, exemplo do problema e visão do produto

### 00:00–00:35 — Guilherme

**Tela e cliques:** Slide 1: capa com LexNexo, grupo TDS-2026-038, integrantes, curso, orientador e coorientador.

**Fala sugerida:** Olá, somos Guilherme Rossato Munhoz e João Henrique Souza Sabino, do grupo TDS-2026-038. Nosso projeto é o LexNexo, um sistema web de gestão para escritórios de advocacia, desenvolvido no curso de Tecnologia em Desenvolvimento de Sistemas, com orientação do professor Sérgio Luiz Tonsig e coorientação do professor Francisco Antônio de Souza.

### 00:35–01:25 — Guilherme

**Tela e cliques:** Slide 2: problema de informações espalhadas e objetivo de reunir a rotina do escritório. Manter os slides na tela; a captura é ilustrativa.

**Fala sugerida:** Imagine um escritório que acompanha clientes em uma planilha, prazos em uma agenda e documentos em pastas separadas. Para saber o que precisa fazer em um processo, a equipe acaba consultando vários lugares. Essa fragmentação dificulta o acompanhamento e aumenta a chance de esquecer uma informação importante. Foi essa rotina que motivou o projeto.

### 01:25–02:15 — Guilherme

**Tela e cliques:** Continuar no slide 2 e explicar a relação entre cliente, processo, agenda, documentos e honorários.

**Fala sugerida:** O objetivo do LexNexo é reunir essas informações em um mesmo ambiente. Um cliente pode ter processos; cada processo pode reunir movimentações, documentos, compromissos e controle financeiro. A proposta é facilitar a consulta e manter a relação entre as informações, com acesso definido pelo perfil de cada usuário.

### 02:15–03:00 — Guilherme

**Tela e cliques:** Ainda no slide 2: público-alvo e ambiente da gravação. Preparar a passagem para a arquitetura.

**Fala sugerida:** O público-alvo são escritórios de advocacia e suas equipes. O sistema atende funções administrativas e de acompanhamento, sem substituir a análise jurídica do profissional. Nesta apresentação, vamos usar dados fictícios em uma base de demonstração local. Primeiro mostraremos a arquitetura, depois um fluxo de uso e, por fim, algumas decisões de implementação e os resultados dos testes.

**Conferência:** Se estiverem gravando em produção, substituam apenas “base de demonstração local” por “sistema publicado, com registros fictícios”.

## Parte 2  Arquitetura e tecnologias

03:00–04:00 Guilherme, frontend | 04:00–06:00 João, backend e banco

### 03:00–04:00 — Guilherme

**Tela e cliques:** Slide 3, Arquitetura do LexNexo. Destacar a interface em Next.js/React e a comunicação com a API. Permanecer nos slides; o editor entra no bloco de implementação.

**Fala sugerida:** Esta visão mostra a comunicação entre a interface, a API e o banco. No frontend, usamos Next.js e React para organizar páginas, painéis e formulários em componentes. A camada de serviços concentra as chamadas à API, e a interface apresenta estados de carregamento, confirmação e validação. Também trabalhamos a navegação, a adaptação para celular e as preferências visuais. Escolhemos essa organização para reaproveitar os elementos da interface e manter o comportamento consistente. O João vai explicar agora como essas requisições são processadas e como os dados se relacionam.

### 04:00–05:00 — João

**Tela e cliques:** Continuar no slide 3 e percorrer interface, API, ORM e banco. Apontar os serviços de implantação e as integrações.

**Fala sugerida:** A API utiliza Python, Django e Django REST Framework, e os dados são armazenados em PostgreSQL. O frontend envia requisições HTTP; a API valida a entrada, aplica permissões e acessa o banco pelo ORM. Django oferece uma estrutura para modelos, validações e autenticação, e PostgreSQL permite manter relacionamentos e transações. A implantação usa Vercel para o frontend, Render para a API e Supabase para banco e armazenamento quando configurado. No C2, essas unidades aparecem separadas. A versão e o ambiente desta gravação são os que identificamos na abertura.

**Conferência:** Não afirmar que um serviço ou bucket está ativo apenas porque aparece no diagrama. Conferir a implantação antes da gravação.

### 05:00–06:00 — João

**Tela e cliques:** Slide 4, Modelo de dados e módulos. Apontar Cliente, Processo, Contrato, Parcela, Agenda e Documento no recorte editável.

**Fala sugerida:** Internamente, a API está organizada por domínios, como clientes, processos, agenda e financeiro. O banco mantém os vínculos entre essas entidades. Um processo pertence a um cliente e pode ter um contrato; esse contrato reúne as parcelas. Documentos e eventos da agenda também se relacionam ao processo. O esquema é compartilhado entre os escritórios, e a API aplica o escopo do escritório nas consultas e nos vínculos. Este slide mostra um recorte dos relacionamentos. Agora vamos acompanhar esse caminho pela interface.

## Parte 3  Do cliente ao processo

06:00–09:00 | Guilherme | Demonstração de uso, sem explicar código neste bloco

### 06:00–06:25 — Guilherme

**Tela e cliques:** Entrar no sistema e mostrar a dashboard. Digitar a senha fora do enquadramento ou usar a sessão preparada; não exibir credenciais.

**Fala sugerida:** Depois da autenticação, a equipe tem uma visão dos processos e compromissos. Vamos acompanhar o cadastro de um cliente fictício e a organização do seu caso.

### 06:25–07:15 — Guilherme

**Tela e cliques:** Clientes → Novo. Mostrar uma validação de campo obrigatório, preencher dados fictícios preparados e salvar. Buscar o nome e confirmar o registro.

**Fala sugerida:** Aqui cadastramos a pessoa física. O formulário indica os campos obrigatórios e informa quando falta algum dado. Depois de salvar, o cliente aparece na lista e pode ser localizado pela busca.

**Conferência:** É uma criação real no ambiente informado, seguida de confirmação na lista. Não basta mostrar um formulário preenchido.

### 07:15–07:45 — Guilherme

**Tela e cliques:** No formulário de pessoa jurídica, demonstrar a consulta CNPJ já ensaiada. Mostrar os campos preenchidos e sua revisão. Retomar o cliente principal.

**Fala sugerida:** Para pessoa jurídica, a consulta cadastral pode preencher os dados a partir do CNPJ. A equipe confere o resultado antes de salvar. Se a consulta estiver indisponível, o formulário continua permitindo o preenchimento manual.

**Conferência:** Não salvar um cadastro empresarial real como cliente fictício. Para mostrar o cadastro completo de PJ, prepare uma base local apropriada e indique a origem dos dados. Se só consultar, diga que demonstrou a consulta, não o cadastro completo.

### 07:45–08:35 — Guilherme

**Tela e cliques:** Processos → Novo. Vincular ao cliente criado e a um responsável permitido; preencher os campos obrigatórios e salvar. Abrir a ficha.

**Fala sugerida:** Agora vinculamos um processo ao cliente e ao responsável. A ficha reúne os dados do caso e será o ponto de ligação para a agenda, os documentos e os honorários. O número deste caso é fictício e não representa uma ação judicial real.

**Conferência:** Use o formato aceito pelo sistema e já conferido no ensaio. Não inventar um número CNJ válido nem apresentá-lo como consulta real.

### 08:35–09:00 — Guilherme

**Tela e cliques:** Abrir a consulta DataJud em um caso público separado, previamente verificado. Mostrar um resultado real ou a mensagem efetiva de indisponibilidade.

**Fala sugerida:** A consulta ao DataJud é um fluxo separado deste processo fictício. Quando o serviço retorna dados, o usuário pode conferir as movimentações antes de incorporá-las. Não tratamos uma resposta vazia como confirmação de andamento.

**Conferência:** Se não houver acesso real, diga: “Nesta base, a consulta externa não está disponível; o lançamento manual está disponível”. Isso registra a limitação, mas não comprova a integração real exigida no parecer.

## Parte 3  Agenda, documentos e honorários

09:00–12:00 | Guilherme | Continuar no mesmo processo e mostrar os resultados

### 09:00–09:50 — Guilherme

**Tela e cliques:** Na ficha, registrar uma movimentação curta. Agenda → calcular prazo; usar feriado local preparado e salvar o prazo ligado ao processo. Mostrar uma audiência já cadastrada.

**Fala sugerida:** Registramos uma movimentação e criamos um prazo relacionado ao processo. O cálculo considera os dias úteis e o calendário informado, incluindo feriados locais quando cadastrados. A audiência e o prazo aparecem na agenda com data, horário e vínculo ao caso. A data calculada é um apoio: precisa de conferência do profissional.

**Conferência:** Exemplo para ensaio: início 10/11/2026, cinco dias úteis, sem incluir o início, e feriado local em 13/11. Conferir o resultado no sistema; não alterar feriados de abrangência real para a gravação.

### 09:50–10:25 — Guilherme

**Tela e cliques:** Modelos de documento → declaração fictícia → origem Processo → escolher o caso → Gerar documento. Mostrar as variáveis substituídas. Abrir o PDF fictício já anexado.

**Fala sugerida:** O modelo utiliza os dados do cadastro para preencher uma declaração. A equipe revisa o texto antes de imprimir ou salvar em PDF. O anexo fica vinculado ao processo e seu acesso passa pela autenticação.

**Conferência:** Deixe o arquivo e o modelo prontos. Só afirme upload demonstrado se tiver feito o envio no vídeo; abrir um anexo existente comprova abertura.

### 10:25–11:10 — Guilherme

**Tela e cliques:** Contratos → criar contrato para o processo novo, total R$ 100,01, três parcelas. Expandir as parcelas. Abrir Cobrar com PIX no modo Teste; mostrar QR code/copia e cola e a parcela pendente.

**Fala sugerida:** O contrato registra os honorários e gera as parcelas. Podemos conferir que a soma corresponde ao total contratado. O sistema também gera a opção de cobrança por PIX. Nesta demonstração usamos o modo de teste: não há movimentação de dinheiro e a parcela não é quitada pela simulação.

**Conferência:** Não chamar a simulação de integração bancária nem afirmar pagamento recebido. O caso novo não pode ter um contrato anterior.

### 11:10–11:40 — Guilherme

**Tela e cliques:** Alternar entre administrador e perfil restrito em sessões locais separadas. Procurar o mesmo processo sigiloso de demonstração e comparar o acesso.

**Fala sugerida:** O perfil define o que cada usuário pode visualizar e fazer. Além disso, processos em segredo de justiça recebem restrições adicionais. Aqui o administrador vê o registro; a outra identidade não tem a mesma autorização.

**Conferência:** Prepare um processo sigiloso específico e uma identidade que realmente não possa vê-lo. Não alterar o perfil de um colega real.

### 11:40–12:00 — Guilherme

**Tela e cliques:** Abrir a mesma tela em largura de celular, usar o menu e abrir a agenda ou ficha. Mostrar a ação, não só uma imagem parada.

**Fala sugerida:** A interface também se adapta a uma tela menor. O menu pode ser recolhido, e os campos e as informações principais continuam acessíveis. A seguir vamos mostrar como essas operações são tratadas no código.

## Parte 4  Como a operação é processada

12:00–14:30 | João | Código ampliado, com os arquivos já posicionados

### 12:00–12:45 — João

**Tela e cliques:** Editor: estrutura backend/advocacia/views, services/api.js e o trecho do ContratoSerializer. Usar a operação de contrato como exemplo. Mostrar a requisição sem cabeçalhos secretos, se já houver captura segura.

**Fala sugerida:** O frontend utiliza uma camada de serviços para enviar a requisição à API. No backend, a rota chega ao viewset do domínio. O serializer verifica os campos e os relacionamentos; depois a operação é persistida pelos modelos do Django. A resposta volta para a interface, que mostra o resultado ou uma mensagem de validação. No contrato, por exemplo, a validação impede que a quantidade de parcelas produza valores menores que um centavo.

**Conferência:** Percorrer interface → serviço HTTP → viewset → serializer → modelos. Não rolar o arquivo inteiro nem abrir .env ou Network com tokens.

### 12:45–13:30 — João

**Tela e cliques:** DER ampliado e backend/advocacia/models.py. Apontar as relações de Processo, Contrato e Parcela, sem abrir dados reais no banco.

**Fala sugerida:** No banco relacional, o processo se vincula ao cliente e ao escritório. Documentos e eventos da agenda se relacionam ao processo; o contrato se relaciona ao processo e reúne suas parcelas. As chaves estrangeiras mantêm esses vínculos e o ORM representa as relações no código. Os escritórios compartilham o esquema: a separação é aplicada pelos vínculos de escritório e pelo escopo das consultas na API. Para os valores financeiros, usamos campos decimais.

**Conferência:** Mostrar o modelo e o diagrama, sem afirmar esquemas separados ou RLS completa em todas as tabelas.

### 13:30–14:00 — João

**Tela e cliques:** mixins.py: EscritorioScopedMixin.get_queryset e _filtrar_por_escritorio. Depois permissoes.py/sigilo.py e um pequeno recorte de LoginView/segunda etapa.

**Fala sugerida:** A autenticação utiliza tokens, e as permissões são verificadas na API. O escritório do usuário filtra as consultas e os vínculos recebidos também são conferidos. Processos sigilosos têm uma restrição adicional. Esconder um botão na interface não substitui essas verificações no backend.

**Conferência:** Mostre o filtro concreto e a verificação de perfil. Não afirmar que isso, sozinho, comprova segurança completa ou todas as políticas de banco.

### 14:00–14:30 — João

**Tela e cliques:** financeiro.py: @transaction.atomic, perform_create e _gerar_parcelas. Deixar o teste de rollback ao lado.

**Fala sugerida:** Contrato e parcelas são criados em uma transação. Se ocorrer falha durante a geração, a operação não deve deixar um contrato incompleto. O cálculo usa valores decimais, e a última parcela recebe o ajuste de centavos. Há um teste que simula a falha na segunda parcela e verifica o rollback.

**Conferência:** Esse trecho é da revisão local validada. Se gravarem outra versão, confirmem que a implementação mostrada corresponde à aplicação usada.

## Parte 4  Recursos administrativos e testes

14:30–17:00 | João explica backend/banco | Guilherme opera as telas de demonstração

### 14:30–15:10 — João (fala); Guilherme (tela)

**Tela e cliques:** Clientes: exportar dados do cliente fictício local e abrir o arquivo. Em outro cliente local separado, mostrar a confirmação de anonimização e o resultado. Apontar exportar_dados/anonimizar no código.

**Fala sugerida:** A exportação reúne os dados do titular. A anonimização é uma ação diferente e remove dados pessoais conforme o fluxo implementado. Estamos usando outro cadastro fictício na base local, para preservar os registros principais da demonstração.

**Conferência:** Faça a anonimização apenas no cadastro local preparado para isso. Não anonimizar Gama, Alfa, Beta ou qualquer registro publicado que o proprietário pediu para manter.

### 15:10–15:35 — João (fala); Guilherme (tela)

**Tela e cliques:** Sessão local do painel mestre: visão de escritórios e administração da plataforma, sem alterar plano ou permissões reais.

**Fala sugerida:** O painel mestre é separado do painel de um escritório. Ele atende à administração da plataforma, enquanto a equipe do escritório trabalha apenas no contexto e nas permissões correspondentes.

**Conferência:** Não apresentar a conta comum como superadministrador. Mostrar uma sessão separada já preparada.

### 15:35–16:00 — João (fala); Guilherme (tela)

**Tela e cliques:** Se pronto no ensaio: Assistente IA, pergunta curta sobre o processo fictício e resposta contextual. Mostrar provedor OpenAI no quadro técnico, sem chave.

**Fala sugerida:** O assistente utiliza a API da OpenAI com contexto controlado da aplicação. O texto gerado é um apoio e exige revisão humana antes de ser usado ou enviado.

**Conferência:** Se não houver plano/configuração para resposta real, falar: “A integração está implementada, mas a chamada externa não foi validada nesta gravação”. Mostrar a limitação verdadeira; não ativar cobrança ou trocar plano real só para o vídeo.

### 16:00–16:15 — João (fala); Guilherme (tela)

**Tela e cliques:** Se preparado: mostrar a notificação push recebida no dispositivo de teste e a mensagem na caixa de e-mail de teste. Sem recibos reais, mostrar o sino interno e declarar o limite.

**Fala sugerida:** O sino interno reúne os alertas da aplicação. Push e e-mail são canais externos: só consideramos entrega comprovada quando a mensagem chega ao destino de teste.

**Conferência:** Salvar um prazo ou inscrever o aparelho não comprova recebimento de push/e-mail. Se indisponíveis, reduzir esta cena a uma frase de limitação.

### 16:15–17:00 — João

**Tela e cliques:** Tabela datada de métricas, resultado salvo dos testes e um teste de rollback ou isolamento. Mostrar o workflow e a divisão de pastas do repositório.

**Fala sugerida:** Na execução final de 9 de novembro, passaram 885 testes: 550 Django, 290 Jest e 45 Playwright. O CI tem registro próprio e não se soma à execução local. A cobertura de linhas é 91,85% no backend e 38,03% no frontend, abaixo da meta de 70%. Também conferimos fluxos publicados e mantivemos os dados fictícios. Isso aumenta a confiança nos cenários testados, mas não significa ausência de falhas.

## Parte 5  Resultados e fechamento

17:00–20:00 | Os dois integrantes | Encerrar a fala até 19:45

### 17:00–17:40 — Guilherme

**Tela e cliques:** Slide 5, Resultados da auditoria. Retomar o problema e o fluxo demonstrado; apresentar as métricas datadas.

**Fala sugerida:** Retomando o problema inicial, o LexNexo reúne informações que antes ficariam espalhadas em controles separados. Na demonstração, cadastramos um cliente, vinculamos um processo e acompanhamos agenda, documentos e honorários. A principal contribuição é manter a relação entre esses dados e permitir o acompanhamento conforme o perfil de acesso. Os testes documentam os cenários que conseguimos verificar.

### 17:40–18:30 — João

**Tela e cliques:** Slide 6, Limites e evolução. Identificar RF52, cobertura frontend e verificações externas pendentes.

**Fala sugerida:** Também há limites. A notificação automática ao cliente a cada atualização do processo permanece no backlog. O PIX demonstrado é estático ou simulado; não há confirmação bancária automática. A cobertura de frontend precisa crescer, e ainda precisamos de avaliação de usabilidade com profissionais. Integrações externas só são apresentadas como validadas quando conseguimos demonstrar uma resposta ou recebimento real.

**Conferência:** Acrescentar a situação verdadeira da publicação se houver diferença de versão; retirar apenas quando ela tiver sido conferida, não por presumir deploy.

### 18:30–19:15 — João

**Tela e cliques:** Continuar no slide 6 e comentar as dificuldades de isolamento por escritório e consistência financeira.

**Fala sugerida:** Entre as principais dificuldades estiveram a separação de dados entre escritórios, as diferenças de permissão e a consistência das operações financeiras. Trabalhamos com desenvolvimento incremental, testes e revisões para corrigir problemas encontrados. O projeto nos ajudou a relacionar interface, API, banco e documentação, e a perceber que uma funcionalidade precisa ser verificada além do caminho em que tudo dá certo.

### 19:15–19:45 — João

**Tela e cliques:** Voltar ao slide 1 como tela final. Agradecer em nome dos dois e encerrar até 19:45.

**Fala sugerida:** Como próximos passos, pretendemos ampliar os testes da interface, validar a operação dos serviços externos e realizar sessões com profissionais de advocacia. O LexNexo responde ao problema de organização ao reunir a rotina do escritório em um ambiente integrado. Agradecemos aos orientadores e à banca e ficamos à disposição para perguntas.

### 19:45–20:00  Margem, sem conteúdo novo

Use apenas o tempo necessário para uma transição curta ou tela final. Confira a duração do arquivo exportado, incluindo vinheta e créditos: o máximo é 20 minutos. Se já encerrou aos 19:45, não precisa completar os 20 minutos.

## Arquivos e abas para deixar prontos

Referência para o ensaio | Não ler estes caminhos em voz alta

| Minuto | Arquivo / símbolo | O que apontar |
| --- | --- | --- |
| 03:00 | Apresentação, slide 3 | Frontend e comunicação com a API. |
| 04:00 | Apresentação, slide 3 | API, banco, tecnologias e implantação. |
| 05:00 | Apresentação, slide 4 | Recorte dos relacionamentos e módulos da API. |
| 12:00 | frontend/src/services/api.js; backend/advocacia/serializers.py: ContratoSerializer | Requisição e validação. |
| 12:45 | backend/advocacia/models.py e recorte do DER | Chaves estrangeiras, vínculos, valores decimais e ORM. |
| 13:30 | backend/advocacia/mixins.py: EscritorioScopedMixin; permissoes.py; sigilo.py | Filtro por escritório e regras de acesso. |
| 13:30 | backend/advocacia/views/sessao.py: LoginView / LoginSegundoFatorView | Autenticação e segunda etapa, sem mostrar segredos. |
| 14:00 | backend/advocacia/views/financeiro.py: perform_create e _gerar_parcelas | Transação e ajuste do último valor. |
| 14:30 | backend/advocacia/views/clientes.py: exportar_dados / anonimizar | Duas ações distintas de privacidade. |
| 16:15 | backend/advocacia/tests/test_financeiro.py: AuditoriaIntegridadeContratoTests | Falha simulada na segunda parcela e ausência de gravação parcial. |
| 16:15 | docs/testes/evidencias/metricas-atuais.json; frontend/e2e/arquivos.spec.js | Contagens datadas; fluxo real de abertura/download. |

### Duas explicações curtas que vale ensaiar

Transação: “O contrato e suas parcelas formam uma operação. Se uma etapa falha, desfazemos a operação inteira, em vez de deixar dados pela metade”.

Separação por escritório: “Cada consulta usa o escritório do usuário autenticado. Os vínculos também são conferidos no backend, para impedir a associação com registros de outro escritório”.

### Se a banca pedir um número

Referência final em 09/11/2026: 550 + 290 + 45 = 885. Playwright inclui 41 cenários de navegador no computador, três no celular e um HTTP/proxy sem UI. Repetições Firefox/WebKit têm evidência própria e não aumentam esse total. O PWA offline usa worker real no Chromium; não chamar WebKit de Safari real. CI inicial 42616807545: 884 casos, antes do novo cenário PWA; execução complementar separada na fonte única.

## Conferência antes de enviar

O roteiro organiza a gravação; a evidência será o vídeo efetivamente produzido.

| Exigência / ponto do parecer | Onde está previsto | O que conferir no arquivo final |
| --- | --- | --- |
| Identificação e participação dos dois | 00:00; trocas de fala ao longo do vídeo | Grupo 038, nomes, curso e orientador legíveis; ambos apresentam. |
| Cinco partes e duração | 00:00–20:00 | Todos os blocos aparecem; arquivo completo tem até 20 min. |
| Arquitetura e modelo de dados | 03:00–06:00 | Slides 3 e 4 legíveis. C1/C2/C3 completos e implantação separados permanecem no RT. |
| Cliente → processo → agenda → documento → contrato | 06:25–11:10 | Ações e resultados vinculados, sem só percorrer telas prontas. |
| PJ/BrasilAPI e DataJud | 07:15; 08:35 | Distinguir consulta, cadastro e importação; resposta externa real quando exigida. |
| Perfis, sigilo e responsividade | 11:10–12:00; 13:30 | Outra identidade de fato restrita; operação visível em tela menor. |
| Backend, API, validação, banco e testes | 12:00–14:30; 16:15 | Trechos concretos e explicados; números com data. |
| LGPD e painel mestre | 14:30–15:35 | Exportação e anonimização apenas na base local fictícia; master em sessão própria. |
| IA e notificações externas | 15:35–16:15 | Resposta/recebimento real, ou limitação explicitamente reconhecida. |
| Resultados, limites e próximos passos | 17:00–19:45 | Retomar o objetivo, separar backlog e testes não concluídos, agradecer. |

### Como lidar com atraso ou serviço indisponível

No ensaio, aqueça os serviços e confira cada operação. Se um serviço externo falhar na gravação, mostre a mensagem e explique o limite; não substitua por uma imagem fingindo que a consulta ocorreu. Reduza descrições repetidas de tecnologia para recuperar segundos, mantendo uma ação completa de cada fluxo principal. Não acelere a parte que a banca precisa ler.

As cenas de integrações e privacidade têm tempos curtos e exigem preparação. Se não couberem no ensaio, o PDF do professor permite ajustar a distribuição mantendo os cinco blocos e o teto de 20 minutos. Exemplo alternativo: 2:30 contexto + 2:30 arquitetura + 8:00 demonstração + 4:30 implementação + 2:30 fechamento. Não aplicar esse ajuste silenciosamente: a rota principal deste documento conserva 3/3/6/5/3.

### Referências usadas para preparar o roteiro

Base: PDF de pré-banca fornecido em 06/11/2026, parecer do chat, RT v1.12, manual, código e métricas finais de 09/11. Este roteiro usa a auditoria de 09/11 e não substitui o vídeo. A preparação documental não cria nem apaga dados.
