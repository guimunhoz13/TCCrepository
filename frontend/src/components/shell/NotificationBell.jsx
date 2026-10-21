"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Bell, CalendarDays, ChevronRight } from "lucide-react";
import { resumirAlertasAgenda } from "@/lib/alertasAgenda";

export default function NotificationBell({ eventos = [], onSelect }) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef(null);
  const botaoRef = useRef(null);
  const painelId = useId();
  const resumo = resumirAlertasAgenda(eventos);

  const detalheDoBotao = resumo.total
    ? `: ${resumo.total} ${resumo.total === 1 ? "alerta" : "alertas"}${
        resumo.fatais ? `, ${resumo.fatais} ${resumo.fatais === 1 ? "fatal" : "fatais"}` : ""
      }`
    : ": nenhum alerta";

  useEffect(() => {
    function aoClicarFora(evento) {
      if (containerRef.current && !containerRef.current.contains(evento.target)) {
        setAberto(false);
      }
    }
    function aoPressionarTecla(evento) {
      if (evento.key === "Escape" && aberto) {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoPressionarTecla);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoPressionarTecla);
    };
  }, [aberto]);

  return (
    <div className="notif-bell-wrap" ref={containerRef}>
      <button
        ref={botaoRef}
        type="button"
        className="icon-btn notif-bell-btn"
        onClick={() => setAberto((atual) => !atual)}
        aria-label={`Notificações${detalheDoBotao}`}
        aria-expanded={aberto}
        aria-controls={painelId}
      >
        <Bell size={18} />
        {eventos.length > 0 && <span className="notif-bell-badge">{eventos.length}</span>}
      </button>

      {aberto && (
        <section
          id={painelId}
          className="notif-dropdown"
          aria-label="Central de alertas da agenda"
        >
          <div className="notif-dropdown-header">
            <strong>Central de alertas</strong>
            <span>
              {resumo.total === 0
                ? "Sua agenda está em dia"
                : `${resumo.total} ${resumo.total === 1 ? "item exige" : "itens exigem"} atenção`}
            </span>
          </div>
          {eventos.length === 0 ? (
            <div className="global-search-empty">
              Nenhum prazo vencido nem evento previsto para os próximos sete dias.
            </div>
          ) : (
            eventos.map((evento) => (
              <button
                type="button"
                key={evento.id}
                className={`notif-dropdown-item notif-${evento.gravidade}`}
                onClick={() => {
                  setAberto(false);
                  onSelect?.(evento);
                }}
              >
                <span className="notif-item-icon" aria-hidden="true">
                  {evento.vencido || evento.fatal ? (
                    <AlertTriangle size={17} />
                  ) : (
                    <CalendarDays size={17} />
                  )}
                </span>
                <span className="notif-item-conteudo">
                  <span className="notif-item-rotulos">
                    <span>{evento.tipoLabel}</span>
                    {evento.fatal && <span>Fatal</span>}
                    {evento.vencido && <span>Vencido</span>}
                  </span>
                  <strong>{evento.titulo}</strong>
                  <span className="notif-item-quando">{evento.quando}</span>
                  {evento.numero_processo && (
                    <small>Processo {evento.numero_processo}</small>
                  )}
                </span>
                <ChevronRight size={16} className="notif-item-seta" aria-hidden="true" />
              </button>
            ))
          )}
          <button
            type="button"
            className="notif-ver-agenda"
            onClick={() => {
              setAberto(false);
              onSelect?.(null);
            }}
          >
            Abrir agenda completa <ChevronRight size={15} />
          </button>
        </section>
      )}
    </div>
  );
}
