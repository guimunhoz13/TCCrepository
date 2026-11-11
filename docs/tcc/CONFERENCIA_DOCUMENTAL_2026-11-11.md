# Conferência documental do grupo TDS-2026-038

Conferência local em 11/11/2026, comparando o parecer de 03/11/2026 fornecido pelo
proprietário com os arquivos entregáveis. As correções documentais obrigatórias
do parecer estão atendidas na revisão 1.13. A gravação e o envio do vídeo não
foram verificados nesta conferência. A nota de 81/100 pertence ao revisor e não
foi recalculada.

Não houve nova execução das suítes nem alteração no sistema. A data dos testes
continua sendo 09/11/2026. Conferir a documentação não comprova que sua versão
atual já foi anexada ao Órbita; o texto recebido mostra uma entrega de 03/11.

## Arquivos para entrega

- [PDF conjunto de relatório e manual](TDS-2026-038_Entrega_Documental_v1.13.pdf):
  132 páginas, com marcadores para os dois documentos.
- [Relatório técnico v1.13 PDF](TDS-2026-038_Relatorio_Tecnico_v1.13.pdf): 66 páginas.
- [Relatório técnico v1.13 Word](TDS-2026-038_Relatorio_Tecnico_v1.13.docx): editável.
- [Manual ilustrado](../Guia-de-Funcionalidades-LexNexo.pdf): 66 páginas, com
  capturas originais datadas e adendo da auditoria de 09/11.

O PDF conjunto mantém a ordem e o texto de todas as páginas dos dois PDFs
originais. O Word corresponde ao relatório técnico, sem incorporar o manual.
Não usar as versões antigas com grupo 39 ou RT v1 na nova submissão.

## Conferência dos itens do parecer

As páginas abaixo são as do relatório individual, salvo indicação do manual.

| Item do parecer | Evidência conferida | Situação documental |
|---|---|---|
| Identificação | Capa com TDS-2026-038, integrantes e orientadores | Atendida |
| C1 separado | Seção 7.1, Figura 42, página 53 | Atendida |
| C2 separado | Seção 7.2, Figura 43, página 54 | Atendida |
| C3 e implantação separados | Figura 44 na página 54; Figura 45 na página 62 | Atendida |
| Contagens iguais no relatório e guia | Tabela datada na página 59 do RT e página física 62 do manual | Atendida |
| Provedor de IA nomeado | OpenAI; configuração por OPENAI_MODEL e limites de validação, página 62 | Atendida |
| Sequência de autenticação e TOTP | Figuras 3 e 4, página 27 | Atendida |
| Sequência de prazo | Figura 5, página 28 | Atendida |
| Segregação e armazenamento | Esquema compartilhado, escritorio_id, API/perfis, RLS de fotos e armazenamento S3, página 62 | Atendida |
| Contingências de integrações | Preenchimento e lançamentos manuais; indisponibilidade de IA e mensagens, páginas 62–63 | Atendida |
| RF52 | Continua adiado no backlog; não apresentado como entregue | Atendida |
| Cobertura e melhoria | 91,85% backend / 38,03% frontend; meta frontend de 70% explicitamente pendente | Atendida como registro de limitação |
| Usabilidade com profissionais | Ausência de estudo declarada; plano mantido nos trabalhos futuros | Atendida como registro de limitação |
| Identidade e apresentação | LexNexo; títulos e subtítulos do RT em preto; 64 entradas do sumário conferidas | Atendida |
| Vídeo e demonstrações externas | Roteiros e slides prontos; gravação, montagem e entrega não comprovadas | Pendente de evidência dos integrantes |

## Ajustes desta conferência

1. Corrigida uma frase da seção 7.9 que ainda descrevia 38 cenários de navegador.
   Agora são 44 cenários de navegador e um HTTP/proxy, total 45 Playwright. O
   valor vem da mesma fonte JSON da tabela; não foi criada uma execução nova.
2. Corrigida a nota do diagrama de implantação que ainda dizia que o bucket
   ativo não havia sido comprovado. O modo S3 foi confirmado em 09/11; ACL
   completa e recuperação em nuvem continuam sem comprovação operacional.
3. Atualizados capa, metadados, referência do manual e links da entrega para a
   revisão 1.13. As versões anteriores foram preservadas como histórico.
4. Reunidos relatório e manual num único PDF para a submissão documental.

## Métricas e limites que permanecem

Referência única: 550 Django + 290 Jest + 45 Playwright = **885 casos**, executados
em 09/11/2026. As rodadas locais, CI e repetições de navegador não são somadas.
Os números históricos de 843 e 712 mencionados no parecer não são os resultados
atuais. A cobertura de 38,03% mede linhas percorridas pela suíte Jest, e não a
porcentagem de funcionalidades prontas.

Continuam com limites próprios: entrega real de e-mail/push, IA paga em operação,
agendador em produção, recuperação integral em nuvem, Safari real e estudo com
profissionais. Geração/simulação PIX não comprova recebimento bancário. Nenhuma
dessas pendências foi convertida em aprovação apenas por revisar o texto.

O vídeo deve seguir o roteiro de até 20 minutos, com fala até 19:45: Guilherme
apresenta frontend e demonstração; João apresenta backend, banco e testes.
Integrações devem ser demonstradas realmente ou identificadas como indisponíveis.
O roteiro não substitui a gravação. Bloqueio por tentativas, recuperação de senha
e anonimização devem usar a base local preparada, preservando a conta publicada.

O [registro de verificação](../testes/evidencias/2026-11-11/verificacao-documental.json)
contém hashes, páginas e conferências de conteúdo. O sumário do RT teve 64/64
entradas localizadas. Foram renderizados e revistos o RT e o manual; nenhum teste
do produto foi contabilizado nesta revisão documental.
