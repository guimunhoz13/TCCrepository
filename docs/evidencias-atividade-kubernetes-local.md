# Evidências da atividade Kubernetes local

Execução validada em 23/10/2026, no perfil Minikube isolado
`lexnexo-lab-local`. Nenhum Codespace ou outro serviço pago foi iniciado.

## Cluster

```text
lexnexo-lab-local
NAME                STATUS   ROLES           VERSION
lexnexo-lab-local   Ready    control-plane   v1.37.0
Kubernetes control plane is running at https://127.0.0.1:32771
```

## Deployment e Service

```text
namespace/lexnexo-lab created
deployment.apps/lexnexo-frontend created
service/lexnexo-frontend-service created
deployment "lexnexo-frontend" successfully rolled out

deployment.apps/lexnexo-frontend   2/2   2   2
pod/lexnexo-frontend-...            1/1   Running
pod/lexnexo-frontend-...            1/1   Running
service/lexnexo-frontend-service   NodePort   80:30080/TCP
```

## Acesso HTTP

```text
LexNexo GET /: HTTP 200
LexNexo GET /login: HTTP 200
<title>LexNexo — ERP Jurídico
```

## Escala

```text
deployment.apps/lexnexo-frontend scaled
deployment "lexnexo-frontend" successfully rolled out
4 Pods: 1/1 Running
```

## Rolling update

```text
deployment.apps/lexnexo-frontend image updated
deployment "lexnexo-frontend" successfully rolled out
REVISION  CHANGE-CAUSE
1         <none>
2         <none>

LexNexo Kubernetes v2
Durante v2, GET /: HTTP 200
```

## Rollback

```text
deployment.apps/lexnexo-frontend rolled back
deployment "lexnexo-frontend" successfully rolled out
imagem ativa apos rollback: lexnexo-frontend:v1
Apos rollback, GET /: HTTP 200
Apos rollback, GET /k8s-version.txt: HTTP 404 (esperado na v1)
```

## Limpeza

```text
service "lexnexo-frontend-service" deleted from lexnexo-lab namespace
namespace "lexnexo-lab" deleted
deployment.apps "lexnexo-frontend" deleted from lexnexo-lab namespace
1 node stopped.
```

Os resultados acima são um registro textual. Para a entrega no AVA, refaça os
comandos agrupados na seção **Prints recomendados para o AVA** do roteiro e
capture o terminal com o comando e a saída visíveis.
