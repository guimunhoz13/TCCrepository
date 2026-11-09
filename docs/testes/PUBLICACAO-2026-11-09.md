# Publicação e preservação — 09/11/2026

Grupo TDS-2026-038. Aplicação: commit [98ff6bf](https://github.com/guimunhoz13/TCCrepository/commit/98ff6bfc57aa5c819207ddb63edfd7540b687b5b).
[CI 42616807545](https://github.com/guimunhoz13/TCCrepository/actions/runs/42616807545): quatro jobs APROVADO,
550 Django + 290 Jest + 44 Playwright = 884. A execução posterior do teste PWA
está separada na fonte única; não somar rodadas.

Vercel: deployment GitHub 7654619994, success; [alias público](https://lexnexo.vercel.app).
Render: workspace tea-db81kilg1s2s738mfhf0, serviço srv-db90meks728c73bbtvlg,
deploy dep-dbornn9srm7s73ctj3k0, live em 12:27:44 UTC, mesma versão de aplicação.
O push não iniciou deploy do Render na janela observada, embora autoDeploy estivesse
habilitado; o painel foi usado uma vez. A causa não foi determinada.

Antes de publicar, MEDIA_STORAGE=s3 foi confirmado no painel. Nenhuma credencial
foi revelada ou alterada. Nenhuma migration nova, troca de banco, plano ou serviço.
Cinco anexos privados conservaram tamanho/bytes/SHA-256 e os IDs anteriores de
13 famílias permaneceram presentes. [Evidência de publicação](evidencias/2026-11-09/publicacao.json).

Práticos: 37 aprovações/38 casos, 15 registros principais novos mantidos.
Retestes publicados recusaram prazo fracionário, modelo cliente/processo incompatível
e edição financeira divergente, preservando os dados. PIX no modo Teste sem baixa.
A aba PDF foi criada, mas a política de URL blob da ferramenta bloqueou inspeção
visual; a conferência binária autenticada tem evidência independente.

O commit 1600b28 amplia somente o conjunto/configuração de testes. Não altera o
comportamento da aplicação em execução. O [CI complementar 42620912216](https://github.com/guimunhoz13/TCCrepository/actions/runs/42620912216) aprovou os quatro jobs e 885 casos; evidência em
[ci-complementar.json](evidencias/2026-11-09/ci-complementar.json). Commits novos estão em português; nenhum
histórico antigo foi reescrito. A alteração local preexistente em ci.yml e os
arquivos de outros trabalhos foram preservados fora dos commits desta auditoria.
