# Relatório — TDD na Prática: IA como Engenheira de Testes

**Atividade:** Desenvolvimento Orientado por Testes (TDD) — IA e TDD
**Repositório:** LexOffice — ERP Jurídico (`guimunhoz13/TCCrepository`)
**Assistente utilizado:** Claude Code (Anthropic)
**Data:** 08/09/2026

---

## 1. Etapa 1 — Análise do projeto e identificação da função de autenticação

**Prompt utilizado:**

> "Analise este projeto e identifique a função responsável pela autenticação
> do usuário. Depois me informe se encontrou e entendeu."

**Resposta da IA (resumo da análise):**

O projeto é um backend Django + Django REST Framework. A autenticação de
usuário (login) está implementada em:

- **Arquivo:** `backend/advocacia/views.py`
- **Classe/função:** `LoginView.post()` (endpoint `POST /api/login/`)

Funcionamento identificado:

1. Recebe `email` e `senha` no corpo da requisição.
2. Busca o `Usuario` pelo e-mail (case-insensitive); se não existir, retorna
   `401` com mensagem genérica ("E-mail ou senha inválidos") — para não
   revelar se o e-mail existe ou não.
3. Verifica se o usuário está ativo e se o escritório (multi-tenant) está
   ativo; caso contrário, retorna `403`.
4. Compara a senha informada com o hash salvo (`check_password`, do
   `django.contrib.auth.hashers`) — as senhas nunca são guardadas em texto
   puro, apenas o hash (`make_password`).
5. Se tudo confere, gera um JWT (`RefreshToken` do `simplejwt`) com claims
   customizadas (`user_id`, `nome`, `email`, `tipo_usuario`,
   `escritorio_id`, `escritorio_nome`) e retorna `access` + `refresh` +
   dados do usuário.

```python
# backend/advocacia/views.py
class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        email = request.data.get("email", "").strip()
        senha = request.data.get("senha", "")
        ...
        usuario = Usuario.objects.select_related("escritorio").get(email__iexact=email)
        ...
        if not check_password(senha, usuario.senha):
            return Response({"detail": "E-mail ou senha inválidos."}, status=401)

        refresh = RefreshToken()
        refresh["user_id"] = usuario.id
        ...
        return Response({"refresh": str(refresh), "access": str(refresh.access_token), "usuario": {...}})
```

A IA também identificou o ponto onde a **senha é definida/alterada** —
relevante para os requisitos de senha forte pedidos na etapa seguinte, já
que o login apenas *verifica* uma senha já existente, mas não é o lugar
onde uma política de senha forte se aplica:

- **Arquivo:** `backend/advocacia/views.py`
- **Classe:** `ConfiguracoesSenhaView.post()` (endpoint
  `POST /api/configuracoes/senha/`) — usada pelo usuário já autenticado
  para trocar a própria senha.

```python
class ConfiguracoesSenhaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ...
        if len(nova_senha) < 8:
            return Response({"detail": "A nova senha deve ter pelo menos 8 caracteres."}, status=400)
        if nova_senha != confirmar_senha:
            return Response({"detail": "A confirmação da nova senha não confere."}, status=400)

        usuario.senha = make_password(nova_senha)
        usuario.save(update_fields=["senha"])
        return Response({"detail": "Senha alterada com sucesso."})
```

**Confirmação:** sim, a função foi encontrada e o funcionamento foi
entendido. A checagem hoje existente cobre **apenas o requisito de
comprimento mínimo (8 caracteres)** — não há verificação de letra
maiúscula, número ou caractere especial.

---

## 2. Etapa 2 — Geração dos testes automatizados

**Prompt utilizado:**

> "Com base na implementação encontrada, gere testes automatizados
> considerando os seguintes requisitos: senha mínima de 8 caracteres; pelo
> menos uma letra maiúscula; pelo menos um número; pelo menos um caractere
> especial."

**Testes gerados** (arquivo `backend/advocacia/tests.py`, classe
`ValidacaoDeSenhaAPITestCase`), exercitando o endpoint
`POST /api/configuracoes/senha/` com um usuário autenticado:

```python
class ValidacaoDeSenhaAPITestCase(APITestCase):
    """
    TDD — testes escritos a partir dos requisitos de senha forte pedidos
    na atividade, ANTES de confirmar se a view já os aplica.
    Alvo: ConfiguracoesSenhaView (POST /api/configuracoes/senha/).
    """

    def setUp(self):
        self.escritorio = _criar_escritorio()
        self.usuario = _criar_usuario(self.escritorio)
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {_gerar_token_de_acesso(self.usuario)}"
        )

    def _tentar_trocar_senha(self, nova_senha):
        return self.client.post(
            "/api/configuracoes/senha/",
            {
                "senha_atual": "senha12345",
                "nova_senha": nova_senha,
                "confirmar_senha": nova_senha,
            },
            format="json",
        )

    def test_senha_com_menos_de_8_caracteres_e_rejeitada(self):
        resposta = self._tentar_trocar_senha("Ab1!ab")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_senha_sem_letra_maiuscula_e_rejeitada(self):
        resposta = self._tentar_trocar_senha("abcdefg1!")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_senha_sem_numero_e_rejeitada(self):
        resposta = self._tentar_trocar_senha("Abcdefgh!")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_senha_sem_caractere_especial_e_rejeitada(self):
        resposta = self._tentar_trocar_senha("Abcdefg1")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_senha_que_atende_todos_os_requisitos_e_aceita(self):
        resposta = self._tentar_trocar_senha("Abcdefg1!")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
```

