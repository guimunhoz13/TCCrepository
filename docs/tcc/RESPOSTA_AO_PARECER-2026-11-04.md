# Resposta técnica ao parecer de revisão

## Conferência documental de 11/11/2026

A entrega vigente é o relatório **v1.13**, acompanhado do manual e do
[PDF conjunto de submissão](TDS-2026-038_Entrega_Documental_v1.13.pdf).
A [conferência atual](CONFERENCIA_DOCUMENTAL_2026-11-11.md) verifica os itens do
parecer de 03/11 nos arquivos efetivamente renderizados. A descrição da suíte
Playwright foi corrigida de 38 para 44 cenários de navegador mais um HTTP/proxy.
A tabela já estava correta: 550 Django + 290 Jest + 45 Playwright = 885 em 09/11.
Não houve nova execução de testes nesta revisão documental.

As seções de 04, 05 e 09/11 abaixo são históricas. A indicação antiga de vídeo
com 10 a 15 minutos foi substituída pelo plano do professor de até 20 minutos,
com blocos 3/3/6/5/3 e fala até 19:45. O roteiro e os slides estão prontos;
gravação, montagem e submissão não foram comprovadas nesta conferência local.
Não se afirma que os arquivos atuais já estejam enviados ao Órbita.

<!-- auditoria-2026-11-09:inicio -->

## Complemento final de 09/11/2026

Grupo confirmado **TDS-2026-038**. A entrega vigente é o relatório v1.12 e o manual
revisto em 09/11. C1, C2, C3, implantação e sequências permanecem separados;
OpenAI é nomeada; segregação por escritório e contingências são explicitadas.
As métricas únicas registram 885 casos na referência final e cobertura de linhas
91,85%/38,03%. Sete achados adicionais da auditoria foram corrigidos e a aplicação
foi publicada, preservando dados e anexos. [Validação](../testes/RELATORIO_VALIDACAO.md).

O vídeo obrigatório **ainda será gravado pelos integrantes**. O roteiro foi
atualizado sem alterar 3/3/6/5/3 minutos: Guilherme frontend/demonstração; João
backend, APIs e banco. Não se declara que só a gravação resta para qualidade
integral do produto: cobertura frontend, alertas de ferramentas, integrações e
verificações operacionais conservam suas ressalvas. A pontuação acadêmica é da banca.

As seções datadas anteriores são histórico e não substituem esta referência.

<!-- auditoria-2026-11-09:fim -->

Consolidação em 04/11/2026. O parecer recebido informa análise em 03/11 e
arquivo `TDS-2026-038_RT_v1.pdf`. Não foi disponibilizado esse PDF nesta
mensagem; a comparação abaixo usa o texto fornecido pelo proprietário e os
fontes locais. O proprietário confirmou em **05/11/2026** o código oficial **TDS-2026-038**,
aplicado à nova revisão 1.11 e ao manual. Os nomes antigos com 39 são
registros históricos e não devem ser usados na entrega final.
A pontuação 81/100 pertence ao revisor; não foi recalculada ou alterada.
O item A4, registrado como 7/5, requer esclarecimento de quem emitiu o parecer.

## Tratamento dos achados

| Itens do parecer | Tratamento e evidência | Estado |
|---|---|---|
| 1 Vídeo | Ausência reconhecida. O roteiro abaixo prepara uma gravação com ambiente e limitações explícitos. Prints e suites não são apresentados como vídeo. | BLOQUEADO |
| 2 C1 e 3 C2 | Já presentes nos fontes v1.9, seções 7.1 e 7.2; incluídos separadamente na nova renderização. Fontes `diagramas/c4_contexto.puml` e `c4_containers.puml`. | APROVADO |
| 4 e 16 Contagens | Fonte única `../testes/evidencias/metricas-atuais.json`, tabela datada na seção 7.9 e no guia. O texto antigo de 478/223/11 deixa de ser o resultado corrente. Rodadas históricas mantêm suas datas. | APROVADO |
| 5 RF52 | Continua adiado; não há n8n implementado. | NÃO APLICÁVEL |
| 6 Stack | Versões conferidas nos arquivos e na execução: Next 16.4.2, React 19.2.4, Django 6.0.8; execução não equivale à configuração integral dos provedores. | APROVADO |
| 7 DataJud/DJEN em vídeo | Serviços têm testes com respostas simuladas e fallback; não se gravou consulta externa real. Demonstração real exige dados públicos e acesso apropriado, sem expor clientes. | BLOQUEADO |
| 8 Agendador | Comandos Django implementados; configuração e disparos recorrentes do agendador publicado não comprovados. | BLOQUEADO |
| 9 Push e e-mail | Testes locais usam mocks/caixa em memória; autorização de avisos não comprova entrega. Falta registro de recebimento controlado. | BLOQUEADO |
| 10 PIX | QR/código e simulação exercitados. Não houve pagamento bancário; modo teste não quita parcela. Não se apresenta como sandbox do banco. | APROVADO |
| 11 IA | Seção 7.10 nomeia OpenAI, SDK no backend, OPENAI_MODEL e padrão do código, sem atribuir esse padrão ao deploy. Plano Gratuito foi retestado sem formulário de IA. Chamada paga/recebimento em vídeo não realizados. | BLOQUEADO |
| 12 LGPD | API e testes isolados cobrem exportação e anonimização; não se anonimiza a massa publicada que o proprietário mandou manter. Demonstração destrutiva deve usar conta local separada. | APROVADO |
| 13 Cobertura | Tabela atual mostra medida real, denominador e meta frontend não atingida; plano de melhoria segue nos riscos. | APROVADO |
| 14 Sigilo | Restrição por escritório, perfil e responsável documentada e testada localmente com identidades distintas. Não se usa a conta publicada para tentativas invasivas. | APROVADO |
| 15 Sequências | Autenticação já possuía diagrama; acrescentados TOTP e cálculo/cadastro de prazo, com fontes e imagens próprias. | APROVADO |
| Separar implantação/C3 | Seção 7.10 e `diagramas/implantacao.puml` representam os nós físicos; C3 mantém módulos lógicos do backend. | APROVADO |
| Banco e contingência | Seção 7.10 esclarece esquema compartilhado/escritorio_id, escopo da RLS de fotos, storage configurável e fallbacks manuais para indisponibilidade. | APROVADO |
| Usabilidade | Nenhum profissional participou de estudo nesta auditoria. Roteiro SUS permanece proposta, sem resultados inventados. | BLOQUEADO |

