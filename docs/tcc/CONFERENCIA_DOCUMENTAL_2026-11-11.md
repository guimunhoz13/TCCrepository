# Conferência documental do grupo TDS-2026-038

Revisão 1.14 de 11/11/2026 do relatório Word enviado pelo proprietário, comparada
com o parecer de 03/11/2026. Foram corrigidos os pontos documentais e a lacuna
de cobertura do frontend. O relatório é entregue **sem o guia anexado**.
A nota de 81/100 e o parecer do revisor não foram recalculados.

Nesta atualização houve execução real das suítes: **951 casos locais aprovados**,
550 Django + 356 Jest + 45 Playwright. O frontend atingiu **72,22% de linhas**,
frente à meta de 70%, sem reduzir o escopo da medição. Os testes práticos de
produção preservam a data de 09/11 e seus registros; não houve exclusões.

## Arquivos para entrega

- [Relatório técnico v1.14 PDF](TDS-2026-038_Relatorio_Tecnico_v1.14.pdf): 67 páginas.
- [Relatório técnico v1.14 Word](TDS-2026-038_Relatorio_Tecnico_v1.14.docx): editável.

O manual ilustrado foi sincronizado com a mesma fonte de métricas e permanece
como arquivo independente. O PDF conjunto v1.13 é histórico e não constitui
a entrega atual solicitada. O original recebido foi preservado. Não usar os
arquivos antigos com grupo 39 nem a revisão RT v1 na nova submissão.

## Conferência dos itens do parecer

Páginas do relatório técnico individual renderizado.

| Item do parecer | Evidência conferida | Situação |
|---|---|---|
| Identificação | Capa: TDS-2026-038, nomes completos dos integrantes e orientadores | Atendida |
| C1 separado | Seção 7.1, Figura 42, página 53 | Atendida |
| C2 separado | Seção 7.2, Figura 43, página 54 | Atendida |
| C3 e implantação separados | Figura 44, página 54; Figura 45, página 63 | Atendida |
| Contagens consistentes | Tabela datada na página 59 e fonte única compartilhada com o manual independente | Atendida |
| Provedor IA | OpenAI, OPENAI_MODEL e limites operacionais, página 63 | Atendida |
| Autenticação e TOTP | Figuras 3 e 4, página 27 | Atendida |
| Cálculo e cadastro de prazo | Figura 5, página 28 | Atendida |
| Segregação e armazenamento | Esquema compartilhado, escritorio_id, API/perfis, RLS de fotos e S3, página 63 | Atendida |
| Contingências externas | Preenchimento e lançamentos manuais, falhas de IA/mensagens, páginas 63–64 | Atendida |
| RF52 | Adiado no backlog, sem declaração de implementação | Mantida |
| RF40 | Justificativa da restrição de processos sob segredo de justiça acrescentada à conclusão | Atendida |
| Cobertura frontend | 3339/4623 linhas, 72,22%; 66 novos casos Jest e mínimo de 70% ativo, páginas 60–61 | Meta atingida |
| Evidência dos testes | 550 Django + 356 Jest + 45 Playwright; execução integrada de 11/11 e catálogo com 951 casos | Atendida |
| Defeitos da interface | A31–A33 reproduzidos e corrigidos; feedback de status/reembolso e foco no assistente, página 61 | Corrigidos e retestados |
| Usabilidade com profissionais | Ausência de estudo declarada e plano mantido nos trabalhos futuros | Limitação explícita |
| Identidade e apresentação | LexNexo, títulos pretos, 64 entradas do sumário recalculadas | Atendida |
| Vídeo | Roteiros e slides existentes; gravação e submissão a cargo dos integrantes | Pendente de evidência |

## Mudanças e verificações

O relatório atualiza resumo, resultados, limitações, conclusão, capa e referências,
sem transformar dados históricos em execuções novas. A cobertura de 38,03% de
09/11 aparece somente como comparação datada. O escopo permanece todo src JS/JSX;
a cobertura Playwright não é adicionada à Jest. Funções (58,17%) e ramos (61,55%)
continuam com oportunidades de melhoria, embora a meta de linhas esteja atingida.

A configuração Jest coleta cobertura por padrão e exige pelo menos 70% de linhas,
com o mesmo comando já usado no CI. O teste desse comando aprovou 356 casos. O CI remoto 43113561017 aprovou os quatro jobs e os mesmos 951 casos; a Vercel publicou o frontend 11a128a.
Não foi necessário alterar o workflow remoto; mudanças locais de outro trabalho
foram preservadas. Os novos commits são escritos em português, sem reescrever
o histórico publicado.

A verificação de conteúdo conferiu os seis diagramas por SHA-256 no Word,
métricas dos runners, identificação do grupo, nomes, ausência de LexOffice e
cores dos estilos de títulos. A renderização conferiu sumário, imagens, tabelas,
paginação e continuidade do texto. O [registro reproduzível](../testes/evidencias/2026-11-11/verificacao-relatorio-v1.14.json)
contém hashes e páginas. A [validação do sistema](../testes/RELATORIO_VALIDACAO.md)
apresenta os testes e seus limites de forma separada da conferência documental.

## Evidências que cabem aos integrantes

O vídeo deve demonstrar interação real, indicar o ambiente e respeitar o plano
3/3/6/5/3 minutos, com Guilherme em frontend/demonstração e João em backend/banco.
Gravação, montagem e envio ao Órbita não foram comprovados por esta atualização.
As correções documentais não certificam integrações externas: recebimento de
SMTP/push, IA paga em operação, agendador, ACL/RLS integral, recuperação em nuvem,
Safari real e avaliação com profissionais conservam as ressalvas registradas.
Geração de QR code PIX não comprova recebimento bancário. Bloqueio por tentativas,
recuperação e anonimização devem usar a base de demonstração adequada, preservando
os dados publicados conforme solicitado pelo proprietário.
