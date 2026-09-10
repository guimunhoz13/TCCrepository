"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  getDashboardStats,
  getProcessos,
  getAgenda,
  getClientes,
  getDocumentos,
  normalizarLista,
} from "@/services/api";

const DashboardDataContext = createContext(null);

export function DashboardDataProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [processos, setProcessos] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const primeiraCarga = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [dadosStats, dadosProcessos, dadosAgenda, dadosClientes, dadosDocumentos] =
        await Promise.all([
          getDashboardStats(),
          getProcessos(),
          getAgenda(),
          getClientes(),
          getDocumentos(),
        ]);
      setStats(dadosStats);
      setProcessos(normalizarLista(dadosProcessos));
      setAgenda(normalizarLista(dadosAgenda));
      setClientes(normalizarLista(dadosClientes));
      setDocumentos(normalizarLista(dadosDocumentos));
      setAtualizadoEm(Date.now());
      setErro("");
      return true;
    } catch (error) {
      setErro(error.message);
      throw error;
    } finally {
      if (primeiraCarga.current) {
        primeiraCarga.current = false;
        setCarregando(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  return (
    <DashboardDataContext.Provider
      value={{
        stats,
        processos,
        agenda,
        clientes,
        documentos,
        carregando,
        erro,
        atualizadoEm,
        refresh,
      }}
    >
      {children}
    </DashboardDataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error("useDashboardData deve ser usado dentro de DashboardDataProvider");
  }
  return context;
}
