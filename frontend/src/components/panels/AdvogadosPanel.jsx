"use client";

import { useEffect, useState } from "react";
import { usePanel, PANELS } from "@/contexts/PanelContext";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import Avatar from "@/components/ui/Avatar";
import { formatarCPF, formatarRG, formatarTelefone, formatarOAB } from "@/utils/mascaras";
import {
  getUsuarioLogado,
  registrarAdvogado,
  updateAdvogado,
  getAdvogados,
  normalizarLista,
} from "@/services/api";

const FORM_ADVOGADO_INICIAL = {
  nome: "",
  email: "",
  senha: "",
  telefone: "",
  oab: "",
  especialidade: "",
  cpf: "",
  rg: "",
  data_nascimento: "",
  estado_civil: "",
  nacionalidade: "Brasileira",
};

const ESTADOS_CIVIS = [
  { value: "", label: "Selecione" },
  { value: "solteiro", label: "Solteiro(a)" },
  { value: "casado", label: "Casado(a)" },
  { value: "divorciado", label: "Divorciado(a)" },
  { value: "viuvo", label: "Viúvo(a)" },
  { value: "uniao_estavel", label: "União estável" },
];

export default function AdvogadosPanel() {
  const { activePanel, panelTab, setPanelTab } = usePanel();
  const { refresh: refreshDashboard } = useDashboardData();
  const { t } = usePreferences();
  const usuario = getUsuarioLogado();
  const [advogados, setAdvogados] = useState([]);
  const [formAdvogado, setFormAdvogado] = useState(FORM_ADVOGADO_INICIAL);
  const [foto, setFoto] = useState(null);
  const [documentoIdentidade, setDocumentoIdentidade] = useState(null);
  const [advogadoEditando, setAdvogadoEditando] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

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

  function handleIniciarEdicao(advogado) {
    setErro("");
    setMensagem("");
    setAdvogadoEditando(advogado);
    setFormAdvogado({
      nome: advogado.nome || "",
      email: advogado.email || "",
      senha: "",
      telefone: advogado.telefone ? formatarTelefone(advogado.telefone) : "",
      oab: advogado.oab ? formatarOAB(advogado.oab) : "",
      especialidade: advogado.especialidade || "",
      cpf: advogado.cpf ? formatarCPF(advogado.cpf) : "",
      rg: advogado.rg ? formatarRG(advogado.rg) : "",
      data_nascimento: advogado.data_nascimento
        ? advogado.data_nascimento.slice(0, 10)
        : "",
      estado_civil: advogado.estado_civil || "",
      nacionalidade: advogado.nacionalidade || "Brasileira",
    });
    setFoto(null);
    setDocumentoIdentidade(null);
    setPanelTab("novo");
  }

  function handleCancelarEdicao() {
    setAdvogadoEditando(null);
    setFormAdvogado(FORM_ADVOGADO_INICIAL);
    setFoto(null);
    setDocumentoIdentidade(null);
    setPanelTab("lista");
  }

  async function handleAdvogado(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");
    setSalvando(true);

    try {
      const payload = new FormData();
      Object.entries(formAdvogado).forEach(([campo, valor]) => {
        if (campo === "senha" && advogadoEditando) return;
        payload.append(campo, valor);
      });
      if (foto) payload.append("foto", foto);
      if (documentoIdentidade) payload.append("documento_identidade", documentoIdentidade);

      if (advogadoEditando) {
        await updateAdvogado(advogadoEditando.id, payload);
        setMensagem("Advogado atualizado com sucesso.");
      } else {
        await registrarAdvogado(payload);
        setMensagem("Advogado cadastrado com sucesso.");
      }

      setFormAdvogado(FORM_ADVOGADO_INICIAL);
      setFoto(null);
      setDocumentoIdentidade(null);
      setAdvogadoEditando(null);
      setPanelTab("lista");
      await carregarAdvogados();
      refreshDashboard().catch(() => {});
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
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
        {
          id: "novo",
          label: advogadoEditando ? t("acao_editar") : t("aba_novo"),
        },
      ]}
    >
      {erro && <div className="alert alert-error">{erro}</div>}
      {mensagem && <div className="alert alert-success">{mensagem}</div>}

      {panelTab === "novo" ? (
        <form className="form-grid" onSubmit={handleAdvogado}>
          <div className="form-field full">
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {advogadoEditando
                ? "Atualize os dados do advogado."
                : "Cadastre um novo advogado no escritório. Ele poderá acessar o sistema com o e-mail e senha definidos aqui."}
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
              disabled={!!advogadoEditando}
              required
            />
          </div>
          {!advogadoEditando && (
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
          )}
          <div className="form-field">
            <label>Telefone</label>
            <input
              value={formAdvogado.telefone}
              onChange={(e) =>
                setFormAdvogado({
                  ...formAdvogado,
                  telefone: formatarTelefone(e.target.value),
                })
              }
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="form-field">
            <label>OAB</label>
            <input
              value={formAdvogado.oab}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, oab: formatarOAB(e.target.value) })
              }
              placeholder="123456/SP"
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
            <label>CPF</label>
            <input
              value={formAdvogado.cpf}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, cpf: formatarCPF(e.target.value) })
              }
            />
          </div>
          <div className="form-field">
            <label>RG</label>
            <input
              value={formAdvogado.rg}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, rg: formatarRG(e.target.value) })
              }
            />
          </div>
          <div className="form-field">
            <label>Data de nascimento</label>
            <input
              type="date"
              value={formAdvogado.data_nascimento}
              onChange={(e) =>
                setFormAdvogado({
                  ...formAdvogado,
                  data_nascimento: e.target.value,
                })
              }
            />
          </div>
          <div className="form-field">
            <label>Estado civil</label>
            <select
              value={formAdvogado.estado_civil}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, estado_civil: e.target.value })
              }
            >
              {ESTADOS_CIVIS.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Nacionalidade</label>
            <input
              value={formAdvogado.nacionalidade}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, nacionalidade: e.target.value })
              }
            />
          </div>
          <div className="form-field">
            <label>Foto (opcional)</label>
            {advogadoEditando?.foto && !foto && (
              <img src={advogadoEditando.foto} alt="" className="avatar-preview" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
            />
          </div>
          <div className="form-field">
            <label>Documento (RG/CPF/CNH) — opcional</label>
            {advogadoEditando?.documento_identidade && !documentoIdentidade && (
              <a
                href={advogadoEditando.documento_identidade}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: 8, alignSelf: "flex-start" }}
              >
                Ver documento atual
              </a>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setDocumentoIdentidade(e.target.files?.[0] || null)}
            />
          </div>
          <div
            className="form-field full"
            style={{ display: "flex", gap: "10px", marginTop: "8px" }}
          >
            <button className="btn btn-primary" disabled={salvando}>
              {salvando
                ? t("acao_salvando")
                : advogadoEditando
                ? t("acao_salvar_alteracoes")
                : t("acao_cadastrar_advogado")}
            </button>
            {advogadoEditando && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelarEdicao}
                disabled={salvando}
              >
                {t("acao_cancelar")}
              </button>
            )}
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
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan="6">Carregando...</td>
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
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleIniciarEdicao(adv)}
                      >
                        {t("acao_editar")}
                      </button>
                    </td>
                  </tr>
                ))}
              {!carregando && advogados.length === 0 && (
                <tr>
                  <td colSpan="6">Nenhum advogado cadastrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </OverlayPanel>
  );
}
