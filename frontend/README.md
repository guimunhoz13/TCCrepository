# LexNexo — frontend

Interface em Next.js (React) do LexNexo. A explicação do projeto, como rodar
localmente, os testes e a integração contínua estão no [README principal](../README.md).

Em produção na Vercel, o navegador chama a API pelo caminho de mesma origem
`/api`. O `next.config.mjs` encaminha essas requisições para o endereço definido
em `NEXT_PUBLIC_API_URL`. Esse proxy evita indisponibilidade por CORS quando o
domínio público do frontend é alterado.

**Assinatura da marca:** O nexo entre gestão e Direito. Os SVGs e as regras de
uso ficam em [`assets/branding`](../assets/branding/README.md).

```bash
npm ci
npm run dev        # http://localhost:3000 (API em NEXT_PUBLIC_API_URL)
npm test           # testes de componente (Jest)
npm run lint
npx playwright test  # testes de ponta a ponta (ver README principal)
```

A rodada de auditoria e os testes práticos de 27/10/2026 estão em
[`docs/testes`](../docs/testes/RELATORIO_VALIDACAO.md). Para cobertura incluindo
arquivos sem testes: `npm test -- --runInBand --coverage
--collectCoverageFrom='src/**/*.{js,jsx}'`. Não interpretar somente a contagem
de testes como cobertura de todos os painéis. O runner resolve os aliases
`@/` pelo mesmo diretório `src` usado pelo Next.js.

O layout de `/dashboard` mantém as preferências de aparência montadas durante
a navegação para Compromissos e o retorno à página inicial. Isso evita aplicar
temporariamente a densidade padrão antes de recuperar a escolha salva.
Os testes de `e2e/preferencias.spec.js` observam toda a transição, incluindo
voltar/avançar no navegador e abrir a Agenda a partir de Compromissos.
O reteste de 28/10/2026 está no
[relatório de validação](../docs/testes/RELATORIO_VALIDACAO.md#reteste-da-dashboard).
