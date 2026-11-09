# Plano de gravação e montagem do vídeo LexNexo

Grupo TDS-2026-038 | revisão de 09/11/2026

## Plano de gravação e montagem do vídeo LexNexo

Guilherme Rossato Munhoz e João Henrique Souza Sabino | TDS-2026-038

Preparem oito clipes e montem um único vídeo de até 20 minutos. A ordem abaixo preserva os cinco blocos do professor: 3 minutos de contexto, 3 de arquitetura, 6 de demonstração, 5 de implementação e 3 de fechamento. A fala termina em 19:45; os 15 segundos restantes são margem, sem conteúdo novo.

| Ordem e tempo final | Quem apresenta | Tela principal |
| --- | --- | --- |
| 01 — 00:00 a 03:00 | Guilherme | Slides 1 e 2 |
| 02 — 03:00 a 04:00 | Guilherme | Slide 3 |
| 03 — 04:00 a 06:00 | João | Slides 3 e 4 |
| 04 — 06:00 a 12:00 | Guilherme | Sistema no navegador |
| 05 — 12:00 a 14:30 | João | Editor e DER |
| 06 — 14:30 a 17:00 | João narra; Guilherme grava telas de apoio | Sistema, código e testes |
| 07 — 17:00 a 17:40 | Guilherme | Slide 5 |
| 08 — 17:40 a 19:45 | João | Slide 6 e capa final |

### Trocas de tela na montagem

01 para 02: continuar nos slides e trocar para a arquitetura. 02 para 03: manter o mesmo diagrama e trocar a voz para João. 03 para 04: sair dos slides e entrar no navegador. 04 para 05: sair do sistema e abrir o editor. 05 para 06: intercalar as telas de apoio com a explicação técnica. 06 para 07: voltar ao slide de resultados. 07 para 08: trocar para limitações e encerrar na capa.

A gravação pode ser feita em outra ordem. Os números dos arquivos determinam a posição na edição, não obrigam vocês a gravar juntos ou em sequência.

## Slides prontos e preparação da gravação

| Slide | Conteúdo do slide | Quem usa |
| --- | --- | --- |
| 1 | Capa: LexNexo, grupo 038, integrantes, curso, orientador e coorientador. | Guilherme na abertura; João no fim. |
| 2 | Problema, objetivo e público-alvo. Um fluxo simples: cliente > processo > prazo > documento > honorários. | Guilherme |
| 3 | Slide 3, Arquitetura do LexNexo: containers, tecnologias, implantação e comunicação frontend/API/banco. | Guilherme e João |
| 4 | Slide 4, Modelo de dados e módulos: recorte de Cliente, Processo, Contrato, Parcela, Agenda e Documento. | João |
| 5 | Resultados: fluxo demonstrado, 885 testes em 09/11 e cobertura de linhas 91,85% backend / 38,03% frontend. | Guilherme; João retoma os números nos testes. |
| 6 | Limitações, dificuldades, aprendizados e evolução. RF52 adiado e cobertura frontend abaixo da meta. | João |

### Abas prontas antes de apertar Gravar

Deixem abertos os slides, o LexNexo com sessão preparada, uma segunda sessão local de perfil restrito e o editor com os trechos marcados. No sistema, preparem cliente e processo fictícios novos, declaração com variáveis, PDF fictício, calendário de teste e contrato ainda não criado para esse processo. A gravação deve identificar se usa base local ou sistema publicado.

### Gravação e corte

Usem a mesma resolução, preferencialmente 1920 x 1080, e fonte ampliada. Gravem dois segundos de respiro no início e no fim de cada arquivo e removam esses trechos na edição. Façam cortes diretos na troca de falante ou tela, sem acrescentar uma vinheta a cada clipe. A duração final inclui todas as transições, capa e créditos.

Copiem os dados fictícios de uma cola para reduzir digitação. Mantenham visível o resultado após salvar. Não mostrem senhas, tokens, .env, QR de autenticação ou dados de clientes reais. Preservem todos os registros de teste publicados. Anonimização e troca de credenciais ficam em base local separada.

## Roteiro de Guilherme e ordem de gravação

Sua ordem de gravação: 01, 02, 04, 06A e 07. Você apresenta o frontend e conduz a demonstração. O 06A contém telas de apoio sem narração final; João explica esse trecho no bloco técnico.