APROVADO nesta matriz significa que o tratamento documental ou cenário
indicado foi verificado. Não é aprovação acadêmica do revisor, nem demonstração
integral de um recurso cuja entrega externa continua bloqueada.

## Roteiro para o vídeo da entrega

Grave a tela com voz dos integrantes e indicação visível do ambiente. Reserve
aproximadamente 10 a 15 minutos, priorizando um fluxo contínuo. Use uma base
local exclusiva com dados fictícios para exportar ou anonimizar. Não mostre
senhas, tokens, QR TOTP, código de recuperação ou chaves PIX pessoais.

1. Identificar autores, projeto, versões e ambiente. Apresentar C1/C2 brevemente.
2. Cadastrar cliente físico e pessoa jurídica; demonstrar BrasilAPI se houver
   conectividade, ou identificar claramente a resposta simulada/fallback.
3. Criar processo com cliente e responsável. Abrir a ficha, registrar
   movimentação, cadastrar audiência e calcular prazo com feriado sintético
   de abrangência específica. Explicar que a data exige conferência jurídica.
4. Gerar documento por modelo e conferir a substituição de variáveis.
   Anexar um PDF fictício e abrir/baixar em navegador com popups permitidos.
5. Criar contrato parcelado e conferir a soma. Mostrar PIX de teste e a
   parcela ainda pendente. Se demonstrar baixa contábil, declarar que é
   lançamento manual local, sem afirmar recebimento bancário.
6. Entrar com dois perfis locais e mostrar processo sigiloso visível apenas
   para quem tem autorização. Não modificar permissões de pessoas reais.
7. Exportar cliente local fictício; anonimizar outro cliente descartável
   apenas no ambiente exclusivo, explicando a irreversibilidade.
8. Mostrar ajuda, busca, tarefas, plano e painel mestre com identidades
   locais separadas. Demonstrar TOTP sem revelar segredo ou recuperação.
9. Se houver acesso controlado e autorização para custos, registrar resposta
   contextual da IA, consulta pública CNJ e recebimento de e-mail/push.
   Na ausência desses requisitos, declarar a pendência no vídeo e no relatório.
10. Mostrar CI, tabela datada de testes, cobertura e limitações. Encerrar com
    as pendências reais, sem alegar certificação ou ausência de falhas.

Para demonstrar bloqueio por tentativas ou recuperação de senha, use outra
conta local. Não bloquear a conta do proprietário nem alterar sua senha.
O roteiro não constitui evidência de uma gravação que ainda não foi produzida.

## Complemento final de 05/11/2026

O grupo oficial é **TDS-2026-038**. A revisão 1.11 aplica essa identificação
na capa e no nome do relatório, e o manual recebe a mesma identificação.
Abertura de documentos/relatórios e Content-Type PDF foram corrigidos e testados
localmente. A execução final e os navegadores têm evidência datada própria.
As correções documentais obrigatórias do parecer foram concluídas. O vídeo
continua sob responsabilidade dos integrantes. Publicação da API depende da
sessão do Render e da preservação dos anexos; não foi declarada concluída.
As demais limitações de serviços externos, cobertura e estudo com profissionais
são mantidas como limites de validação, sem inventar sucesso ou alterar a nota.

## Roteiro adaptado ao documento do professor — 06/11/2026

Foi preparado o [roteiro de gravação](ROTEIRO_VIDEO_PREBANCA_2026.md), também
em [PDF](TDS-2026-038_Roteiro_Video_PreBanca_2026.pdf), seguindo os blocos
3/3/6/5/3 minutos e a divisão definida pelos integrantes: Guilherme no frontend
e na demonstração; João no backend, APIs e banco. O material indica os pontos
do parecer, as evidências a capturar e as integrações ainda condicionais.
A gravação e o envio do vídeo continuam pendentes com os integrantes.
