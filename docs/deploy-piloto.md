# Piloto LexNexo para teste externo

Este roteiro publica o site na Vercel, a API Django no Render e usa um
**projeto Supabase separado** para o banco e os arquivos. Use apenas dados
fictícios. A conta de teste é diferente da conta pessoal de desenvolvimento.

## 1. Supabase: banco e arquivos do piloto

1. Crie um projeto Supabase separado, preferencialmente na região de São Paulo.
2. Em **Connect → Session pooler**, copie host, usuário, senha, banco e porta.
   A porta costuma ser 5432; confirme no painel. O Render usará
   `DB_SSLMODE=require`.
3. Em **Storage**, crie um bucket **privado** para arquivos do LexNexo.
4. Na configuração S3 do Storage, habilite o protocolo S3 e gere um par de
   **Access Key ID / Secret Access Key**. Copie também o endpoint e a região
   exibidos ali. Estas chaves dão acesso amplo ao Storage: guarde-as somente
   no backend, nunca no frontend ou no Git.

Não reaproveite o projeto Supabase compartilhado do desenvolvimento: a
advogada deve poder alterar e apagar os dados de demonstração sem atingir os
dados de trabalho da dupla.

## 2. Render: API Django

1. Publique no GitHub a versão deste repositório que contém `render.yaml`.
2. No Render, crie uma **Blueprint** a partir do repositório. O serviço usa
   `backend/` como raiz, instala as dependências, prepara os arquivos estáticos,
   executa as migrações e inicia Gunicorn. O health check é `/api/health/`.
3. Preencha os campos solicitados pelo Blueprint:

   | Variável | Origem |
   | --- | --- |
   | `DB_HOST`, `DB_USER`, `DB_PASSWORD` | Connect → Session pooler do projeto piloto |
   | `MEDIA_S3_BUCKET` | Nome exato do bucket privado |
   | `MEDIA_S3_ENDPOINT_URL`, `MEDIA_S3_REGION_NAME` | Configuração S3 do Supabase |
   | `MEDIA_S3_ACCESS_KEY_ID`, `MEDIA_S3_SECRET_ACCESS_KEY` | Par S3 gerado no Supabase |
   | `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS` | URL HTTPS exata do site na Vercel |

   Se a URL da Vercel ainda não existir, use uma URL provisória e **atualize
   as duas variáveis antes do teste externo**. Nunca use `*` para CORS.

4. Confirme que `https://SEU-SERVICO.onrender.com/api/health/` responde
   `{"status":"ok"}`. Anote a URL real do serviço; o Render pode acrescentar
   um sufixo ao nome escolhido.

O Blueprint usa o plano gratuito para o piloto. Nesse plano, o Render pode
demorar para responder à primeira visita após ficar inativo. O Supabase Free
também pode pausar projetos por inatividade. Para uma demonstração marcada,
abra o sistema e confira o health check antes de enviar o link.

## 3. Vercel: site Next.js

1. Importe este repositório como projeto na Vercel.
2. Defina **Root Directory** como `frontend`; mantenha o framework **Next.js**.
3. Antes do deploy, defina a variável de ambiente de produção:

   ```text
   NEXT_PUBLIC_API_URL=https://SEU-SERVICO.onrender.com/api
   ```

   Use a URL real da etapa anterior, **com `/api` no final**. Essa variável é
   incorporada ao JavaScript durante o build; se for alterada, faça novo deploy.
4. Copie a URL HTTPS final da Vercel para `FRONTEND_URL` e
   `CORS_ALLOWED_ORIGINS` no Render. Cada uma recebe a origem completa, sem
   barra final, por exemplo `https://lexnexo.vercel.app`.

## 4. Conta e dados de teste

O comando `popular_demo` cria um escritório fictício com clientes, processos,
agenda e perfis diferentes. **Não use a senha padrão em um site público.**
No modo de produção, o comando exige `DEMO_PASSWORD`.

Para preparar o banco piloto a partir da sua máquina, crie
`backend/.env.piloto` (ignorado pelo Git) com os dados `DB_*` do **novo**
Supabase, `DB_SSLMODE=require`, `DEBUG=False`, uma `SECRET_KEY` temporária
forte e `DEMO_PASSWORD` aleatória. Execute:

```bash
cd backend
LEXNEXO_ENV_FILE="$PWD/.env.piloto" ambiente/bin/python manage.py migrate --noinput
LEXNEXO_ENV_FILE="$PWD/.env.piloto" ambiente/bin/python manage.py popular_demo
```

Durante a migração de marca, `LEXOFFICE_ENV_FILE` ainda é aceito como nome
legado. Novas configurações devem usar `LEXNEXO_ENV_FILE`.

O login de demonstração é `admin@demo.lexnexo.app`, com a senha que você
definiu. Envie **essa** credencial à avaliadora, por um canal privado, e
troque-a ou desative a conta quando terminar. Não compartilhe sua conta
pessoal. O comando não apaga dados existentes sem `--recriar`.

## 5. E-mail e funções opcionais

O escritório de demonstração pode entrar sem SMTP porque é criado por comando.
Para testar **cadastro de outro escritório, confirmação de e-mail, recuperação
de senha e notificações por e-mail**, configure no Render `EMAIL_HOST`,
`EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` e
`DEFAULT_FROM_EMAIL` com um provedor SMTP. Sem essas credenciais, o backend
imprime e-mails nos logs e a confirmação não chega ao usuário.

O assistente de IA requer `OPENAI_API_KEY`; a consulta ao DataJud requer
`DATAJUD_API_KEY`. Lembretes, sincronização do DataJud e busca de intimações
dependem de tarefas agendadas separadas. Não apresente essas funções como
automáticas no piloto até configurar e verificar as respectivas tarefas.

## 6. Conferência antes de compartilhar

Em um celular real, abra a URL da Vercel e verifique:

- login da conta demo e abertura da gaveta de navegação;
- clientes, processos, agenda, documentos, contratos e tarefas;
- criação/edição de um registro fictício e persistência após recarregar;
- upload e download de um arquivo fictício após novo deploy da API;
- recuperação do acesso por e-mail, **se** SMTP fizer parte do teste.

O teste automatizado no Playwright cobre uma largura de 375 px e o perfil
Pixel 7. Isso não substitui a verificação no aparelho e navegador da advogada.

## 7. Fotos e demonstração de Pix

Fotos de usuários e clientes são reduzidas a até 512 × 512 px, convertidas
para WebP e guardadas no PostgreSQL pela migração `0037_fotopersistente`.
Continuam privadas, servidas pela API autenticada e isoladas por escritório.
A tabela tem RLS habilitada e não concede acesso aos papéis `anon` e
`authenticated` do Supabase. Não depende do disco temporário do Render.
Documentos conservam o armazenamento anterior: configure o bucket privado
da etapa 1 para persistirem entre deploys.

Em Configurações → Conta, escolher uma imagem mostra apenas a prévia.
Clique em **Salvar foto**. Fotos antigas ainda são lidas do armazenamento
anterior quando disponíveis; arquivos já perdidos no disco temporário
precisam ser reenviados. Nenhuma migração recupera arquivos desaparecidos.

Para testar honorários, abra Contratos → Ver parcelas → Cobrar com PIX.
A janela começa em **Teste — sem movimentar dinheiro**. Use **Simular
pagamento aprovado**. Para assinaturas, abra Planos → **Testar Pix do
Básico/Profissional** → **Simular assinatura aprovada**.

Esses QR codes contêm `LEXNEXO-TESTE-SEM-VALOR`, não um BR Code bancário,
nem uma chave Pix. Não são pagáveis em bancos. A API valida a simulação,
mas não dá baixa na parcela, não altera plano/validade/limites e não
movimenta dinheiro. O resultado visual desaparece ao fechar a janela.
Não é integração com sandbox de um provedor de pagamentos.

O modo **Pix real** dos honorários permanece separado e exige seleção
explícita; pode movimentar dinheiro se confirmado no banco. O sistema
ainda não possui contratação real de planos por Pix nem webhook bancário.

Fontes: [Vercel monorepos](https://vercel.com/docs/monorepos),
[Render Blueprints](https://render.com/docs/infrastructure-as-code),
[Render Free](https://render.com/docs/free),
[Supabase Storage S3](https://supabase.com/docs/guides/storage/s3/authentication),
[pausa do Supabase Free](https://supabase.com/docs/guides/platform/free-project-pausing).