| Arquivo | Preparar e gravar | Destino na edição |
| --- | --- | --- |
| 01_gui_abertura.mp4 | Slides 1 e 2: identificação, problema, objetivo e público. | 00:00 a 03:00 |
| 02_gui_frontend.mp4 | Slide 3: frontend, componentes e comunicação com a API. | 03:00 a 04:00 |
| 04_gui_demonstracao.mp4 | Navegador: executar um fluxo relacionado ao mesmo caso fictício. | 06:00 a 12:00 |
| 06A_gui_telas_apoio.mp4 | 105 segundos de telas: LGPD, mestre, IA e notificações, em base preparada. | 14:30 a 16:15, com a voz de João. |
| 07_gui_resultados.mp4 | Slide 5: retomar o problema e os resultados demonstrados. | 17:00 a 17:40 |

### Como terminar sua demonstração

Ao encerrar o clipe 04, diga: "A seguir, o João vai mostrar como essas operações são tratadas na API e no banco". Deixe o último resultado legível por um instante. A edição corta para o editor do João, sem uma nova apresentação do projeto.

### Guia para a fala

As próximas páginas contêm falas-base. Ensaiem com cronômetro e expliquem com suas palavras. A meta de cada cena inclui cliques e tempo para enxergar o resultado; não leiam correndo para compensar atraso. O momento de falar sobre detalhes de implementação é o bloco do João.

## Clipe 01 Contexto e proposta

Guilherme | 00:00 a 03:00 no vídeo final | arquivo: 01_gui_abertura.mp4

### 00:00 a 00:35

Na tela: Slide 1 com a identificação completa.

Fala-base: Olá, somos Guilherme Rossato Munhoz e João Henrique Souza Sabino, do grupo TDS-2026-038. Nosso projeto é o LexNexo, um sistema web de gestão para escritórios de advocacia, desenvolvido no curso de Tecnologia em Desenvolvimento de Sistemas, com orientação do professor Sérgio Luiz Tonsig e coorientação do professor Francisco Antônio de Souza.

### 00:35 a 01:25

Na tela: Slide 2: problema, objetivo, público-alvo e fluxo das informações.

Fala-base: Imagine um escritório que acompanha clientes em uma planilha, prazos em uma agenda e documentos em pastas separadas. Para saber o que precisa fazer em um processo, a equipe acaba consultando vários lugares. Essa fragmentação dificulta o acompanhamento e aumenta a chance de esquecer uma informação importante. Foi essa rotina que motivou o projeto.

### 01:25 a 02:15

Na tela: Slide 2: problema, objetivo, público-alvo e fluxo das informações.

Fala-base: O objetivo do LexNexo é reunir essas informações em um mesmo ambiente. Um cliente pode ter processos; cada processo pode reunir movimentações, documentos, compromissos e controle financeiro. A proposta é facilitar a consulta e manter a relação entre as informações, com acesso definido pelo perfil de cada usuário.

### 02:15 a 03:00

Na tela: Slide 2: problema, objetivo, público-alvo e fluxo das informações.

Fala-base: O público-alvo são escritórios de advocacia e suas equipes. O sistema atende funções administrativas e de acompanhamento, sem substituir a análise jurídica do profissional. Nesta apresentação, vamos usar dados fictícios em uma base de demonstração local. Primeiro mostraremos a arquitetura, depois um fluxo de uso e, por fim, algumas decisões de implementação e os resultados dos testes.

### Transição para o próximo clipe

Diga: "Agora vamos apresentar a arquitetura e as tecnologias que sustentam esse fluxo". No corte, entre no slide 3. Não abram o sistema ainda: a demonstração começa no clipe 04.

## Clipe 02 Frontend na arquitetura

Guilherme | 03:00 a 04:00 no vídeo final | arquivo: 02_gui_frontend.mp4

### 03:00 a 04:00

Na tela: Slide 3: destacar a interface e sua comunicação com a API. Explicar a organização do frontend. Permanecer nos slides; o editor entra no clipe 05.

