"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Printer, Trash2 } from "lucide-react";
import { usePanel } from "@/contexts/PanelContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import {
  getModelosDocumento,
  createModeloDocumento,
  updateModeloDocumento,
  deleteModeloDocumento,
  getVariaveisDocumento,
  gerarDocumento,
  getProcessos,
  getClientes,
  normalizarLista,
} from "@/services/api";

const TIPOS = [
  { value: "procuracao", label: "Procuração" },
  { value: "contrato", label: "Contrato de honorários" },
  { value: "declaracao", label: "Declaração" },
  { value: "peticao", label: "Petição" },
  { value: "outros", label: "Outros" },
];

const EXEMPLO_PROCURACAO = `PROCURAÇÃO AD JUDICIA

OUTORGANTE: {{cliente.nome}}, {{cliente.nacionalidade}}, {{cliente.estado_civil}}, portador(a) do RG nº {{cliente.rg}} e inscrito(a) no CPF sob o nº {{cliente.cpf}}, residente e domiciliado(a) em {{cliente.endereco}}.

OUTORGADO: {{advogado.nome}}, advogado(a) inscrito(a) na OAB sob o nº {{advogado.oab}}, com escritório profissional em {{escritorio.endereco}}.

PODERES: pelo presente instrumento particular de mandato, o outorgante nomeia e constitui o outorgado seu bastante procurador, conferindo-lhe os poderes da cláusula ad judicia et extra, para o foro em geral, em qualquer juízo, instância ou tribunal, podendo propor contra quem de direito as ações competentes e defendê-lo nas contrárias, seguindo umas e outras até final decisão.

{{data.cidade_e_data}}


_______________________________________
{{cliente.nome}}`;

const modeloInicial = { nome: "", tipo: "procuracao", conteudo: "" };

