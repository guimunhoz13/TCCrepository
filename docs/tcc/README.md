# Relatório técnico do TCC (gerado por script)

O documento `RT-TDS-2026-39` é gerado a partir de `gerar_rt.js` (conteúdo),
`build_rt.js` (estilos e utilitários) e `main.js` (montagem), com a
biblioteca `docx`:

```bash
cd docs/tcc && npm install docx && node main.js   # gera RT-TDS-2026-39_v1.1.docx
```

Os diagramas ficam em `diagramas/*.puml` (PlantUML) e são renderizados com
`plantuml -tpng diagramas/*.puml`. As capturas de tela (`print_*.png`) foram
tiradas do sistema rodando sobre `python manage.py popular_demo`.

**Situação da v1.1 (em andamento):** já atualizados com as Partes 5, 6 e 7 —
resumo, introdução, backlog, requisitos funcionais e não funcionais, regras
de negócio (RN26 a RN34), diagramas (casos de uso, classes, banco de dados,
contexto, containers, componentes e o novo diagrama de sequência do DJEN) e as
capturas de tela. Faltam: textos das seções 4 (casos de uso/sequência), 5
(modelagem de dados), 6 (protótipos das novas telas), 7 (arquitetura), 8
(trabalhos futuros), 9 (conclusão), referências e as páginas do sumário.
