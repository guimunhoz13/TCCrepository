"use client";

import { useEffect, useState } from "react";
import { usePanel, PANELS } from "@/contexts/PanelContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import { getUsuarioLogado, registrarAdvogado, getAdvogados, normalizarLista } from "@/services/api";

export default function AdvogadosPanel() {
  const { activePanel, panelTab } = usePanel();
  const usuario = getUsuarioLogado();
  const [advogados, setAdvogados] = useState([]);
  const [formAdvogado, setFormAdvogado] = useState({
    nome: "",
    email: "",
    senha: "",
    oab: "",
    especialidade: "",
  });
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function carregarAdvogados() {
    try {
      setCarregando(true);
      const dados = await getAdvogados();
      setAdvogados(normalizarLista(dados));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (activePanel === PANELS.ADVOGADOS) {
      carregarAdvogados();
    }
  }, [activePanel]);

  async function handleAdvogado(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      await registrarAdvogado(formAdvogado);
      setMensagem("Advogado cadastrado com sucesso.");
      setFormAdvogado({
        nome: "",
        email: "",
        senha: "",
        oab: "",
        especialidade: "",
      });
      await carregarAdvogados();
    } catch (error) {
      setErro(error.message);
    }
  }

  if (activePanel !== PANELS.ADVOGADOS) return null;

  if (usuario?.tipo_usuario !== "admin") {
    return (
      <OverlayPanel>
        <div className="empty-state">
          Apenas administradores podem gerenciar advogados.
        </div>
      </OverlayPanel>
    );
  }

  return (
    <OverlayPanel
      tabs={[
        { id: "lista", label: "Advogados" },
        { id: "novo", label: "Cadastrar" },
      ]}
    >
      {erro && <div className="alert alert-error">{erro}</div>}
      {mensagem && <div className="alert alert-success">{mensagem}</div>}

      {panelTab === "novo" ? (
        <form className="form-grid" onSubmit={handleAdvogado}>
          <div className="form-field full">
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Cadastre um novo advogado no escritório. Ele poderá acessar o sistema
              com o e-mail e senha definidos aqui.
            </p>
          </div>
          <div className="form-field">
            <label>Nome</label>
            <input
              value={formAdvogado.nome}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, nome: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>E-mail</label>
            <input
              type="email"
              value={formAdvogado.email}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, email: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>Senha</label>
            <input
              type="password"
              value={formAdvogado.senha}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, senha: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>OAB</label>
            <input
              value={formAdvogado.oab}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, oab: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>Especialidade</label>
            <input
              value={formAdvogado.especialidade}
              onChange={(e) =>
                setFormAdvogado({
                  ...formAdvogado,
                  especialidade: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="form-field full">
            <button className="btn btn-primary">Cadastrar advogado</button>
          </div>
        </form>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>OAB</th>
                <th>Especialidade</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan="4">Carregando...</td>
                </tr>
              )}
              {!carregando &&
                advogados.map((adv) => (
                  <tr key={adv.id}>
                    <td>{adv.nome}</td>
                    <td>{adv.email}</td>
                    <td>{adv.oab}</td>
                    <td>{adv.especialidade}</td>
                  </tr>
                ))}
              {!carregando && advogados.length === 0 && (
                <tr>
                  <td colSpan="4">Nenhum advogado cadastrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </OverlayPanel>
  );
}