Fala-base: Esta visão mostra a comunicação entre a interface, a API e o banco. No frontend, usamos Next.js e React para organizar páginas, painéis e formulários em componentes. A camada de serviços concentra as chamadas à API, e a interface apresenta estados de carregamento, confirmação e validação. Também trabalhamos a navegação, a adaptação para celular e as preferências visuais. Escolhemos essa organização para reaproveitar os elementos da interface e manter o comportamento consistente. O João vai explicar agora como essas requisições são processadas e como os dados se relacionam.

### Passagem para João

Termine apontando a seta da interface para a API. João começa o clipe 03 com esse mesmo slide na tela e explica o processamento. A edição troca a voz sem repetir a capa.

## Clipe 04 Fluxo completo no LexNexo

Guilherme | 06:00 a 12:00 no vídeo final | arquivo: 04_gui_demonstracao.mp4

### 06:00 a 06:25

Na tela: Entrar no sistema e mostrar a dashboard. Digitar a senha fora do enquadramento ou usar a sessão preparada; não exibir credenciais.

Fala-base: Depois da autenticação, a equipe tem uma visão dos processos e compromissos. Vamos acompanhar o cadastro de um cliente fictício e a organização do seu caso.

### 06:25 a 07:15

Na tela: Clientes → Novo. Mostrar uma validação de campo obrigatório, preencher dados fictícios preparados e salvar. Buscar o nome e confirmar o registro.

Fala-base: Aqui cadastramos a pessoa física. O formulário indica os campos obrigatórios e informa quando falta algum dado. Depois de salvar, o cliente aparece na lista e pode ser localizado pela busca.

### 07:15 a 07:45

Na tela: No formulário de pessoa jurídica, demonstrar a consulta CNPJ já ensaiada. Mostrar os campos preenchidos e sua revisão. Retomar o cliente principal.

Fala-base: Para pessoa jurídica, a consulta cadastral pode preencher os dados a partir do CNPJ. A equipe confere o resultado antes de salvar. Se a consulta estiver indisponível, o formulário continua permitindo o preenchimento manual.

### 07:45 a 08:35

Na tela: Processos → Novo. Vincular ao cliente criado e a um responsável permitido; preencher os campos obrigatórios e salvar. Abrir a ficha.

Fala-base: Agora vinculamos um processo ao cliente e ao responsável. A ficha reúne os dados do caso e será o ponto de ligação para a agenda, os documentos e os honorários. O número deste caso é fictício e não representa uma ação judicial real.

### 08:35 a 09:00

Na tela: Abrir a consulta DataJud em um caso público separado, previamente verificado. Mostrar um resultado real ou a mensagem efetiva de indisponibilidade.

Fala-base: A consulta ao DataJud é um fluxo separado deste processo fictício. Quando o serviço retorna dados, o usuário pode conferir as movimentações antes de incorporá-las. Não tratamos uma resposta vazia como confirmação de andamento.

### 09:00 a 09:50

Na tela: Na ficha, registrar uma movimentação curta. Agenda → calcular prazo; usar feriado local preparado e salvar o prazo ligado ao processo. Mostrar uma audiência já cadastrada.

Fala-base: Registramos uma movimentação e criamos um prazo relacionado ao processo. O cálculo considera os dias úteis e o calendário informado, incluindo feriados locais quando cadastrados. A audiência e o prazo aparecem na agenda com data, horário e vínculo ao caso. A data calculada é um apoio: precisa de conferência do profissional.

### 09:50 a 10:25

Na tela: Modelos de documento → declaração fictícia → origem Processo → escolher o caso → Gerar documento. Mostrar as variáveis substituídas. Abrir o PDF fictício já anexado.

Fala-base: O modelo utiliza os dados do cadastro para preencher uma declaração. A equipe revisa o texto antes de imprimir ou salvar em PDF. O anexo fica vinculado ao processo e seu acesso passa pela autenticação.

### 10:25 a 11:10

Na tela: Contratos → criar contrato para o processo novo, total R$ 100,01, três parcelas. Expandir as parcelas. Abrir Cobrar com PIX no modo Teste; mostrar QR code/copia e cola e a parcela pendente.

Fala-base: O contrato registra os honorários e gera as parcelas. Podemos conferir que a soma corresponde ao total contratado. O sistema também gera a opção de cobrança por PIX. Nesta demonstração usamos o modo de teste: não há movimentação de dinheiro e a parcela não é quitada pela simulação.

