"use client";

import { Wallet, TrendingUp, AlertTriangle, Clock, Receipt } from "lucide-react";
import { formatarMoeda, formatarHoras } from "@/utils/formato";

function nomeDoMes() {
  const mes = new Date().toLocaleDateString("pt-BR", { month: "long" });
  return mes.charAt(0).toUpperCase() + mes.slice(1);
}

function Indicador({ icon: Icon, rotulo, valor, detalhe, alerta }) {
  return (
    <div className={`financeiro-card ${alerta ? "alerta" : ""}`}>
      <span className="financeiro-card-icon">
        <Icon size={17} />
      </span>
      <div className="financeiro-card-rotulo">{rotulo}</div>
      <div className="financeiro-card-valor">{valor}</div>
      <div className="financeiro-card-detalhe">{detalhe}</div>
    </div>
  );
}

export default function FinanceiroSection({ financeiro, carregando }) {
  const dados = financeiro || {};
  const vencidas = Number(dados.parcelas_vencidas) || 0;

  const indicadores = [
    {
      icon: Wallet,
      rotulo: "A receber",
      valor: formatarMoeda(dados.a_receber),
      detalhe: "Parcelas em aberto de todos os contratos",
    },
    {
      icon: TrendingUp,
      rotulo: `Recebido em ${nomeDoMes()}`,
      valor: formatarMoeda(dados.recebido_no_mes),
      detalhe: "Parcelas quitadas desde o dia 1º",
    },
    {
      icon: AlertTriangle,
      rotulo: "Vencido",
      valor: formatarMoeda(dados.valor_vencido),
      detalhe:
        vencidas === 0
          ? "Nenhuma parcela passou do vencimento"
          : `${vencidas} parcela${vencidas > 1 ? "s" : ""} passou do vencimento`,
      alerta: vencidas > 0,
    },
    {
      icon: Clock,
      rotulo: "Horas faturáveis no mês",
      valor: formatarMoeda(dados.valor_horas_faturaveis_no_mes),
      detalhe: `${formatarHoras(dados.minutos_faturaveis_no_mes)} apontadas`,
    },
    {
      icon: Receipt,
      rotulo: "Despesas a reembolsar",
      valor: formatarMoeda(dados.despesas_a_reembolsar),
      detalhe: "Adiantadas pelo escritório e ainda não cobradas",
    },
  ];

  return (
    <div className="panel-card" style={{ marginTop: 18 }}>
      <h3>Financeiro do escritório</h3>
      <div className="financeiro-grid">
        {indicadores.map((item) =>
          carregando ? (
            <div key={item.rotulo} className="financeiro-card">
              <span className="financeiro-card-icon">
                <item.icon size={17} />
              </span>
              <div className="financeiro-card-rotulo">{item.rotulo}</div>
              <span className="skeleton skeleton-valor" />
              <div className="financeiro-card-detalhe">
                <span className="skeleton skeleton-texto" />
              </div>
            </div>
          ) : (
            <Indicador key={item.rotulo} {...item} />
          )
        )}
      </div>
    </div>
  );
}
