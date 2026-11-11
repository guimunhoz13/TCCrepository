# Publicação do frontend e conferência remota de 11/11/2026

Código `11a128a`, mensagem em português. Amplia a cobertura do frontend e corrige
feedback de falha ao alternar status de processo e marcar reembolso, além do foco
no assistente. Nenhum código backend ou estrutura do banco foi modificado.

O [CI 43113561017](https://github.com/guimunhoz13/TCCrepository/actions/runs/43113561017)
aprovou os quatro jobs: frontend, backend, E2E e Docker Compose HTTP. Foram
550 Django, 356 Jest e 45 Playwright = **951 casos**, os mesmos da rodada local.
As rodadas não se somam. O mínimo de 70% de linhas é aplicado pela configuração
Jest; o CI executou seu comando existente, sem mudança do workflow remoto.

A Vercel concluiu o deployment GitHub 7722961554 para esse commit em Production.
O [alias público](https://lexnexo.vercel.app) e o endereço do deploy responderam
200 e apresentaram os mesmos 12 assets Next.js no HTML. `/api/health/` respondeu
200 com status `ok`, serviço `LexNexo`. A consulta é pontual e não comprova
monitoramento contínuo ou exercício de todos os fluxos no sistema publicado.

Nenhuma publicação manual no Render foi iniciada nesta rodada. O código backend
permaneceu inalterado; a conferência da API não é apresentada como novo deploy.
Não houve criação, exclusão, anonimização ou alteração de dados de negócio na
conta publicada. Os testes práticos e a preservação conferidos em 09/11 mantêm
suas datas, IDs e evidências originais.

Cobertura frontend: linhas 72,22% nos dois ambientes; instruções 70,67%; funções
58,17%; ramos 61,55% local e 61,58% CI. O escopo e os totais de linhas são os
mesmos. O CI registrou 26 alertas npm de ferramentas, três baixos e 23 moderados;
nenhum alto/crítico. pip-audit não apontou vulnerabilidades conhecidas.
Os alertas de ferramentas permanecem registrados como risco, sem declará-los
corrigidos pela ampliação dos testes.

[Evidência compacta](evidencias/2026-11-11/ci-publicacao.json),
[validação](RELATORIO_VALIDACAO.md) e [fonte única](evidencias/metricas-atuais.json).