### 11:10 a 11:40

Na tela: Alternar entre administrador e perfil restrito em sessões locais separadas. Procurar o mesmo processo sigiloso de demonstração e comparar o acesso.

Fala-base: O perfil define o que cada usuário pode visualizar e fazer. Além disso, processos em segredo de justiça recebem restrições adicionais. Aqui o administrador vê o registro; a outra identidade não tem a mesma autorização.

### 11:40 a 12:00

Na tela: Abrir a mesma tela em largura de celular, usar o menu e abrir a agenda ou ficha. Mostrar a ação, não só uma imagem parada.

Fala-base: A interface também se adapta a uma tela menor. O menu pode ser recolhido, e os campos e as informações principais continuam acessíveis. A seguir vamos mostrar como essas operações são tratadas no código.

### Conferências para esse clipe

Use um caso principal para manter cliente, processo, agenda, documento e contrato conectados. O número fictício não serve para provar consulta real ao DataJud; prepare outro processo público permitido para essa consulta. Faça um cadastro efetivo e mostre o registro salvo. Para PIX, use Teste e mantenha a parcela pendente. Mostre o efeito do perfil restrito numa segunda sessão local e uma ação real em tela de celular.

Se BrasilAPI ou DataJud não responderem, mostre a mensagem real e explique a contingência manual. Essa gravação registra indisponibilidade; não comprova integração externa bem-sucedida.

## Guilherme telas de apoio e resultados

Clipes 06A e 07 | o 06A será narrado por João

| Tempo final | O que você grava sem narração final | Duração |
| --- | --- | --- |
| 14:30 a 15:10 | Exportar dados de cliente fictício local; abrir o arquivo. Em outro cliente local, anonimizar e mostrar o resultado. | 40 s |
| 15:10 a 15:35 | Painel mestre local: destacar que administra a plataforma e não é a conta comum do escritório. | 25 s |
| 15:35 a 16:00 | Assistente: pergunta contextual e resposta real, se configurado; senão, mostrar a restrição ou indisponibilidade efetiva. | 25 s |
| 16:00 a 16:15 | Notificações: recebimento efetivo se disponível; caso contrário, mostrar configuração e reconhecer que entrega não foi comprovada. | 15 s |

Salve essas quatro cenas juntas em 06A_gui_telas_apoio.mp4, com 1:45 de conteúdo útil. Avise João onde cada cena começa. Na edição, silencie o áudio desse arquivo e use a narração dele. Os 45 segundos seguintes, de 16:15 a 17:00, são a tela de testes gravada pelo João.

### Clipe 07 | 17:00 a 17:40 | slide 5

### 17:00 a 17:40

Na tela: Slide 5: resultados da auditoria, com total por suíte, cobertura de linhas e verificações práticas.

Fala-base: Retomando o problema inicial, o LexNexo reúne informações que antes ficariam espalhadas em controles separados. Na demonstração, cadastramos um cliente, vinculamos um processo e acompanhamos agenda, documentos e honorários. A principal contribuição é manter a relação entre esses dados e permitir o acompanhamento conforme o perfil de acesso. Os testes documentam os cenários que conseguimos verificar.

Mantenha o slide 5 na gravação e relacione os resultados ao fluxo demonstrado. Use a data de referência das métricas e diga apenas os resultados efetivamente observados.

## Roteiro de João e ordem de gravação

Sua ordem de gravação: 03, 05, 06B e 08. Apresente backend, APIs e banco. Receba primeiro o arquivo 06A de Guilherme para narrar as telas no mesmo ritmo; deixe o 06B por último se essas capturas ainda não estiverem prontas.

| Arquivo | Preparar e gravar | Destino na edição |
| --- | --- | --- |
| 03_joao_arquitetura_banco.mp4 | Slides 3 e 4: API, PostgreSQL, módulos e relações. | 04:00 a 06:00 |
| 05_joao_codigo_banco.mp4 | Editor e DER: operação HTTP, validação, modelos, permissões e transação. | 12:00 a 14:30 |
| 06B_joao_narracao_testes.mp4 | Narração das telas 06A e, ao final, sua tela de código/testes por 45 segundos. | 14:30 a 17:00 |
| 08_joao_fechamento.mp4 | Slide 6 e capa: limites, dificuldades, aprendizados, evolução e agradecimento. | 17:40 a 19:45 |

