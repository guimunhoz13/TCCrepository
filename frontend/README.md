# LexNexo — frontend

Interface em Next.js (React) do LexNexo. A explicação do projeto, como rodar
localmente, os testes e a integração contínua estão no [README principal](../README.md).

**Assinatura da marca:** O nexo entre gestão e Direito. Os SVGs e as regras de
uso ficam em [`assets/branding`](../assets/branding/README.md).

```bash
npm install
npm run dev        # http://localhost:3000 (API em NEXT_PUBLIC_API_URL)
npm test           # testes de componente (Jest)
npm run lint
npx playwright test  # testes de ponta a ponta (ver README principal)
```
