"use client";

import { useEffect, useState } from "react";

import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/layout/Header";
import DashboardCard from "@/components/dashboard/DashboardCard";

import {
  getClientes,
  getProcessos,
  getAgenda,
  getDocumentos,
} from "@/services/api";


function normalizarLista(dados) {
  if (Array.isArray(dados)) {
    return dados;
  }

  if (Array.isArray(dados?.results)) {
    return dados.results;
  }

  return [];
}


function formatarStatus(status) {
  if (status === "Concluido") {
    return "Concluído";
  }

  return status || "-";
}


export default function Dashboard() {
  const [clientes, setClientes] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [documentos, setDocumentos] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");


  useEffect(() => {
    async function carregarDashboard() {
      try {
        setCarregando(true);
        setErro("");

        const [
          dadosClientes,
          dadosProcessos,
          dadosAgenda,
          dadosDocumentos,
        ] = await Promise.all([
          getClientes(),
          getProcessos(),
          getAgenda(),
          getDocumentos(),
        ]);

        setClientes(normalizarLista(dadosClientes));
        setProcessos(normalizarLista(dadosProcessos));
        setAgenda(normalizarLista(dadosAgenda));
        setDocumentos(normalizarLista(dadosDocumentos));
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);

        setErro(
          "Não foi possível carregar os dados da dashboard."
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, []);


  const processosRecentes = processos.slice(0, 5);


  return (
    <div
      className="d-flex"
      style={{
        background: "#F8FAFC",
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <div className="flex-grow-1 p-4">

        <Header title="Dashboard" />

        {erro && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            {erro}
          </div>
        )}

        <div className="row g-4">

          <div className="col-md-3">
            <DashboardCard
              titulo="Clientes"
              valor={carregando ? "..." : clientes.length}
            />
          </div>

          <div className="col-md-3">
            <DashboardCard
              titulo="Processos"
              valor={carregando ? "..." : processos.length}
            />
          </div>

          <div className="col-md-3">
            <DashboardCard
              titulo="Audiências"
              valor={carregando ? "..." : agenda.length}
            />
          </div>

          <div className="col-md-3">
            <DashboardCard
              titulo="Documentos"
              valor={carregando ? "..." : documentos.length}
            />
          </div>

        </div>

        <div
          className="mt-5 p-4 rounded-4 shadow-sm"
          style={{
            background: "white",
          }}
        >
          <h4
            className="fw-bold mb-4"
            style={{
              color: "var(--color-primary)",
            }}
          >
            Processos Recentes
          </h4>

          <table className="table">

            <thead>
              <tr>
                <th>Processo</th>
                <th>Cliente</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>

              {carregando && (
                <tr>
                  <td colSpan="3">
                    Carregando processos...
                  </td>
                </tr>
              )}

              {!carregando &&
                processosRecentes.map((processo) => (
                  <tr key={processo.id}>
                    <td>
                      {processo.numero_processo}
                    </td>

                    <td>
                      {processo.cliente_nome}
                    </td>

                    <td>
                      {formatarStatus(processo.status)}
                    </td>
                  </tr>
                ))}

              {!carregando &&
                processosRecentes.length === 0 && (
                  <tr>
                    <td colSpan="3">
                      Nenhum processo cadastrado.
                    </td>
                  </tr>
                )}

            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
}