### Trechos de código para deixar marcados

| Arquivo | Trecho a destacar |
| --- | --- |
| frontend/src/services/api.js | Uma requisição relacionada ao contrato, como entrada do fluxo. |
| backend/advocacia/views/financeiro.py | ContratoViewSet, perform_create, transação e _gerar_parcelas. |
| backend/advocacia/serializers.py | ContratoSerializer e validação dos relacionamentos/valores. |
| backend/advocacia/models.py | Processo, Contrato, Parcela e seus vínculos. |
| backend/advocacia/mixins.py, permissoes.py e sigilo.py | Escopo por escritório, perfil e restrição de processo sigiloso. |
| backend/advocacia/tests/test_financeiro.py | Teste de geração/centavos ou rollback. Resultado e CI já executados. |

## Clipe 03 Arquitetura, backend e modelo de dados

João | 04:00 a 06:00 no vídeo final | arquivo: 03_joao_arquitetura_banco.mp4

### 04:00 a 05:00

Na tela: Slide 3: C2 e implantação, percorrendo navegador, frontend, API e banco com o ponteiro.

Fala-base: A API utiliza Python, Django e Django REST Framework, e os dados são armazenados em PostgreSQL. O frontend envia requisições HTTP; a API valida a entrada, aplica permissões e acessa o banco pelo ORM. Django oferece uma estrutura para modelos, validações e autenticação, e PostgreSQL permite manter relacionamentos e transações. A implantação usa Vercel para o frontend, Render para a API e Supabase para banco e armazenamento quando configurado. No C2, essas unidades aparecem separadas. A versão e o ambiente desta gravação são os que identificamos na abertura.

### 05:00 a 06:00

Na tela: Slide 4: recorte dos relacionamentos de Cliente, Processo, Contrato, Parcela, Agenda e Documento. Explicar os módulos e o escopo por escritório.

Fala-base: Internamente, a API está organizada por domínios, como clientes, processos, agenda e financeiro. O banco mantém os vínculos entre essas entidades. Um processo pertence a um cliente e pode ter um contrato; esse contrato reúne as parcelas. Documentos e eventos da agenda também se relacionam ao processo. O esquema é compartilhado entre os escritórios, e a API aplica o escopo do escritório nas consultas e nos vínculos. Este slide mostra um recorte dos relacionamentos. Agora vamos acompanhar esse caminho pela interface.

### Transição para a demonstração

Termine com: "Com essa estrutura em mente, o Guilherme vai demonstrar o caminho de um cliente e seu processo pela interface". Deixe o slide 4 visível por um instante e corte diretamente para o navegador do clipe 04.

## Clipe 05 Como a operação é processada

João | 12:00 a 14:30 no vídeo final | arquivo: 05_joao_codigo_banco.mp4

### 12:00 a 12:45

Na tela: Editor: estrutura backend/advocacia/views, services/api.js e o trecho do ContratoSerializer. Usar a operação de contrato como exemplo. Mostrar a requisição sem cabeçalhos secretos, se já houver captura segura.

Fala-base: O frontend utiliza uma camada de serviços para enviar a requisição à API. No backend, a rota chega ao viewset do domínio. O serializer verifica os campos e os relacionamentos; depois a operação é persistida pelos modelos do Django. A resposta volta para a interface, que mostra o resultado ou uma mensagem de validação. No contrato, por exemplo, a validação impede que a quantidade de parcelas produza valores menores que um centavo.

### 12:45 a 13:30

Na tela: DER ampliado e backend/advocacia/models.py. Apontar as relações de Processo, Contrato e Parcela, sem abrir dados reais no banco.

Fala-base: No banco relacional, o processo se vincula ao cliente e ao escritório. Documentos e eventos da agenda se relacionam ao processo; o contrato se relaciona ao processo e reúne suas parcelas. As chaves estrangeiras mantêm esses vínculos e o ORM representa as relações no código. Os escritórios compartilham o esquema: a separação é aplicada pelos vínculos de escritório e pelo escopo das consultas na API. Para os valores financeiros, usamos campos decimais.

