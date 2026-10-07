"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SERIES = [
  { chave: "recebido", rotulo: "Recebido", cor: "var(--serie-recebido)" },
  { chave: "despesas", rotulo: "Despesas", cor: "var(--serie-despesas)" },
];

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const moedaCompacta = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

function rotuloDoMes(mes, opcoes = { month: "short" }) {
  const [ano, numero] = mes.split("-").map(Number);
  const texto = new Date(ano, numero - 1, 1)
    .toLocaleDateString("pt-BR", opcoes)
    .replace(".", "");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function DicaDoMes({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const linha = payload[0].payload;
  const saldo = linha.recebido - linha.despesas;
  return (
    <div className="grafico-dica">
      <strong>{rotuloDoMes(label, { month: "long", year: "numeric" })}</strong>
      {SERIES.map((serie) => (
        <div key={serie.chave} className="grafico-dica-linha">
          <span className="chart-legend-dot" style={{ background: serie.cor }} />
          {serie.rotulo}
          <b>{moeda.format(linha[serie.chave])}</b>
        </div>
      ))}
      <div className="grafico-dica-linha grafico-dica-saldo">
        Saldo
        <b>{moeda.format(saldo)}</b>
      </div>
    </div>
  );
}

/**
 * Quanto entrou (parcelas pagas) e quanto saiu (despesas lançadas) em cada
 * um dos últimos seis meses. Mesma unidade nas duas séries, então um eixo
 * só; as duas cores foram validadas para daltonismo nos dois temas.
 */
export default function ReceitaDespesas({ serie = [] }) {
  const [verTabela, setVerTabela] = useState(false);
  const dados = serie.map((mes) => ({
    mes: mes.mes,
    recebido: Number(mes.recebido) || 0,
    despesas: Number(mes.despesas) || 0,
  }));
  const totalRecebido = dados.reduce((soma, mes) => soma + mes.recebido, 0);
  const totalDespesas = dados.reduce((soma, mes) => soma + mes.despesas, 0);
  const vazio = dados.every((mes) => mes.recebido === 0 && mes.despesas === 0);

  return (
    <div className="panel-card">
      <div className="grafico-cabecalho">
        <h3>Recebido × despesas</h3>
        <span className="grafico-periodo">Últimos 6 meses</span>
      </div>

      {vazio ? (
        <div className="empty-state">
          Nenhuma parcela paga ou despesa lançada nos últimos seis meses.
        </div>
      ) : (
        <>
          <div className="grafico-legenda" aria-hidden="true">
            {SERIES.map((s) => (
              <span key={s.chave}>
                <span className="chart-legend-dot" style={{ background: s.cor }} />
                {s.rotulo}
              </span>
            ))}
          </div>

          <div style={{ width: "100%", height: 240 }} role="img" aria-label={
            `Gráfico de barras: nos últimos seis meses o escritório recebeu ${moeda.format(totalRecebido)} e lançou ${moeda.format(totalDespesas)} em despesas.`
          }>
            <ResponsiveContainer>
              <BarChart data={dados} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="mes"
                  tickFormatter={(mes) => rotuloDoMes(mes)}
                  tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
                  axisLine={{ stroke: "var(--border-strong)" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(valor) => moedaCompacta.format(valor)}
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={64}
                />
                <Tooltip content={<DicaDoMes />} cursor={{ fill: "var(--ink-soft)" }} />
                {SERIES.map((s) => (
                  <Bar
                    key={s.chave}
                    dataKey={s.chave}
                    name={s.rotulo}
                    fill={s.cor}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={22}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grafico-resumo">
            <span>Recebido: <strong>{moeda.format(totalRecebido)}</strong></span>
            <span>Despesas: <strong>{moeda.format(totalDespesas)}</strong></span>
            <span>Saldo: <strong>{moeda.format(totalRecebido - totalDespesas)}</strong></span>
          </div>

          <button
            type="button"
            className="stat-card-link"
            onClick={() => setVerTabela((v) => !v)}
            aria-expanded={verTabela}
          >
            {verTabela ? "Ocultar tabela" : "Ver como tabela"}
          </button>

          {verTabela && (
            <table className="grafico-tabela">
              <thead>
                <tr><th>Mês</th><th>Recebido</th><th>Despesas</th></tr>
              </thead>
              <tbody>
                {dados.map((mes) => (
                  <tr key={mes.mes}>
                    <td>{rotuloDoMes(mes.mes, { month: "long", year: "numeric" })}</td>
                    <td>{moeda.format(mes.recebido)}</td>
                    <td>{moeda.format(mes.despesas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
