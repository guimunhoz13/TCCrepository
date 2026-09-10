"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

function formatarQuando(dataISO) {
  const data = new Date(dataISO);
  const hoje = new Date();
  const diffDias = Math.round((data.setHours(0, 0, 0, 0) - hoje.setHours(0, 0, 0, 0)) / 86400000);

  const hora = new Date(dataISO).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (diffDias === 0) return `Hoje, ${hora}`;
  if (diffDias === 1) return `Amanhã, ${hora}`;
  return `Em ${diffDias} dias, ${hora}`;
}

export default function NotificationBell({ eventos = [], onSelect }) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function aoClicarFora(evento) {
      if (containerRef.current && !containerRef.current.contains(evento.target)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, []);

  return (
    <div className="notif-bell-wrap" ref={containerRef}>
      <button
        type="button"
        className="icon-btn notif-bell-btn"
        onClick={() => setAberto((atual) => !atual)}
        aria-label="Notificações"
      >
        <Bell size={18} />
        {eventos.length > 0 && <span className="notif-bell-badge">{eventos.length}</span>}
      </button>

      {aberto && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">Próximos compromissos</div>
          {eventos.length === 0 ? (
            <div className="global-search-empty">Nada agendado para os próximos dias.</div>
          ) : (
            eventos.map((evento) => (
              <button
                type="button"
                key={evento.id}
                className="notif-dropdown-item"
                onClick={() => {
                  setAberto(false);
                  onSelect?.(evento);
                }}
              >
                <strong>{evento.titulo}</strong>
                <span>{formatarQuando(evento.data_evento)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
