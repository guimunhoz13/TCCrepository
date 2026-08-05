"use client";

import { useEffect, useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import {
  getDocumentos,
  createDocumento,
  deleteDocumento,
  getProcessos,
  normalizarLista,
} from "@/services/api";

export default function DocumentosPanel() {
  const { activePanel, panelTab } = usePanel();
  const [documentos, setDocumentos] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [processoId, setProcessoId] = useState("");
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [arquivo, setArquivo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarDados() {
    try {
      setCarregando(true);
      const [dadosDocumentos, dadosProcessos] = await Promise.all([
        getDocumentos(),
        getProcessos(),
      ]);
      setDocumentos(normalizarLista(dadosDocumentos));
      setProcessos(normalizarLista(dadosProcessos));
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    if (activePanel === "documentos") {
      carregarDados();
    }
  }, [activePanel]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!arquivo) {
      setErro("Selecione um arquivo.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("processo", processoId);
      formData.append("nome_arquivo", nomeArquivo || arquivo.name);
      formData.append("arquivo", arquivo);

      await createDocumento(formData);
      setProcessoId("");
      setNomeArquivo("");
      setArquivo(null);
      await carregarDados();
    } catch (error) {
      setErro(error.message);
    }
  }

  if (activePanel !== "documentos") return null;

  return (
    <OverlayPanel
      tabs={[
        { id: "lista", label: "Arquivos" },
        { id: "novo", label: "Enviar documento" },
      ]}
    >
      {erro && <div className="alert alert-error">{erro}</div>}

      {panelTab === "novo" ? (
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Processo</label>
            <select
              value={processoId}
              onChange={(e) => setProcessoId(e.target.value)}
              required
            >
              <option value="">Selecione</option>
              {processos.map((processo) => (
                <option key={processo.id} value={processo.id}>
                  {processo.numero_processo}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Nome do arquivo</label>
            <input
              value={nomeArquivo}
              onChange={(e) => setNomeArquivo(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="form-field full">
            <label>Arquivo</label>
            <input
              type="file"
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              required
            />
          </div>
          <div className="form-field full">
            <button className="btn btn-primary">Enviar documento</button>
          </div>
        </form>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Arquivo</th>
                <th>Processo</th>
                <th>Enviado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && (
                <tr>
                  <td colSpan="4">Carregando...</td>
                </tr>
              )}
              {!carregando &&
                documentos.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.nome_arquivo}</td>
                    <td>{doc.numero_processo}</td>
                    <td>
                      {new Date(doc.enviado_em).toLocaleString("pt-BR")}
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          if (window.confirm("Excluir documento?")) {
                            await deleteDocumento(doc.id);
                            carregarDados();
                          }
                        }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </OverlayPanel>
  );
}
