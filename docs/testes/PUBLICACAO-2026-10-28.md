# Publicação do LexNexo — 28/10/2026

O commit [`89b675f`](https://github.com/guimunhoz13/TCCrepository/commit/89b675facd02cf8a03d1c249795b20448d3ae230),
**Corrige falhas da auditoria e estabiliza a navegação de compromissos**, foi
publicado na `main`, com autoria `guimunhoz13` e o e-mail configurado pelo
proprietário. A autorização para publicar foi dada nesta conversa. O histórico
anterior foi preservado; nenhuma atualização forçada foi enviada. Novos commits
devem ser escritos em português, conforme `AGENTS.md`.

## Versão verificada

| Componente | Evidência | Resultado |
|---|---|---|
| GitHub | Commit 89b675f na main | Publicado |
| CI | [Execução 40785092492](https://github.com/guimunhoz13/TCCrepository/actions/runs/40785092492) | Quatro jobs aprovados |
| Testes no CI | 532 Django + 275 Jest + 36 Playwright | 843 aprovados; Compose é um job adicional |
| Vercel | dpl_4pM6MmTQqJfbw4g5LLXAjA5TfJ4H | READY; domínio principal conferido |
| Render | dep-dbh8223bc2fs73frc6i0 | live; mesmo commit 89b675f |
| Saúde | /api/health/ pela Vercel e diretamente no Render | HTTP 200, status ok, serviço LexNexo |
| Logs da API após deploy | app/error de 23:12:23 a 23:19:00 UTC | Nenhum registro retornado; consulta limitada a essa janela |

Site: [lexnexo.vercel.app](https://lexnexo.vercel.app).
API: [saúde do serviço](https://lexoffice-api-piloto.onrender.com/api/health/).
O nome técnico legado do serviço Render foi mantido para preservar sua URL e
configuração. A conta, o workspace, o repositório, a branch e o diretório backend
foram cruzados antes da publicação. Não foram criados outros serviços.

## Correção operacional durante a publicação

O build novo estava pronto na Vercel, mas `lexnexo.vercel.app` ainda apontava
para o deploy anterior. A inspeção dos aliases e a comparação dos scripts das
duas páginas confirmaram a divergência. O domínio era um alias manual e não
constava entre os domínios do projeto `lexnexo`.

O alias foi atualizado e `lexnexo.vercel.app` foi registrado como domínio
verificado do mesmo projeto, sem branch específica. A consulta administrativa
confirmou o vínculo, e o domínio principal passou a servir os mesmos scripts
do deploy novo. Isso foi registrado como A14.

O Render estava com autoDeploy habilitado, mas não registrou novo deploy ou
evento automático após o push e a conclusão do CI. Foi iniciada uma única
publicação manual, acompanhada até `live`. A ausência do acionamento automático
foi observada; sua causa na integração Git não foi determinada nem reconfigurada.

## Conferência prática após publicar

Na sessão administrativa já autenticada, foram conferidos pela interface:

1. Abrir Compromissos com densidade compacta e menu expandido.
2. Voltar à Dashboard e avançar novamente pelo histórico do navegador.
3. Abrir a Agenda a partir de Compromissos e fechar o painel.
4. Alternar para densidade confortável e recolher o menu.
5. Abrir Compromissos e retornar à Dashboard com essa aparência.
6. Restaurar a escolha original: densidade compacta e menu expandido.

Os oito estados registrados no JSON permaneceram coerentes com a aparência
escolhida. O smoke publicado observa os estados da interface; os dois testes
E2E de regressão, locais e no CI, observam também as mutações transitórias.
Não foram criados nem excluídos registros de negócio nesta rodada. Os registros
AUDITORIA TCC e os demais cadastros existentes foram preservados.

## Documentação e limites

O relatório técnico Word v1.8 conserva os resultados históricos da auditoria
de 27/10/2026, com a revisão visual de 28/10. Esta publicação e o acréscimo de
dois casos E2E estão registrados neste complemento, sem reatribuir a cobertura
antiga ao código atual. O pacote de documentação contém este relato e o JSON
sanitizado, além das versões preservadas do relatório técnico.

A confirmação de publicação e saúde não encerra cobertura insuficiente de
linhas do frontend, estudo de usabilidade, backup/restauração, ACL completa de
storage, entrega SMTP/push, integrações pagas ou navegadores Firefox/WebKit.
Nenhum teste ativo de exploração foi executado em produção. O parecer acadêmico
continua **APTO COM RESSALVAS**, nos limites dos casos executados.

Evidência: [publicacao-2026-10-28.json](evidencias/publicacao-2026-10-28.json).
