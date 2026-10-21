"use client";

import { useCallback, useMemo, useState } from "react";
import { useRecurso } from "@/hooks/useRecurso";
import useFotoProtegida from "@/hooks/useFotoProtegida";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import { usePanel, PANELS } from "@/contexts/PanelContext";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import Avatar from "@/components/ui/Avatar";
import { Pencil } from "lucide-react";
import { formatarCPF, formatarRG, formatarTelefone, formatarOAB } from "@/utils/mascaras";
import { senhaAtendeRequisitos } from "@/utils/senha";
import RequisitosSenha from "@/components/ui/RequisitosSenha";
import {
  registrarAdvogado,
  updateAdvogado,
  getAdvogados,
  listarTudo,
  abrirDocumentoIdentidadeUsuario,
} from "@/services/api";
import LinhasCarregando from "@/components/ui/LinhasCarregando";
import EstadoVazio from "@/components/ui/EstadoVazio";
import OrientacaoFormulario from "@/components/ui/OrientacaoFormulario";
import { useRascunhoFormulario } from "@/hooks/useRascunhoFormulario";
import EstadoRascunho from "@/components/ui/EstadoRascunho";
import ProgressoFormulario from "@/components/ui/ProgressoFormulario";

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
  const usuario = useUsuarioLogado();
  const [formAdvogado, setFormAdvogado] = useState(FORM_ADVOGADO_INICIAL);
  const [foto, setFoto] = useState(null);
  const [documentoIdentidade, setDocumentoIdentidade] = useState(null);
  const [advogadoEditando, setAdvogadoEditando] = useState(null);
  const fotoEdicaoUrl = useFotoProtegida(advogadoEditando?.foto);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const recurso = useRecurso(() => listarTudo(getAdvogados), [], {
    ativo: activePanel === PANELS.ADVOGADOS,
  });
  const advogados = recurso.dados ?? [];
  const carregando = recurso.carregando && advogados.length === 0;
  const carregarAdvogados = recurso.recarregar;
  const dadosRascunho = useMemo(
    () => ({ ...formAdvogado, senha: "" }),
    [formAdvogado]
  );
  const restaurarRascunho = useCallback((dados) => {
    setFormAdvogado((atual) => ({ ...atual, ...dados, senha: atual.senha }));
  }, []);
  const { estadoRascunho, descartarRascunho } = useRascunhoFormulario({
    chave: "novo-advogado",
    ativo: activePanel === PANELS.ADVOGADOS && panelTab === "novo" && !advogadoEditando,
    valor: dadosRascunho,
    setValor: restaurarRascunho,
    valorInicial: FORM_ADVOGADO_INICIAL,
  });

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
    setPanelTab("editar");
  }

  function handleCancelarEdicao() {
    setAdvogadoEditando(null);
    setFormAdvogado(FORM_ADVOGADO_INICIAL);
    setFoto(null);
    setDocumentoIdentidade(null);
    setPanelTab("lista");
  }

  function handleNovoAdvogado() {
    setErro("");
    setMensagem("");
    setAdvogadoEditando(null);
    setFormAdvogado(FORM_ADVOGADO_INICIAL);
    setFoto(null);
    setDocumentoIdentidade(null);
    setPanelTab("novo");
  }

  async function handleAdvogado(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    if (!advogadoEditando && !senhaAtendeRequisitos(formAdvogado.senha)) {
      setErro("A senha não atende a todos os requisitos obrigatórios.");
      return;
    }

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
        await descartarRascunho();
        setMensagem("Advogado cadastrado com sucesso.");
      }

      setFormAdvogado(FORM_ADVOGADO_INICIAL);
      setFoto(null);
      setDocumentoIdentidade(null);
      setAdvogadoEditando(null);
      setPanelTab("lista");
      carregarAdvogados();
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
        { id: "novo", label: t("acao_cadastrar_advogado"), onClick: handleNovoAdvogado },
        ...(advogadoEditando ? [{ id: "editar", label: t("acao_editar") }] : []),
      ]}
    >
      {(erro || recurso.erro) && <div className="alert alert-error">{erro || recurso.erro}</div>}
      {mensagem && <div className="alert alert-success">{mensagem}</div>}

      {panelTab === "novo" || panelTab === "editar" ? (
        <form className="form-grid" onSubmit={handleAdvogado}>
          {!advogadoEditando && <EstadoRascunho mensagem={estadoRascunho} />}
          <OrientacaoFormulario
            titulo={advogadoEditando ? "Atualize o perfil profissional" : "Cadastre o acesso do advogado"}
            descricao="O e-mail será usado para entrar no sistema e a OAB também poderá ser usada para buscar intimações do DJEN."
            etapas={["Acesso", "Dados profissionais", "Identificação opcional"]}
          />
          <ProgressoFormulario
            itens={[
              { rotulo: "Nome", concluido: Boolean(formAdvogado.nome.trim()) },
              { rotulo: "E-mail", concluido: Boolean(formAdvogado.email.trim()) },
              ...(!advogadoEditando
                ? [{ rotulo: "Senha segura", concluido: senhaAtendeRequisitos(formAdvogado.senha) }]
                : []),
              { rotulo: "OAB", concluido: Boolean(formAdvogado.oab.trim()) },
            ]}
          />
          {!advogadoEditando && (
            <p className="field-hint" style={{ gridColumn: "1 / -1" }}>
              A senha e os arquivos nunca entram no rascunho; por segurança, informe-os ao concluir.
            </p>
          )}
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
              name="nome"
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
              name="email"
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
                name="senha"
                type="password"
                value={formAdvogado.senha}
                onChange={(e) =>
                  setFormAdvogado({ ...formAdvogado, senha: e.target.value })
                }
                required
              />
              <RequisitosSenha senha={formAdvogado.senha} />
            </div>
          )}
          <div className="form-field">
            <label>Telefone</label>
            <input
              name="telefone"
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
              name="oab"
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
              name="especialidade"
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
              name="cpf"
              value={formAdvogado.cpf}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, cpf: formatarCPF(e.target.value) })
              }
            />
          </div>
          <div className="form-field">
            <label>RG</label>
            <input
              name="rg"
              value={formAdvogado.rg}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, rg: formatarRG(e.target.value) })
              }
            />
          </div>
          <div className="form-field">
            <label>Data de nascimento</label>
            <input
              name="data_nascimento"
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
              name="estado_civil"
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
              name="nacionalidade"
              value={formAdvogado.nacionalidade}
              onChange={(e) =>
                setFormAdvogado({ ...formAdvogado, nacionalidade: e.target.value })
              }
            />
          </div>
          <div className="form-field">
            <label>Foto (opcional)</label>
            {fotoEdicaoUrl && !foto && (
              <img src={fotoEdicaoUrl} alt="" className="avatar-preview" />
            )}
            <input
              name="foto"
              type="file"
              accept="image/*"
              onChange={(e) => setFoto(e.target.files?.[0] || null)}
            />
          </div>
          <div className="form-field">
            <label>Documento (RG/CPF/CNH) — opcional</label>
            {advogadoEditando?.documento_identidade_enviado && !documentoIdentidade && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ marginBottom: 8, alignSelf: "flex-start" }}
                onClick={() =>
                  abrirDocumentoIdentidadeUsuario(advogadoEditando.usuario).catch((error) =>
                    setErro(error.message)
                  )
                }
              >
                Ver documento atual
              </button>
            )}
            <input
              name="documento_identidade"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setDocumentoIdentidade(e.target.files?.[0] || null)}
            />
          </div>
          <div
            className="form-field full"
            style={{ display: "flex", gap: "10px", marginTop: "8px" }}
          >
            <button
              className="btn btn-primary"
              disabled={
                salvando ||
                (!advogadoEditando && !senhaAtendeRequisitos(formAdvogado.senha))
              }
            >
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
              {carregando && <LinhasCarregando colunas={6} />}
              {!carregando &&
                advogados.map((adv) => (
                  <tr key={adv.id}>
                    <td><Avatar src={adv.foto} nome={adv.nome} /></td>
                    <td>{adv.nome}</td>
                    <td>{adv.email}</td>
                    <td>{adv.oab}</td>
                    <td>{adv.especialidade}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="row-action"
                          title={t("acao_editar")}
                          aria-label={t("acao_editar")}
                          onClick={() => handleIniciarEdicao(adv)}
                        >
                          <Pencil size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!carregando && advogados.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <EstadoVazio
                      titulo="Cadastre o primeiro advogado"
                      descricao="Defina os dados profissionais e o acesso ao sistema."
                      acao="Cadastrar advogado"
                      onAcao={handleNovoAdvogado}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </OverlayPanel>
  );
}
