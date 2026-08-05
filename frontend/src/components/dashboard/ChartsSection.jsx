"use client";

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

const CORES = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ChartsSection({ processosPorStatus = [], totais = {} }) {
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

  return (
    <div className="dashboard-grid">
      <div className="panel-card">
        <h3>Processos por status</h3>
        {pieData.length === 0 ? (
          <div className="empty-state">Sem dados de processos ainda.</div>
        ) : (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="panel-card">
        <h3>Visão geral do escritório</h3>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={barData}>
              <XAxis dataKey="nome" tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--text-secondary)", fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
