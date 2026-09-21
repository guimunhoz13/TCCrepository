"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  getDashboardStats,
  getProcessos,
  getAgenda,
  getClientes,
  getDocumentos,
  getTarefas,
  getContratos,
  getApontamentos,
  getModelosDocumento,
  normalizarLista,
} from "@/services/api";

const DashboardDataContext = createContext(null);

export function DashboardDataProvider({ children }) {
  const [stats, setStats] = useState(null);
  const [processos, setProcessos] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  // Coleções que a dashboard não desenha, mas que a busca do topo
  // precisa para achar contrato, hora apontada e modelo. Vêm no mesmo
  // lote das outras: são requisições paralelas, então não atrasam a
  // abertura.
  const [tarefasBusca, setTarefasBusca] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [apontamentos, setApontamentos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState(null);
  const primeiraCarga = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [
        dadosStats,
        dadosProcessos,
        dadosAgenda,
        dadosClientes,
        dadosDocumentos,
        dadosTarefas,
        dadosTarefasBusca,
        dadosContratos,
        dadosApontamentos,
        dadosModelos,
      ] = await Promise.all([
        getDashboardStats(),
        getProcessos(),
        getAgenda(),
        getClientes(),
        getDocumentos(),
        // Só o que está pendente para quem abriu a dashboard: tarefa dos
        // outros ou já resolvida não é "o que eu tenho para fazer".
        getTarefas({ responsavel: "eu", status: "abertas" }),
        // A busca precisa achar a tarefa de qualquer pessoa, inclusive as
        // já concluídas — por isso uma consulta sem filtro, separada da
        // que alimenta o cartão.
        getTarefas(),
        getContratos(),
        getApontamentos(),
        getModelosDocumento(),
      ]);
      setStats(dadosStats);
      setProcessos(normalizarLista(dadosProcessos));
      setAgenda(normalizarLista(dadosAgenda));
      setClientes(normalizarLista(dadosClientes));
      setDocumentos(normalizarLista(dadosDocumentos));
      setTarefas(normalizarLista(dadosTarefas));
      setTarefasBusca(normalizarLista(dadosTarefasBusca));
      setContratos(normalizarLista(dadosContratos));
      setApontamentos(normalizarLista(dadosApontamentos));
      setModelos(normalizarLista(dadosModelos));
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
        tarefas,
        tarefasBusca,
        contratos,
        apontamentos,
        modelos,
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
