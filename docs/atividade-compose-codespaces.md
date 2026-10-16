# Atividade: Docker Compose no GitHub Codespaces

Esta entrega usa o **contexto de build preservado da atividade anterior**:
`docker/lexoffice-labex-context.tar.gz` é uma cópia de
`entrega-docker-labex/labex-build`, com o Dockerfile, a configuração do Nginx e
o site compilado em setembro. O script extrai esses arquivos para
`.compose-build/` e o Compose reconstrói a tag `lexoffice-frontend:lab`.
O arquivo binário da imagem Docker original não foi exportado do LabEx;
portanto, este é um novo build dos mesmos arquivos, não o mesmo ID de imagem.
Nenhuma senha, `.env` ou banco de dados entra na imagem.

## Comandos executados no Codespaces

Na raiz do repositório:

```bash
bash scripts/preparar-compose.sh
sha256sum .compose-build/Dockerfile
docker compose config --quiet && docker compose build
docker image ls --format '{{.Repository}}:{{.Tag}} {{.Size}}' lexoffice-frontend:lab
docker compose up -d
docker inspect -f '{{.State.Health.Status}}' tccrepository-frontend-1
curl -fsS -o /dev/null -w 'GET /: %{http_code}\n' http://127.0.0.1:8088/
curl -fsS -o /dev/null -w 'GET /login: %{http_code}\n' http://127.0.0.1:8088/login
docker run --rm --network host --entrypoint /bin/sh lexoffice-frontend:lab -ec \
  'wget -q -O /dev/null http://127.0.0.1:8088/ && \
   wget -q -O /dev/null http://127.0.0.1:8088/login && echo Teste-HTTP-200'
docker compose down
```

O contêiner ficou `healthy`; a página inicial e `/login` responderam HTTP 200
tanto com `curl` no Codespace quanto pelo contêiner auxiliar acima. No Codespace
usado para a atividade, a comunicação direta entre contêineres na rede bridge
ficou indisponível (a conexão para `frontend:80` expirou). Por isso, a checagem
no Codespace usou a porta publicada e a rede do host. O Compose específico de
CI, que verifica as mesmas rotas pela rede interna, **passou** no
[GitHub Actions](https://github.com/guimunhoz13/TCCrepository/actions/runs/38944849225/job/117121262838).

O novo build no Codespace apareceu com **76,9 MB** em `docker image ls`; o
registro da atividade anterior no LabEx mostrava **49 MB**. O contexto é o
mesmo, mas a base `docker/getting-started:latest` não fixa uma versão por
digest e a imagem binária antiga não foi salva. Logo, não afirmo que o ID ou
o tamanho final sejam iguais aos do LabEx.

### Prints reais do terminal do Codespace

- [Construção da imagem](evidencias/compose-codespaces-build.jpg)
- [Contêiner saudável e respostas HTTP 200](evidencias/compose-codespaces-execucao.jpg)
- [Teste HTTP por outro contêiner](evidencias/compose-codespaces-teste-http.jpg)
- [Encerramento dos serviços](evidencias/compose-codespaces-encerramento.jpg)
- [Codespace parado no GitHub](evidencias/compose-codespace-parado.jpg)

## Escolhas do Compose

- **Imagem:** `lexoffice-frontend:lab` é reconstruída com o Dockerfile e o site
  estático **já compilado** na atividade anterior. Não precisa de `npm ci` nem
  de um novo build do Next.js; o contexto preservado torna a atividade
  reproduzível no Codespaces sem publicar a imagem em um registro.
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