### 13:30 a 14:00

Na tela: mixins.py: EscritorioScopedMixin.get_queryset e _filtrar_por_escritorio. Depois permissoes.py/sigilo.py e um pequeno recorte de LoginView/segunda etapa.

Fala-base: A autenticação utiliza tokens, e as permissões são verificadas na API. O escritório do usuário filtra as consultas e os vínculos recebidos também são conferidos. Processos sigilosos têm uma restrição adicional. Esconder um botão na interface não substitui essas verificações no backend.

### 14:00 a 14:30

Na tela: financeiro.py: @transaction.atomic, perform_create e _gerar_parcelas. Deixar o teste de rollback ao lado.

Fala-base: Contrato e parcelas são criados em uma transação. Se ocorrer falha durante a geração, a operação não deve deixar um contrato incompleto. O cálculo usa valores decimais, e a última parcela recebe o ajuste de centavos. Há um teste que simula a falha na segunda parcela e verifica o rollback.

### Como apresentar sem perder tempo no editor

Abra os arquivos já nas funções relevantes, com zoom. Siga uma operação concreta em vez de percorrer pastas sem explicar. Mostre o vínculo no DER ao falar dos modelos; retorne ao trecho de permissão e ao financeiro. Não leia caminhos completos em voz alta nem abra o banco real para procurar dados. A montagem deve manter a sua voz contínua durante essas trocas.

## Clipe 06 Recursos administrativos, integrações e testes

João narra; Guilherme grava telas de apoio | 14:30 a 17:00 no vídeo final | arquivo: 06_bloco_tecnico_montado.mp4

### 14:30 a 15:10

Na tela: Clientes: exportar dados do cliente fictício local e abrir o arquivo. Em outro cliente local separado, mostrar a confirmação de anonimização e o resultado. Apontar exportar_dados/anonimizar no código.

Fala-base: A exportação reúne os dados do titular. A anonimização é uma ação diferente e remove dados pessoais conforme o fluxo implementado. Estamos usando outro cadastro fictício na base local, para preservar os registros principais da demonstração.

### 15:10 a 15:35

Na tela: Sessão local do painel mestre: visão de escritórios e administração da plataforma, sem alterar plano ou permissões reais.

Fala-base: O painel mestre é separado do painel de um escritório. Ele atende à administração da plataforma, enquanto a equipe do escritório trabalha apenas no contexto e nas permissões correspondentes.

### 15:35 a 16:00

Na tela: Se pronto no ensaio: Assistente IA, pergunta curta sobre o processo fictício e resposta contextual. Mostrar provedor OpenAI no quadro técnico, sem chave.

Fala-base: O assistente utiliza a API da OpenAI com contexto controlado da aplicação. O texto gerado é um apoio e exige revisão humana antes de ser usado ou enviado.

### 16:00 a 16:15

Na tela: Se preparado: mostrar a notificação push recebida no dispositivo de teste e a mensagem na caixa de e-mail de teste. Sem recibos reais, mostrar o sino interno e declarar o limite.

Fala-base: O sino interno reúne os alertas da aplicação. Push e e-mail são canais externos: só consideramos entrega comprovada quando a mensagem chega ao destino de teste.

### 16:15 a 17:00

Na tela: Tabela datada de métricas, resultado salvo dos testes e um teste de rollback ou isolamento. Mostrar o workflow e a divisão de pastas do repositório.

Fala-base: Na execução final de 9 de novembro, passaram 885 testes: 550 Django, 290 Jest e 45 Playwright. O CI tem registro próprio e não se soma à execução local. A cobertura de linhas é 91,85% no backend e 38,03% no frontend, abaixo da meta de 70%. Também conferimos fluxos publicados e mantivemos os dados fictícios. Isso aumenta a confiança nos cenários testados, mas não significa ausência de falhas.

### Montagem desse bloco

Use a voz de 06B durante os 2:30. Nos primeiros 1:45, cubra sua tela com o vídeo 06A do Guilherme. Aos 16:15 do vídeo final, retire essa sobreposição e mostre sua tela de testes. Resultado salvo e CI são evidência de execução anterior datada; não simule que a suíte inteira rodou durante esses 45 segundos.

