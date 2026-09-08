"use client";

import { useEffect, useState } from "react";
import { usePanel, PANELS } from "@/contexts/PanelContext";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import Avatar from "@/components/ui/Avatar";
import { getUsuarioLogado, registrarAdvogado, getAdvogados, normalizarLista } from "@/services/api";

const FORM_ADVOGADO_INICIAL = {
  nome: "",
  email: "",
  senha: "",
  oab: "",
  especialidade: "",
};

export default function AdvogadosPanel() {
  const { activePanel, panelTab } = usePanel();
  const { refresh: refreshDashboard } = useDashboardData();
  const { t } = usePreferences();
  const usuario = getUsuarioLogado();
  const [advogados, setAdvogados] = useState([]);
  const [formAdvogado, setFormAdvogado] = useState(FORM_ADVOGADO_INICIAL);
  const [foto, setFoto] = useState(null);
  const [documentoIdentidade, setDocumentoIdentidade] = useState(null);
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
      const payload = new FormData();
      Object.entries(formAdvogado).forEach(([campo, valor]) => payload.append(campo, valor));
      if (foto) payload.append("foto", foto);
      if (documentoIdentidade) payload.append("documento_identidade", documentoIdentidade);

      await registrarAdvogado(payload);
      setMensagem("Advogado cadastrado com sucesso.");
      setFormAdvogado(FORM_ADVOGADO_INICIAL);
      setFoto(null);
      setDocumentoIdentidade(null);
      await carregarAdvogados();
      refreshDashboard().catch(() => {});
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
        { id: "lista", label: t("nav_advogados") },
        { id: "novo", label: t("aba_novo") },
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
          <div className="form-field">
            <label>Foto (opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
            />
          </div>
          <div className="form-field">
            <label>Documento (RG/CPF/CNH) — opcional</label>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setDocumentoIdentidade(e.target.files?.[0] || null)}
            />
          </div>
          <div className="form-field full">
            <button className="btn btn-primary">{t("acao_cadastrar_advogado")}</button>
          </div>
        </form>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>OAB</th>
                <th>Especialidade</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan="5">Carregando...</td>
                </tr>
              )}
              {!carregando &&
                advogados.map((adv) => (
                  <tr key={adv.id}>
                    <td><Avatar src={adv.foto} nome={adv.nome} /></td>
                    <td>{adv.nome}</td>
                    <td>{adv.email}</td>
                    <td>{adv.oab}</td>
                    <td>{adv.especialidade}</td>
                  </tr>
                ))}
              {!carregando && advogados.length === 0 && (
                <tr>
                  <td colSpan="5">Nenhum advogado cadastrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </OverlayPanel>
  );
}
