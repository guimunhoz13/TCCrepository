"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, LogOut, Trash2 } from "lucide-react";
import {
  getMasterLogado,
  masterLogout,
  getMasterStats,
  getMasterEscritorios,
  updateMasterEscritorio,
  deleteMasterEscritorio,
  normalizarLista,
} from "@/services/api";

export default function MasterPainelPage() {
  const router = useRouter();
  const [master, setMaster] = useState(null);
  const [stats, setStats] = useState(null);
  const [escritorios, setEscritorios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    try {
      setCarregando(true);
      const [dadosStats, dadosEscritorios] = await Promise.all([
        getMasterStats(),
        getMasterEscritorios(),
      ]);
      setStats(dadosStats);
      setEscritorios(normalizarLista(dadosEscritorios));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("master_access");
    if (!token) {
      router.replace("/master");
      return;
    }
    setMaster(getMasterLogado());
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAlternarAtivo(escritorio) {
    await updateMasterEscritorio(escritorio.id, { ativo: !escritorio.ativo });
    carregarDados();
  }

  async function handleAtualizarPlano(escritorio, campo, valor) {
    await updateMasterEscritorio(escritorio.id, { [campo]: valor });
    carregarDados();
  }

  async function handleExcluir(escritorio) {
    if (window.confirm(`Excluir permanentemente o escritório "${escritorio.nome}"? Essa ação não pode ser desfeita.`)) {
      await deleteMasterEscritorio(escritorio.id);
      carregarDados();
    }
  }

  function handleSair() {
    masterLogout();
    router.push("/master");
  }

  if (!master) return null;

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <ShieldCheck size={22} />
          <div>
            <h1 style={{ margin: 0, fontSize: "1.3rem" }}>Painel mestre</h1>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Logado como {master.nome} ({master.email})
            </p>
          </div>
        </div>
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleSair}>
          <LogOut size={14} /> Sair
        </button>
      </header>

      {erro && <div className="alert alert-error">{erro}</div>}

      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 28,
          }}
        >
          {[
            ["Escritórios", stats.total_escritorios],
            ["Ativos", stats.escritorios_ativos],
            ["Inativos", stats.escritorios_inativos],
            ["Advogados", stats.total_advogados],
            ["Clientes", stats.total_clientes],
            ["Processos", stats.total_processos],
          ].map(([label, valor]) => (
            <div key={label} className="auth-card" style={{ padding: "16px 18px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                {label}
              </span>
              <strong style={{ display: "block", fontSize: "1.6rem" }}>{valor}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Escritório</th>
              <th>CNPJ</th>
              <th>Advogados</th>
              <th>Clientes</th>
              <th>Processos</th>
              <th>Plano</th>
              <th>Validade do plano</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan="9">Carregando...</td>
              </tr>
            )}
            {!carregando &&
              escritorios.map((escritorio) => (
                <tr key={escritorio.id}>
                  <td>{escritorio.nome}</td>
                  <td>{escritorio.cnpj}</td>
                  <td>{escritorio.total_advogados}</td>
                  <td>{escritorio.total_clientes}</td>
                  <td>{escritorio.total_processos}</td>
                  <td>
                    <select
                      value={escritorio.plano}
                      onChange={(e) => handleAtualizarPlano(escritorio, "plano", e.target.value)}
                    >
                      <option value="gratuito">Gratuito</option>
                      <option value="basico">Básico</option>
                      <option value="profissional">Profissional</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="date"
                      value={escritorio.plano_validade || ""}
                      onChange={(e) => handleAtualizarPlano(escritorio, "plano_validade", e.target.value)}
                    />
                  </td>
                  <td>
                    <span className={`badge ${escritorio.ativo ? "badge-success" : "badge-danger"}`}>
                      {escritorio.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleAlternarAtivo(escritorio)}
                      >
                        {escritorio.ativo ? "Inativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleExcluir(escritorio)}
                        title="Excluir escritório"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