export default function ModelosPanel() {
  const { activePanel, panelTab, setPanelTab } = usePanel();
  const { t } = usePreferences();

  const [modelos, setModelos] = useState([]);
  const [variaveis, setVariaveis] = useState([]);
  const [processos, setProcessos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [formulario, setFormulario] = useState(modeloInicial);
  const [editandoId, setEditandoId] = useState(null);
  const [gerar, setGerar] = useState({ modelo: "", origem: "processo", alvo: "" });
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const ativo = activePanel === "modelos";

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [lista, vars, procs, clis] = await Promise.all([
        getModelosDocumento(),
        getVariaveisDocumento(),
        getProcessos(),
        getClientes(),
      ]);
      setModelos(normalizarLista(lista));
      setVariaveis(Array.isArray(vars) ? vars : []);
      setProcessos(normalizarLista(procs));
      setClientes(normalizarLista(clis));
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (ativo) carregar();
  }, [ativo, carregar]);

  async function salvar(evento) {
    evento.preventDefault();
    setErro("");
    try {
      if (editandoId) {
        await updateModeloDocumento(editandoId, formulario);
      } else {
        await createModeloDocumento(formulario);
      }
      setFormulario(modeloInicial);
      setEditandoId(null);
      setPanelTab("lista");
      carregar();
    } catch (e) {
      setErro(e.message);
    }
  }

  function editar(modelo) {
    setFormulario({ nome: modelo.nome, tipo: modelo.tipo, conteudo: modelo.conteudo });
    setEditandoId(modelo.id);
    setPanelTab("novo");
  }

  async function handleGerar(evento) {
    evento.preventDefault();
    setErro("");
    setResultado(null);
    try {
      const dados = await gerarDocumento(gerar.modelo, {
        processo: gerar.origem === "processo" ? gerar.alvo : null,
        cliente: gerar.origem === "cliente" ? gerar.alvo : null,
      });
      setResultado(dados);
    } catch (e) {
      setErro(e.message);
    }
  }

  function imprimir() {
    if (!resultado) return;
    const janela = window.open("", "_blank");
    if (!janela) return;
    // O documento vai como texto dentro de <pre> para preservar a formatação
    // escrita no modelo; textContent evita interpretar o conteúdo como HTML.
    const pre = janela.document.createElement("pre");
    pre.textContent = resultado.conteudo;
    pre.style.cssText =
      "font-family: Georgia, serif; font-size: 12pt; line-height: 1.6; white-space: pre-wrap; margin: 2.5cm;";
    janela.document.title = resultado.nome;
    janela.document.body.appendChild(pre);
    janela.document.close();
    janela.focus();
    janela.print();
  }

  const abas = [
    { id: "lista", label: "Modelos" },
    { id: "novo", label: editandoId ? "Editar modelo" : "Novo modelo" },
    { id: "gerar", label: "Gerar documento" },
  ];

  if (!ativo) return null;

  return (
    <OverlayPanel tabs={abas}>
      {erro && <div className="form-error">{erro}</div>}

      {panelTab === "lista" && (
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Atualizado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan="4">Carregando...</td>
              </tr>
            )}
            {!carregando && modelos.length === 0 && (
              <tr>
                <td colSpan="4">
                  Nenhum modelo cadastrado. Crie o primeiro na aba &quot;Novo modelo&quot;.
                </td>
              </tr>
            )}
            {!carregando &&
              modelos.map((modelo) => (
                <tr key={modelo.id}>
                  <td>{modelo.nome}</td>
                  <td>{modelo.tipo_display}</td>
                  <td>{new Date(modelo.atualizado_em).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="row-action"
                        title={t("acao_editar")}
                        aria-label={t("acao_editar")}
                        onClick={() => editar(modelo)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        className="row-action row-action-danger"
                        title={t("acao_excluir")}
                        aria-label={t("acao_excluir")}
                        onClick={async () => {
                          if (window.confirm(`Excluir o modelo "${modelo.nome}"?`)) {
                            await deleteModeloDocumento(modelo.id);
                            carregar();
                          }
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {panelTab === "novo" && (
        <form onSubmit={salvar}>
          <div className="form-grid">
            <div className="form-field">
              <label>Nome do modelo</label>
              <input
                required
                maxLength={120}
                value={formulario.nome}
                onChange={(e) => setFormulario({ ...formulario, nome: e.target.value })}
              />
            </div>
            <div className="form-field">
              <label>Tipo</label>
              <select
                value={formulario.tipo}
                onChange={(e) => setFormulario({ ...formulario, tipo: e.target.value })}
              >
                {TIPOS.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Conteúdo</label>
            <textarea
              required
              rows={16}
              value={formulario.conteudo}
              onChange={(e) => setFormulario({ ...formulario, conteudo: e.target.value })}
              placeholder="Escreva o texto e use as variáveis abaixo onde os dados devem entrar."
            />
          </div>

          <div className="variaveis-ajuda">
            <strong>Variáveis disponíveis</strong>
            <p>
              Clique para inserir. Ao gerar o documento, cada uma é trocada pelo dado
              cadastrado do cliente, do processo ou do escritório.
            </p>
            <div className="variaveis-lista">
              {variaveis.map((variavel) => (
                <button
                  type="button"
                  key={variavel.chave}
                  className="variavel-chip"
                  title={variavel.descricao}
                  onClick={() =>
                    setFormulario((atual) => ({
                      ...atual,
                      conteudo: `${atual.conteudo}{{${variavel.chave}}}`,
                    }))
                  }
                >
                  {`{{${variavel.chave}}}`}
                </button>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() =>
                setFormulario({
                  nome: formulario.nome || "Procuração ad judicia",
                  tipo: "procuracao",
                  conteudo: EXEMPLO_PROCURACAO,
                })
              }
            >
              Usar exemplo de procuração
            </button>
            {editandoId && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setFormulario(modeloInicial);
                  setEditandoId(null);
                }}
              >
                Cancelar edição
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editandoId ? "Salvar alterações" : "Criar modelo"}
            </button>
          </div>
        </form>
      )}

      {panelTab === "gerar" && (
        <>
          <form onSubmit={handleGerar}>
            <div className="form-grid">
              <div className="form-field">
                <label>Modelo</label>
                <select
                  required
                  value={gerar.modelo}
                  onChange={(e) => setGerar({ ...gerar, modelo: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {modelos.map((modelo) => (
                    <option key={modelo.id} value={modelo.id}>
                      {modelo.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>Preencher a partir de</label>
                <select
                  value={gerar.origem}
                  onChange={(e) => setGerar({ ...gerar, origem: e.target.value, alvo: "" })}
                >
                  <option value="processo">Um processo</option>
                  <option value="cliente">Um cliente</option>
                </select>
              </div>
              <div className="form-field">
                <label>{gerar.origem === "processo" ? "Processo" : "Cliente"}</label>
                <select
                  required
                  value={gerar.alvo}
                  onChange={(e) => setGerar({ ...gerar, alvo: e.target.value })}
                >
                  <option value="">Selecione</option>
                  {(gerar.origem === "processo" ? processos : clientes).map((item) => (
                    <option key={item.id} value={item.id}>
                      {gerar.origem === "processo"
                        ? `${item.numero_processo} — ${item.titulo}`
                        : item.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Gerar documento
              </button>
            </div>
          </form>

          {resultado && (
            <>
              {resultado.variaveis_vazias?.length > 0 && (
                <div className="alert alert-warning">
                  Sem dado cadastrado para: {resultado.variaveis_vazias.join(", ")}. O
                  documento foi gerado com esses trechos em branco.
                </div>
              )}
              {resultado.variaveis_desconhecidas?.length > 0 && (
                <div className="alert alert-error">
                  Variáveis que não existem: {resultado.variaveis_desconhecidas.join(", ")}.
                  Elas ficaram no texto como estão.
                </div>
              )}
              <div className="documento-preview">{resultado.conteudo}</div>
              <div className="form-actions">
                <button type="button" className="btn btn-primary" onClick={imprimir}>
                  <Printer size={16} />
                  Imprimir / Salvar em PDF
                </button>
              </div>
            </>
          )}
        </>
      )}
    </OverlayPanel>
  );
}
