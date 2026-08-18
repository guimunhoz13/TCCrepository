"use client";

import { useState } from "react";
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
  Legend,
} from "recharts";

const CORES = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

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

  const pieData = processosPorStatus.map((item) => ({
    name: item.status === "Concluido" ? "Concluído" : item.status,
    value: item.total,
  }));

  const barData = [
    { nome: "Clientes", total: totais.clientes || 0 },
    { nome: "Processos", total: totais.processos || 0 },
    { nome: "Advogados", total: totais.advogados || 0 },
    { nome: "Documentos", total: totais.documentos || 0 },
  ];

  const fatiaSelecionada = fatiaAtiva !== null ? pieData[fatiaAtiva] : null;
  const barraSelecionada = barraAtiva !== null ? barData[barraAtiva] : null;

  return (
    <div className="dashboard-grid">
      <div className="panel-card">
        <h3>Processos por status</h3>
        {pieData.length === 0 ? (
          <div className="empty-state">Sem dados de processos ainda.</div>
        ) : (
          <>
            <div style={{ width: "100%", height: 260 }}>
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
                        fill={CORES[index % CORES.length]}
                        opacity={
                          fatiaAtiva === null || fatiaAtiva === index ? 1 : 0.35
                        }
                        stroke={fatiaAtiva === index ? "var(--accent)" : "none"}
                        strokeWidth={fatiaAtiva === index ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                        {value}
                      </span>
                    )}
                  />
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
                    style={{ background: CORES[index % CORES.length] }}
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
                      barraAtiva === null || barraAtiva === index
                        ? "var(--accent)"
                        : "var(--text-muted)"
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
