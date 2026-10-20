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
npm install
npm run dev        # http://localhost:3000 (API em NEXT_PUBLIC_API_URL)
npm test           # testes de componente (Jest)
npm run lint
npx playwright test  # testes de ponta a ponta (ver README principal)
```
