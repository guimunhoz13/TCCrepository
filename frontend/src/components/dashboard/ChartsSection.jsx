"use client";

import { useMemo, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { corStatus, ordemStatus, rotuloStatus } from "@/lib/statusProcesso";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "var(--chart-tooltip-bg)",
        border: "1px solid var(--chart-tooltip-border)",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "var(--shadow-md)",
        fontSize: "0.875rem",
      }}
    >
      <strong>{payload[0].name || payload[0].payload?.nome}</strong>
      <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>
        Total: <strong style={{ color: "var(--text-primary)" }}>{payload[0].value}</strong>
      </div>
    </div>
  );
}

export default function ChartsSection({ processosPorStatus = [], totais = {} }) {
  const [fatiaAtiva, setFatiaAtiva] = useState(null);
  const [barraAtiva, setBarraAtiva] = useState(null);
  const { theme } = useTheme();

  // A cor sai do status, nunca da posição na lista: um escritório sem
  // processos suspensos não pode fazer "Arquivado" herdar outra cor. A
  // ordem é a mesma da legenda e mantém as fatias vizinhas distinguíveis.
  const pieData = useMemo(
    () =>
      [...processosPorStatus]
        .sort((a, b) => ordemStatus(a.status) - ordemStatus(b.status))
        .map((item) => ({
          name: rotuloStatus(item.status),
          value: item.total,
          cor: corStatus(item.status, theme),
        })),
    [processosPorStatus, theme]
  );

  const barData = [
    { nome: "Clientes", total: totais.clientes || 0 },
    { nome: "Processos", total: totais.processos || 0 },
    { nome: "Advogados", total: totais.advogados || 0 },
    { nome: "Documentos", total: totais.documentos || 0 },
  ];

  const fatiaSelecionada = fatiaAtiva !== null ? pieData[fatiaAtiva] : null;
  const barraSelecionada = barraAtiva !== null ? barData[barraAtiva] : null;
  const totalProcessos = pieData.reduce((soma, item) => soma + item.value, 0);

  return (
    <div className="dashboard-grid">
      <div className="panel-card">
        <h3>Processos por status</h3>
        {pieData.length === 0 ? (
          <div className="empty-state">Sem dados de processos ainda.</div>
        ) : (
          <>
            <div style={{ width: "100%", height: 260, position: "relative" }}>
              <div className="donut-center">
                <strong>{totalProcessos}</strong>
                <span>{totalProcessos === 1 ? "processo" : "processos"}</span>
              </div>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    onClick={(_, index) =>
                      setFatiaAtiva(fatiaAtiva === index ? null : index)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={pieData[index].cor}
                        opacity={
                          fatiaAtiva === null || fatiaAtiva === index ? 1 : 0.35
                        }
                        stroke={fatiaAtiva === index ? "var(--accent)" : "none"}
                        strokeWidth={fatiaAtiva === index ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-legend">
              {pieData.map((item, index) => (
                <button
                  type="button"
                  key={item.name}
                  className={`chart-legend-item ${
                    fatiaAtiva === index ? "active" : ""
                  }`}
                  onClick={() =>
                    setFatiaAtiva(fatiaAtiva === index ? null : index)
                  }
                >
                  <span
                    className="chart-legend-dot"
                    style={{ background: item.cor }}
                  />
                  {item.name}: {item.value}
                </button>
              ))}
            </div>

            {fatiaSelecionada && (
              <div className="chart-detail-box">
                <strong>{fatiaSelecionada.name}</strong> —{" "}
                {fatiaSelecionada.value} processo
                {fatiaSelecionada.value !== 1 ? "s" : ""} neste status
              </div>
            )}
          </>
        )}
      </div>

      <div className="panel-card">
        <h3>Visão geral do escritório</h3>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={barData}>
              <XAxis
                dataKey="nome"
                tick={{ fill: "var(--text-secondary)", fontSize: 12 }}
              />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="total"
                radius={[8, 8, 0, 0]}
                onClick={(_, index) =>
                  setBarraAtiva(barraAtiva === index ? null : index)
                }
                style={{ cursor: "pointer" }}
              >
                {barData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={
                      barraAtiva === index ? "var(--accent)" : "var(--chart-bar)"
                    }
                    opacity={
                      barraAtiva === null || barraAtiva === index ? 1 : 0.4
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend">
          {barData.map((item, index) => (
            <button
              type="button"
              key={item.nome}
              className={`chart-legend-item ${
                barraAtiva === index ? "active" : ""
              }`}
              onClick={() =>
                setBarraAtiva(barraAtiva === index ? null : index)
              }
            >
              {item.nome}: {item.total}
            </button>
          ))}
        </div>

        {barraSelecionada && (
          <div className="chart-detail-box">
            O escritório possui <strong>{barraSelecionada.total}</strong>{" "}
            {barraSelecionada.nome.toLowerCase()} cadastrado
            {barraSelecionada.total !== 1 ? "s" : ""}.
          </div>
        )}
      </div>
    </div>
  );
}
