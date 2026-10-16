# Atividade: Docker Compose no GitHub Codespaces

Esta entrega reutiliza a **imagem estática do frontend LexOffice da atividade
anterior**. O serviço `frontend` é construído com `frontend/Dockerfile.labex`,
agora por meio do Compose, e recebe a mesma tag `lexoffice-frontend:lab`. O
script apenas recompila os arquivos estáticos e prepara o contexto de build;
nenhuma senha, `.env` ou banco de dados entra na imagem.

## Comandos executados no Codespaces

Na raiz do repositório:

```bash
bash scripts/preparar-compose.sh
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
curl -fsS -o /dev/null -w 'Inicial: HTTP %{http_code}\n' http://127.0.0.1:8088/
curl -fsS -o /dev/null -w 'Login: HTTP %{http_code}\n' http://127.0.0.1:8088/login
docker run --rm --network host --entrypoint /bin/sh lexoffice-frontend:lab -ec \
  "wget -T 5 -q -O /dev/null http://127.0.0.1:8088/ && echo 'GET / -> HTTP 200' && \
   wget -T 5 -q -O /dev/null http://127.0.0.1:8088/login && echo 'GET /login -> HTTP 200'"
docker compose down
```

O contêiner ficou `healthy`; a página inicial e `/login` responderam HTTP 200
tanto com `curl` no Codespace quanto pelo contêiner auxiliar acima. No Codespace
usado para a atividade, a comunicação direta entre contêineres na rede bridge
ficou indisponível (a conexão para `frontend:80` expirou). Por isso, a checagem
no Codespace usou a porta publicada e a rede do host. O Compose específico de
CI, que verifica as mesmas rotas pela rede interna, **passou** no
[GitHub Actions](https://github.com/guimunhoz13/TCCrepository/actions/runs/38943813421/job/117117783357).

### Prints reais do terminal do Codespace

- [Construção da imagem](evidencias/compose-codespaces-build.jpg)
- [Contêiner saudável e respostas HTTP 200](evidencias/compose-codespaces-execucao.jpg)
- [Teste HTTP por outro contêiner](evidencias/compose-codespaces-teste-http.jpg)
- [Encerramento dos serviços](evidencias/compose-codespaces-encerramento.jpg)

## Escolhas do Compose

- **Imagem:** `lexoffice-frontend:lab` usa o mesmo Dockerfile estático da
  atividade anterior. O build local permite reproduzi-la no Codespaces sem
  publicar a imagem em um registro.
- **Rede:** `lexoffice` é uma rede bridge privada; o teste `smoke` alcança o
  serviço pelo nome `frontend`.
- **Porta:** `8088:80` torna as páginas acessíveis no ambiente de laboratório.
- **Reinício e saúde:** `unless-stopped` reinicia o serviço em caso de falha;
  o healthcheck verifica a página inicial. O teste de CI só começa quando o
  serviço fica saudável.
- **Volumes:** não são necessários porque esta imagem contém apenas arquivos
  estáticos imutáveis. A configuração do Nginx e as páginas são copiadas para
  a imagem; nenhum dado do usuário é persistido nesse contêiner.
- **Outros serviços:** a imagem da atividade anterior demonstra somente as
  páginas estáticas. Login funcional, processos e documentos dependem da API
  Django, PostgreSQL e armazenamento de arquivos do projeto publicado; esses
  serviços não fazem parte desta imagem nem deste exercício isolado.
- **CI:** `compose.ci.yaml` adiciona um contêiner de teste que verifica `/` e
  `/login` pela rede interna. O job `compose-smoke` em `.github/workflows/ci.yml`
  executa esse teste a cada push e pull request da branch principal. Ele passou
  na execução citada acima, junto com os demais jobs do projeto.

Para reproduzir o teste na infraestrutura do CI, após preparar os arquivos
estáticos, execute:

```bash
docker compose -f compose.yaml -f compose.ci.yaml up --build --abort-on-container-exit --exit-code-from smoke
docker compose -f compose.yaml -f compose.ci.yaml down --remove-orphans
```

Após registrar as evidências, execute `docker compose down` e **pare o
Codespace** na página do GitHub ou com `gh codespace stop -c NOME`, evitando
consumo de horas de execução.
