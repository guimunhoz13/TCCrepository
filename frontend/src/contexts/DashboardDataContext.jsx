"use client";

import { createContext, useCallback, useContext } from "react";
import { getDashboardResumo } from "@/services/api";
import { useRecurso } from "@/hooks/useRecurso";

const DashboardDataContext = createContext(null);

const VAZIO = [];

export function DashboardDataProvider({ children }) {
  // Uma única requisição traz tudo o que a dashboard desenha (antes eram 14,
  // uma lista completa por área). A busca do topo consulta o servidor à parte.
  const recurso = useRecurso(getDashboardResumo);
  const dados = recurso.dados;
  const recarregar = recurso.recarregar;

  // Os painéis chamam `refresh().catch(...)` depois de salvar algo; a
  // recarga em si é disparada aqui e acontece em segundo plano.
  const refresh = useCallback(() => {
    recarregar();
    return Promise.resolve();
  }, [recarregar]);

  return (
    <DashboardDataContext.Provider
      value={{
        stats: dados ?? null,
        processos: dados?.processos_recentes ?? VAZIO,
        agenda: dados?.agenda ?? VAZIO,
        documentos: dados?.documentos_recentes ?? VAZIO,
        tarefas: dados?.minhas_tarefas ?? VAZIO,
        novosNaSemana: dados?.novos_na_semana ?? {},
        carregando: recurso.carregando && !dados,
        erro: recurso.erro,
        // Muda a cada resposta nova: a dashboard usa para piscar o
        // indicador de "dados em tempo real".
        versaoDados: dados,
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
