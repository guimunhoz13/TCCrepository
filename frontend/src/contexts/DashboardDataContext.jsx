"use client";

import { createContext, useCallback, useContext, useEffect } from "react";
import { getDashboardResumo, getUsuarioLogado, salvarUsuarioLogado } from "@/services/api";
import { useRecurso } from "@/hooks/useRecurso";

const DashboardDataContext = createContext(null);

const VAZIO = [];

export function DashboardDataProvider({ children }) {
  // Uma única requisição traz tudo o que a dashboard desenha (antes eram 14,
  // uma lista completa por área). A busca do topo consulta o servidor à parte.
  const recurso = useRecurso(getDashboardResumo);
  const dados = recurso.dados;
  const recarregar = recurso.recarregar;

  // O perfil pode ter mudado desde o login (o administrador trocou de
  // estagiário para advogado, por exemplo): a dashboard traz as permissões
  // atuais e o menu se ajusta sem precisar sair e entrar de novo.
  const tipoAtual = dados?.tipo_usuario;
  const permissoesAtuais = dados?.permissoes;
  useEffect(() => {
    if (!tipoAtual || !permissoesAtuais) return;
    const salvo = getUsuarioLogado();
    if (!salvo) return;
    if (
      salvo.tipo_usuario !== tipoAtual ||
      JSON.stringify(salvo.permissoes) !== JSON.stringify(permissoesAtuais)
    ) {
      salvarUsuarioLogado({ ...salvo, tipo_usuario: tipoAtual, permissoes: permissoesAtuais });
    }
  }, [tipoAtual, permissoesAtuais]);

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