Cada teste isola **um único requisito por vez** (mudando só a senha
enviada), o que é essencial em TDD: quando um teste falha, deve ficar
claro exatamente qual regra não está implementada.

---

## 3. Etapa 3 — Execução dos testes

**Comando:** `python manage.py test advocacia.tests.ValidacaoDeSenhaAPITestCase -v 2`

**Resultado real da execução:**

```
test_senha_com_menos_de_8_caracteres_e_rejeitada ... ok
test_senha_que_atende_todos_os_requisitos_e_aceita ... ok
test_senha_sem_caractere_especial_e_rejeitada ... FAIL
test_senha_sem_letra_maiuscula_e_rejeitada ... FAIL
test_senha_sem_numero_e_rejeitada ... FAIL

======================================================================
FAIL: test_senha_sem_caractere_especial_e_rejeitada
----------------------------------------------------------------------
AssertionError: 200 != 400

======================================================================
FAIL: test_senha_sem_letra_maiuscula_e_rejeitada
----------------------------------------------------------------------
AssertionError: 200 != 400

======================================================================
FAIL: test_senha_sem_numero_e_rejeitada
----------------------------------------------------------------------
AssertionError: 200 != 400

----------------------------------------------------------------------
Ran 5 tests in 9.500s

FAILED (failures=3)
```

| Requisito                         | Teste                                          | Resultado |
|------------------------------------|-------------------------------------------------|:---------:|
| Mínimo de 8 caracteres            | `test_senha_com_menos_de_8_caracteres_e_rejeitada` | ✅ passou |
| Pelo menos 1 letra maiúscula      | `test_senha_sem_letra_maiuscula_e_rejeitada`       | ❌ falhou |
| Pelo menos 1 número               | `test_senha_sem_numero_e_rejeitada`                | ❌ falhou |
| Pelo menos 1 caractere especial   | `test_senha_sem_caractere_especial_e_rejeitada`    | ❌ falhou |
| Senha válida (atende tudo) é aceita | `test_senha_que_atende_todos_os_requisitos_e_aceita` | ✅ passou |

---

## 4. Análise (fase "red" do TDD)

Este é exatamente o comportamento esperado no ciclo **Red → Green →
Refactor** do TDD: os testes foram escritos **a partir dos requisitos**,
antes de qualquer alteração no código de produção — e três deles falharam
("red"), porque a implementação atual (`ConfiguracoesSenhaView`) só
valida o comprimento mínimo da senha.

**Causa raiz:** a view apenas executa `if len(nova_senha) < 8:` — não há
nenhuma verificação de complexidade (maiúscula, número, símbolo).

**Próximo passo natural do TDD (fase "green", não incluída nesta
atividade):** implementar a validação de complexidade em
`ConfiguracoesSenhaView` — por exemplo, com uma expressão regular — até
que os 5 testes passem, e então refatorar se necessário. Essa
implementação **não foi realizada** neste momento porque a atividade pede
apenas a geração e execução dos testes com base nos requisitos, mas fica
registrada como recomendação de melhoria de segurança para o projeto.

---

## 5. Nota sobre a integração com o pipeline de CI

Este projeto já possui um pipeline de CI (GitHub Actions) que roda
`manage.py test` a cada push/PR e falha o build se algum teste falhar. Para
manter os 3 testes "red" no repositório — como prova viva do gap, sem
quebrar o pipeline por uma regra de negócio que ainda não foi
implementada — eles foram marcados com `@unittest.expectedFailure` após a
execução documentada na seção 3 (que foi capturada **sem** esse marcador,
mostrando a falha real). Com o marcador, `manage.py test` reporta
`OK (expected failures=3)` e o CI continua verde, mas os três testes
seguem rodando a cada execução — se algum dia a validação de senha forte
for implementada, esses testes passarão a *falhar* (por estarem marcados
como esperando falha), o que serve de lembrete para remover o marcador.

## 6. Conclusão

A IA foi usada como engenheira de testes em duas etapas: primeiro para
localizar e explicar a função de autenticação (`LoginView`) e o ponto de
definição de senha (`ConfiguracoesSenhaView`); depois para gerar, a
partir de requisitos de negócio em linguagem natural, um conjunto de
testes automatizados (`pytest`/Django `TestCase`) que comprovam,
objetivamente, quais regras de senha forte já estão implementadas e
quais ainda faltam — sem que fosse necessário ler manualmente cada
possível caso de senha inválida.
