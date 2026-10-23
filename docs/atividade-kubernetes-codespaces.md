# Atividade: Kubernetes com o LexNexo no GitHub Codespaces

Esta atividade implanta somente uma cópia estática do frontend do LexNexo em
um cluster Minikube temporário. Ela não usa o backend Django, o PostgreSQL do
Supabase, arquivos `.env`, chaves de API ou dados reais. Os recursos ficam no
namespace `lexnexo-lab` e podem ser apagados integralmente ao final.

## 1. Criar o Codespace sem alterar a branch principal

No GitHub, abra **Code → Codespaces**, selecione a branch
`codex/kubernetes-lab` e crie o Codespace. No terminal, confirme a branch:

```bash
git branch --show-current
git status --short
```

O primeiro comando deve mostrar `codex/kubernetes-lab`. Não prossiga se ele
mostrar `main`.

## 2. Conferir ou instalar `kubectl` e Minikube

Primeiro confira se as ferramentas já existem:

```bash
kubectl version --client
minikube version
```

Se alguma delas não existir, instale-a no Codespace:

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install -o root -g root -m 0755 minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64
```

## 3. Iniciar e conferir o cluster temporário

```bash
minikube start --driver=docker --memory=2048 --cpus=2
kubectl config current-context
kubectl get nodes -o wide
kubectl cluster-info
```

O contexto mostrado por `kubectl config current-context` deve ser `minikube`.
Não prossiga se aparecer outro contexto.

## 4. Construir e carregar a imagem do LexNexo

O script apenas extrai o contexto estático preservado em
`docker/lexnexo-labex-context.tar.gz` para a pasta ignorada
`.compose-build/`. Nenhum código-fonte ou dado do TCC é alterado.

```bash
bash scripts/preparar-compose.sh
docker build -t lexnexo-frontend:v1 .compose-build
minikube image load lexnexo-frontend:v1
minikube image ls | grep lexnexo-frontend
```

## 5. Criar o Deployment e o Service

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl -n lexnexo-lab rollout status deployment/lexnexo-frontend
kubectl -n lexnexo-lab get deployment,pods,service -o wide
kubectl -n lexnexo-lab describe deployment lexnexo-frontend
```

O resultado esperado é um Deployment com `2/2` réplicas disponíveis, dois Pods
com estado `Running` e o Service com NodePort `30080`.

## 6. Acessar no Codespaces

Mantenha este comando em execução em um terminal:

```bash
kubectl -n lexnexo-lab port-forward service/lexnexo-frontend-service 8080:80
```

Na aba **Ports** do Codespaces, abra a porta `8080`. Em outro terminal, registre
uma verificação objetiva:

```bash
curl -fsS -o /dev/null -w 'LexNexo GET /: HTTP %{http_code}\n' http://127.0.0.1:8080/
curl -fsS -o /dev/null -w 'LexNexo GET /login: HTTP %{http_code}\n' http://127.0.0.1:8080/login
```

As duas respostas devem ser `HTTP 200`. As funções que exigem a API não fazem
parte deste laboratório; o objetivo é comprovar a implantação do frontend.

## 7. Escalar para quatro réplicas

```bash
kubectl -n lexnexo-lab scale deployment lexnexo-frontend --replicas=4
kubectl -n lexnexo-lab rollout status deployment/lexnexo-frontend
kubectl -n lexnexo-lab get deployment,pods -o wide
```

O resultado esperado é `4/4` réplicas disponíveis e quatro Pods `Running`.

## 8. Executar um Rolling Update

A versão 2 acrescenta apenas um arquivo de identificação ao contexto temporário
em `.compose-build/`. Os arquivos originais do LexNexo continuam intactos.

```bash
printf 'LexNexo Kubernetes v2\n' > .compose-build/k8s-version.txt
cp .compose-build/Dockerfile .compose-build/Dockerfile.v2
printf '\nCOPY k8s-version.txt /usr/share/nginx/html/k8s-version.txt\n' >> .compose-build/Dockerfile.v2
docker build -f .compose-build/Dockerfile.v2 -t lexnexo-frontend:v2 .compose-build
minikube image load lexnexo-frontend:v2

kubectl -n lexnexo-lab set image deployment/lexnexo-frontend frontend=lexnexo-frontend:v2
kubectl -n lexnexo-lab rollout status deployment/lexnexo-frontend
kubectl -n lexnexo-lab rollout history deployment/lexnexo-frontend
kubectl -n lexnexo-lab get pods -o wide
```

Com o `port-forward` ainda ativo, confirme a versão:

```bash
curl -fsS http://127.0.0.1:8080/k8s-version.txt
```

O resultado esperado é `LexNexo Kubernetes v2`.

## 9. Executar o rollback

```bash
kubectl -n lexnexo-lab rollout undo deployment/lexnexo-frontend
kubectl -n lexnexo-lab rollout status deployment/lexnexo-frontend
kubectl -n lexnexo-lab rollout history deployment/lexnexo-frontend
kubectl -n lexnexo-lab get deployment,pods -o wide
```

Após o rollback, o Deployment volta a utilizar `lexnexo-frontend:v1`.

## 10. Limpar todo o ambiente

Interrompa o `port-forward` com `Ctrl+C` e execute:

```bash
kubectl delete -f k8s/service.yaml
kubectl delete -f k8s/deployment.yaml
kubectl get namespace lexnexo-lab
minikube stop
minikube delete
```

É esperado que a consulta ao namespace retorne `NotFound`. A exclusão do
Minikube remove os containers e volumes temporários do laboratório.

## Prints recomendados para o AVA

1. `kubectl config current-context`, `kubectl get nodes` e `kubectl cluster-info`.
2. Aplicação dos YAMLs e dois Pods em estado `Running`.
3. Deployment descrito e Service com NodePort `30080`.
4. `port-forward` ativo e respostas HTTP 200 no segundo terminal.
5. Escala concluída com quatro Pods em estado `Running`.
6. Rolling update concluído, histórico e identificação da versão 2.
7. Rollback concluído e retorno para a imagem `v1`.
8. Exclusão dos recursos e do cluster Minikube.

Em cada print, deixe visíveis o comando executado e o resultado. Não exponha
tokens, senhas, variáveis de ambiente ou credenciais do Supabase.