IA, e-mail e push dependem de configuração e disponibilidade. Sem resposta ou recebimento reais, ajuste a fala para reconhecer o limite. Não use gravação simulada como comprovação externa.

## Clipe 08 Limitações, aprendizados e encerramento

João | 17:40 a 19:45 no vídeo final | arquivo: 08_joao_fechamento.mp4

### 17:40 a 18:30

Na tela: Slide 6: pronto, limitações e backlog. Identificar RF52 e cobertura frontend abaixo da meta.

Fala-base: Também há limites. A notificação automática ao cliente a cada atualização do processo permanece no backlog. O PIX demonstrado é estático ou simulado; não há confirmação bancária automática. A cobertura de frontend precisa crescer, e ainda precisamos de avaliação de usabilidade com profissionais. Integrações externas só são apresentadas como validadas quando conseguimos demonstrar uma resposta ou recebimento real.

### 18:30 a 19:15

Na tela: Continuar no slide 6 e comentar as dificuldades de isolamento por escritório e consistência das parcelas.

Fala-base: Entre as principais dificuldades estiveram a separação de dados entre escritórios, as diferenças de permissão e a consistência das operações financeiras. Trabalhamos com desenvolvimento incremental, testes e revisões para corrigir problemas encontrados. O projeto nos ajudou a relacionar interface, API, banco e documentação, e a perceber que uma funcionalidade precisa ser verificada além do caminho em que tudo dá certo.

### 19:15 a 19:45

Na tela: Slide 1, usado como tela final: LexNexo, grupo 038, nomes e agradecimento.

Fala-base: Como próximos passos, pretendemos ampliar os testes da interface, validar a operação dos serviços externos e realizar sessões com profissionais de advocacia. O LexNexo responde ao problema de organização ao reunir a rotina do escritório em um ambiente integrado. Agradecemos aos orientadores e à banca e ficamos à disposição para perguntas.

### Encerrar dentro do limite

Use o slide 6 ao explicar pendências, dificuldades e próximos passos. Na última cena, de 19:15 a 19:45, volte ao slide 1 e agradeça em nome dos dois. Os 15 segundos até 20:00 são margem; não acrescentem conteúdo para preencher esse espaço. A fala sobre dificuldades e aprendizados deve refletir a experiência real de vocês.

## Ordem de montagem e conferência final

Na linha do tempo do editor, a sequência é 01 > 02 > 03 > 04 > 05 > 06 > 07 > 08. Os clipes 06A e 06B formam um único bloco 06. Exportem um único vídeo final; os arquivos separados são material de gravação.

| Faixa de vídeo | Faixa de áudio |
| --- | --- |
| 01 e 02: slides de Guilherme | Voz de Guilherme |
| 03: slides de João | Voz de João |
| 04: sistema operado por Guilherme | Voz de Guilherme |
| 05: editor e DER de João | Voz de João |
| 06, primeiros 1:45: telas 06A de Guilherme | Somente voz de João, arquivo 06B |
| 06, últimos 45 s: testes de João | Continuação da voz de João |
| 07: slide de resultados | Voz de Guilherme |
| 08: limitações e capa final | Voz de João |

### Assistir ao arquivo exportado antes de enviar

Confiram a duração total de no máximo 20 minutos, volume semelhante entre as vozes, ausência de áudio duplicado no bloco 06 e legibilidade do código. Verifiquem se a criação foi seguida de confirmação, se o fluxo usa o mesmo caso fictício e se as limitações foram ditas sem contradizer a demonstração. Os dois devem participar e os cinco blocos do professor devem estar presentes.

### Referência e uso

Este plano organiza o roteiro detalhado do grupo revisto em 09/11/2026. As ações, falas e limites vêm de docs/tcc/ROTEIRO_VIDEO_PREBANCA_2026.md e da orientação do professor fornecida em PDF. A divisão por integrante foi definida pelo proprietário. Use a apresentação editável entregue com estes roteiros. A execução dos recursos deve ser conferida no ensaio.

Este plano conserva a sequência temporal do roteiro existente, com uma mudança operacional: a explicação inicial do frontend fica no slide 3, e o editor entra no bloco de implementação. Os detalhes por cena podem ser adaptados no ensaio mantendo os cinco blocos, a veracidade da demonstração e o teto de 20 minutos.
