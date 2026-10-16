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
docker compose -f compose.yaml -f compose.ci.yaml run --rm smoke
docker compose down
```

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
  executa esse teste a cada push e pull request da branch principal.

Após registrar as evidências, execute `docker compose down` e **pare o
Codespace** na página do GitHub ou com `gh codespace stop -c NOME`, evitando
consumo de horas de execução.
