# Publicação e conferência da nova auditoria

Data: 03 e 04/11/2026, America/Sao_Paulo. O proprietário autorizou publicar
em sua conta GitHub, Vercel e Render e determinou commits novos em português,
preservando o histórico antigo. A autorização para testes e avisos automáticos
continua válida; não houve mensagens manuais a terceiros.

| Código | Mudança | Conferência |
|---|---|---|
| b58034d846b688b7c11b83ab97de8b402c98e683 | Contrato atômico e divisão de centavos | 3 regressões financeiras antes/depois; CI 41736583373 aprovado com 846 casos |
| 7219e1321831052b4eea90e4bded203202626a7a | Plano no assistente, busca sem aviso de descarte e gerador datado | CI 41739893748 aprovado com 853; reteste da interface publicada aprovado |
| 3a54547d2ddf4863462045c927493b7e2f146af3 | Rota específica de foto no proxy, sem acrescentar barra ao nome | 854 casos locais; foto publicada retestada em 04/11 |

## Frontend publicado

Vercel `dpl_GeQ2CnKhY488WmdaKAfwcndREY5C`, Ready, originado do terceiro commit;
GitHub deployment 7559712087. O alias https://lexnexo.vercel.app aponta ao
endereço https://lexnexo-lpedm6zi8-zeldation.vercel.app. A conferência usa o
alias canônico, não apenas a URL temporária.

Antes, a foto sintética do cliente #8 retornava 200 diretamente na API e 404
pela Vercel. A variante direta com barra final também retornava 404. O primeiro
rewrite genérico podia acrescentar essa barra no roteamento publicado. A regra
específica de fotos agora antecede as regras genéricas e conserva o nome.
O novo E2E local passou, mas já passava antes do ajuste: não é usado como
reprodução local do defeito exclusivo do provedor.

Após publicar, o mesmo arquivo retornou 200 nas duas origens, conteúdo idêntico
(572 bytes); o acesso anônimo retornou 401. Não se afrouxaram autenticação,
escopo ou permissões. O PDF fictício #4 voltou a responder 200 e é idêntico
aos 1783 bytes do original. Evidência: [reteste-publicado.json](evidencias/2026-11-04/reteste-publicado.json).
O bloqueio de nova aba PDF no navegador integrado é outro cenário e permanece.

## Backend ainda na publicação anterior

Workspace confirmado anteriormente: `tea-db81kilg1s2s738mfhf0`, serviço
`srv-db90meks728c73bbtvlg`, nome técnico legado `lexoffice-api-piloto`.
A consulta de 04/11 ainda apresentou `dep-dbh8223bc2fs73frc6i0` live,
commit `89b675facd02cf8a03d1c249795b20448d3ae230`, de 28/10. A configuração
indica autoDeploy yes/commit, main e o repositório correto, mas não apareceu
novo deploy para as alterações desta rodada. A causa não foi determinada.

**BLOQUEADO:** não atribuir a correção financeira b58034d à API publicada.
Nenhuma variável remota ou serviço novo foi criado. A nova publicação da API
não foi forçada sem comprovar o storage persistente e recuperação dos anexos:
o código admite filesystem, enquanto a preservação de tudo que foi criado é
uma exigência expressa do proprietário. Fotos novas estão no PostgreSQL;
a segurança dos documentos em uma substituição de instância depende do
armazenamento efetivamente configurado, que não foi comprovado nesta inspeção.

Para encerrar: confirmar MEDIA_STORAGE e o bucket privado/disco persistente
sem registrar segredos; conferir backup e restauração em cópia; verificar que
não há deploy em fila; publicar a revisão testada uma única vez e acompanhar
até live; conferir health, login, foto e PDF sintéticos preservados e criar um
contrato novo de centavos no ambiente controlado. Nenhuma migration nova foi
introduzida. Não executar rollback de dados ou apagar registros para testar.

## Evidências e limites

[publicacao.json](evidencias/2026-11-04/publicacao.json) contém identificadores
sanitizados; as contagens de CI têm suas próprias datas. Commits e pushes foram
realizados por autorização prévia, sem force-push ou reescrita. Alterações
locais alheias, especialmente `.github/workflows/ci.yml`, foram mantidas fora
dos commits de correção. Build/health não comprovam backup, ACL/RLS completa,
agendamento ou recebimento por SMTP/push. Não houve migração administrativa,
reset, seed, pagamento real ou carga contra a conta publicada.

O CI do commit 3a54547 concluiu com sucesso em 04/11: execução
[41926536601](https://github.com/guimunhoz13/TCCrepository/actions/runs/41926536601),
535 Django, 282 Jest e 37 Playwright (854), além dos jobs de lint/build e
Docker. Logs de cada runner conferidos; resumo sanitizado em
[evidencias/2026-11-04/ci.json](evidencias/2026-11-04/ci.json).
