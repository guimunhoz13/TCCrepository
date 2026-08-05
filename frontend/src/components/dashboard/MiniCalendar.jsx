"use client";

import { useMemo } from "react";

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function MiniCalendar({ eventos = [] }) {
  const hoje = new Date();

  const { dias, mesAtual } = useMemo(() => {
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);

    const diasDoMes = [];
    for (let i = 0; i < primeiroDia.getDay(); i += 1) {
      diasDoMes.push(null);
    }
    for (let dia = 1; dia <= ultimoDia.getDate(); dia += 1) {
      diasDoMes.push(dia);
    }

    return {
      dias: diasDoMes,
      mesAtual: hoje.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    };
  }, [hoje]);

  const diasComEvento = useMemo(() => {
    const set = new Set();
    eventos.forEach((evento) => {
      const data = new Date(evento.data_evento);
      if (
        data.getMonth() === hoje.getMonth() &&
        data.getFullYear() === hoje.getFullYear()
      ) {
        set.add(data.getDate());
      }
    });
    return set;
  }, [eventos, hoje]);

  return (
    <div className="panel-card">
      <h3>Calendário — {mesAtual}</h3>

      <div className="calendar-grid">
        {DIAS.map((dia) => (
          <div key={dia} className="calendar-day">
            {dia}
          </div>
        ))}

        {dias.map((dia, index) => {
          if (!dia) {
            return <div key={`empty-${index}`} />;
          }

          const isToday = dia === hoje.getDate();
          const hasEvent = diasComEvento.has(dia);

          return (
            <div
              key={dia}
              className={`calendar-cell ${hasEvent ? "has-event" : ""} ${
                isToday ? "today" : ""
              }`}
            >
              {dia}
            </div>
          );
        })}
      </div>
    </div>
  );
}
