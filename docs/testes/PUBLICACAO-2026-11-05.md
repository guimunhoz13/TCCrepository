# Publicação e preservação dos documentos — 05/11/2026

Grupo oficial confirmado pelo proprietário: **TDS-2026-038**.
A autorização prévia para commits, push e publicação continua válida; novos
commits permanecem em português, sem reescrita do histórico.

## Código validado

Commits `7191b09` — Corrige abertura de arquivos e preserva o tipo de documentos PDF;
`32a0974` — Mantém a extensão dos documentos baixados com popups bloqueados.
A rodada local aprovou 536 Django, 288 Jest e 39 Playwright: **863 casos**.
A repetição dos 36 casos de computador no Firefox também passou; não se soma
essa repetição ao total de cenários. Lint, build, schema, check e migrations
foram aprovados. Há seis regressões de abertura e uma de MIME, com falha
registrada antes do ajuste e aprovação depois.

## Situação da publicação

**BLOQUEADO na reconexão e conferência do armazenamento.** O conector do Render
consegue consultar o serviço, mas não oferece leitura de variáveis de ambiente
ou arquivos do serviço. A sessão do navegador expirou e o login pelo GitHub
foi aberto para o proprietário. Não foram solicitadas novas permissões ou
credenciais persistentes. A reconexão é requisito de acesso, não uma nova
aprovação de publicação.

Em 05/11, o serviço `srv-db90meks728c73bbtvlg`, no workspace confirmado
`tea-db81kilg1s2s738mfhf0`, continuava com deploy live
`dep-dbh8223bc2fs73frc6i0`, commit `89b675facd02cf8a03d1c249795b20448d3ae230`.
Nenhum novo deploy foi disparado nesta revisão. O push também aguarda essa
conferência, pois a configuração do serviço informa autoDeploy yes/commit,
e um push pode iniciar a substituição da instância.

O Render possui filesystem efêmero por padrão. A configuração efetiva de
`MEDIA_STORAGE` e do bucket privado precisa ser verificada antes de publicar,
para atender à exigência de manter os anexos. Fotos novas já usam PostgreSQL;
não é correto deduzir a persistência dos documentos a partir das fotos.
Não há migration nova em relação ao código live de 28/10. Nenhuma migration,
reset, seed ou exclusão foi executada no banco publicado.

## Retomada preparada

1. Restabelecer o login existente no painel do Render.
2. Conferir o armazenamento dos documentos, sem registrar valores secretos.
   Se houver filesystem efêmero, preservar os arquivos antes de trocar a instância.
3. Conferir integridade e leitura autenticada do PDF e da foto sintéticos já existentes.
4. Publicar a revisão validada no GitHub e acompanhar Vercel e Render. Verificar
   se o push disparou publicação antes de qualquer acionamento manual.
5. Após live, repetir health, login, abertura/download de documento, relatório,
   preservação dos registros e contrato novo de centavos, sem alterar parcelas antigas.
6. Atualizar este registro e os documentos com os identificadores efetivamente publicados.

Referência oficial consultada: [discos persistentes do Render](https://render.com/docs/disks).
A documentação atual de [deploys](https://render.com/docs/deploys) também informa
que uma URL pública de repositório sem provedor Git conectado exige acionamento
manual; essa hipótese ainda não foi comprovada para o serviço e não foi usada
para presumir a causa da ausência de deploy automático.

## Entrega acadêmica

RT v1.11 e manual identificam o grupo 038; C1/C2/C3, implantação, sequências,
provedor OpenAI e métricas comuns estão revisados. O vídeo deve ser gravado
pelos integrantes. A entrega não declara todas as integrações externas,
recuperação integral ou usabilidade profissional como validadas.
