"use client";

import { Fragment, useEffect, useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import { useDashboardData } from "@/contexts/DashboardDataContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import {
  getContratos,
  createContrato,
  deleteContrato,
  updateParcela,
  getProcessos,
  normalizarLista,
} from "@/services/api";

const formularioInicial = {
  processo: "",
  tipo_honorario: "fixo",
  valor_total: "",
  forma_pagamento: "avista",
  numero_parcelas: 1,
  observacoes: "",
};

function formatarMoeda(valor) {
  const numero = Number(valor || 0);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ContratosPanel() {
  const { activePanel, panelTab } = usePanel();
  const { refresh: refreshDashboard } = useDashboardData();
  const { t } = usePreferences();
  const [contratos, setContratos] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [contratoExpandido, setContratoExpandido] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    try {
      setCarregando(true);
      const [dadosContratos, dadosProcessos] = await Promise.all([
        getContratos(),
        getProcessos(),
      ]);
      setContratos(normalizarLista(dadosContratos));
      setProcessos(normalizarLista(dadosProcessos));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (activePanel === "contratos") {
      carregarDados();
    }
  }, [activePanel]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    try {
      setSalvando(true);
      await createContrato({
        ...formulario,
        processo: Number(formulario.processo),
        numero_parcelas:
          formulario.forma_pagamento === "parcelado"
            ? Number(formulario.numero_parcelas)
            : 1,
      });
      setFormulario(formularioInicial);
      await carregarDados();
      refreshDashboard().catch(() => {});
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function handleMarcarPago(parcelaId) {
    await updateParcela(parcelaId, { status: "pago" });
    carregarDados();
  }

  if (activePanel !== "contratos") return null;

  return (
    <OverlayPanel
      tabs={[
        { id: "lista", label: t("aba_lista") },
        { id: "novo", label: t("aba_novo") },
      ]}
    >
      {erro && <div className="alert alert-error">{erro}</div>}

      {panelTab === "novo" ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Processo</label>
            <select
              value={formulario.processo}
              onChange={(e) =>
                setFormulario({ ...formulario, processo: e.target.value })
              }
              required
            >
              <option value="">Selecione</option>
              {processos.map((processo) => (
                <option key={processo.id} value={processo.id}>
                  {processo.numero_processo} — {processo.titulo}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Tipo de honorário</label>
            <select
              value={formulario.tipo_honorario}
              onChange={(e) =>
                setFormulario({ ...formulario, tipo_honorario: e.target.value })
              }
            >
              <option value="fixo">Valor fixo</option>
              <option value="exito">Percentual de êxito</option>
              <option value="hora">Por hora trabalhada</option>
            </select>
          </div>
          <div className="form-field">
            <label>Valor total (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formulario.valor_total}
              onChange={(e) =>
                setFormulario({ ...formulario, valor_total: e.target.value })
              }
              required
            />
          </div>
          <div className="form-field">
            <label>Forma de pagamento</label>
            <select
              value={formulario.forma_pagamento}
              onChange={(e) =>
                setFormulario({ ...formulario, forma_pagamento: e.target.value })
              }
            >
              <option value="avista">À vista</option>
              <option value="parcelado">Parcelado</option>
            </select>
          </div>
          {formulario.forma_pagamento === "parcelado" && (
            <div className="form-field">
              <label>Número de parcelas</label>
              <input
                type="number"
                min="2"
                max="60"
                value={formulario.numero_parcelas}
                onChange={(e) =>
                  setFormulario({ ...formulario, numero_parcelas: e.target.value })
                }
                required
              />
            </div>
          )}
          <div className="form-field full">
            <label>Observações</label>
            <textarea
              value={formulario.observacoes}
              onChange={(e) =>
                setFormulario({ ...formulario, observacoes: e.target.value })
              }
            />
          </div>
          <div className="form-field full">
            <button className="btn btn-primary" disabled={salvando}>
              {salvando ? t("acao_salvando") : t("acao_cadastrar_contrato")}
            </button>
          </div>
        </form>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Processo</th>
                <th>Cliente</th>
                <th>Valor total</th>
                <th>Pago</th>
                <th>Pendente</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan="7">Carregando...</td>
                </tr>
              )}
              {!carregando &&
                contratos.map((contrato) => (
                  <Fragment key={contrato.id}>
                    <tr>
                      <td>{contrato.numero_processo}</td>
                      <td>{contrato.cliente_nome}</td>
                      <td>{formatarMoeda(contrato.valor_total)}</td>
                      <td>{formatarMoeda(contrato.valor_pago)}</td>
                      <td>{formatarMoeda(contrato.valor_pendente)}</td>
                      <td>
                        <span className="badge badge-muted">{contrato.status}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              setContratoExpandido(
                                contratoExpandido === contrato.id ? null : contrato.id
                              )
                            }
                          >
                            {contratoExpandido === contrato.id ? "Ocultar parcelas" : "Ver parcelas"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={async () => {
                              if (window.confirm("Excluir contrato?")) {
                                await deleteContrato(contrato.id);
                                carregarDados();
                                refreshDashboard().catch(() => {});
                              }
                            }}
                          >
                            {t("acao_excluir")}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {contratoExpandido === contrato.id && (
                      <tr>
                        <td colSpan="7">
                          <table style={{ width: "100%" }}>
                            <thead>
                              <tr>
                                <th>Parcela</th>
                                <th>Valor</th>
                                <th>Vencimento</th>
                                <th>Status</th>
                                <th>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {contrato.parcelas.map((parcela) => (
                                <tr key={parcela.id}>
                                  <td>{parcela.numero}</td>
                                  <td>{formatarMoeda(parcela.valor)}</td>
                                  <td>
                                    {new Date(
                                      `${parcela.data_vencimento}T00:00:00`
                                    ).toLocaleDateString("pt-BR")}
                                  </td>
                                  <td>
                                    <span
                                      className={`badge ${
                                        parcela.status === "pago"
                                          ? "badge-success"
                                          : "badge-muted"
                                      }`}
                                    >
                                      {parcela.status === "pago" ? "Pago" : "Pendente"}
                                    </span>
                                  </td>
                                  <td>
                                    {parcela.status !== "pago" && (
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleMarcarPago(parcela.id)}
                                      >
                                        {t("acao_marcar_pago")}
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </OverlayPanel>
  );
}
