"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRecurso } from "@/hooks/useRecurso";
import { useAvisos } from "@/contexts/AvisosContext";
import { useConfirmacao } from "@/contexts/ConfirmacaoContext";
import { usePermissoes } from "@/hooks/usePermissoes";
import { criarFeriadoLocal, excluirFeriadoLocal, getFeriadosLocais, normalizarLista } from "@/services/api";
import { formatarData } from "@/utils/formato";

const VAZIO = { data: "", descricao: "", abrangencia: "", anual: false };

/** "09/07/2026" ou, para o que repete todo ano, "09/07 (todo ano)". */
export function descreverData(feriado) {
  const completa = formatarData(feriado.data);
  return feriado.anual ? `${completa.slice(0, 5)} (todo ano)` : completa;
}

/**
 * Feriados municipais, estaduais e suspensões de expediente do tribunal.
 * O sistema já conhece os feriados nacionais e o recesso forense; estes
 * variam por comarca e são cadastrados pelo escritório, para entrar no
 * cálculo de prazos da agenda e das intimações.
 */
export default function AgendaFeriados() {
  const avisar = useAvisos();
  const confirmar = useConfirmacao();
  const pode = usePermissoes();
  const feriados = useRecurso(getFeriadosLocais);
  const [formulario, setFormulario] = useState(VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const lista = normalizarLista(feriados.dados);

  async function salvar(evento) {
    evento.preventDefault();
    setErro("");
    try {
      setSalvando(true);
      await criarFeriadoLocal(formulario);
      setFormulario(VAZIO);
      feriados.recarregar();
      avisar("Feriado local cadastrado para os próximos cálculos na abrangência informada.");
    } catch (falha) {
      setErro(falha.message);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(feriado) {
    const ok = await confirmar({
      titulo: "Excluir feriado local?",
      mensagem: `${descreverData(feriado)} — ${feriado.descricao} deixa de contar nos prazos calculados daqui em diante. Prazos já lançados na agenda não mudam.`,
    });
    if (!ok) return;
    try {
      await excluirFeriadoLocal(feriado.id);
      feriados.recarregar();
    } catch (falha) {
      avisar(falha.message, "erro");
    }
  }

  return (
    <div className="settings-stack">
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
        Os feriados nacionais e o recesso de 20/12 a 20/01 já entram no cálculo. Cadastre aqui os
        feriados da sua comarca e as suspensões de expediente do tribunal. Deixe “Onde vale” vazio
        para aplicar a todo o escritório; informe uma comarca ou sigla do tribunal para limitar o cálculo.
        Na calculadora, selecione o processo para aplicar os feriados da comarca. No DJEN, a comarca
        do processo e o tribunal da publicação são considerados automaticamente.
      </p>

      {(erro || feriados.erro) && (
        <div className="alert alert-error" role="alert">{erro || feriados.erro}</div>
      )}

      {pode("agenda", "criar") && (
        <form className="form-grid" onSubmit={salvar} aria-label="Novo feriado local">
          <div className="form-field">
            <label htmlFor="feriado-data">Data</label>
            <input
              id="feriado-data"
              type="date"
              required
              value={formulario.data}
              onChange={(e) => setFormulario({ ...formulario, data: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="feriado-descricao">Descrição</label>
            <input
              id="feriado-descricao"
              required
              maxLength={120}
              placeholder="Ex.: Aniversário da cidade"
              value={formulario.descricao}
              onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label htmlFor="feriado-abrangencia">Onde vale (opcional)</label>
            <input
              id="feriado-abrangencia"
              maxLength={120}
              placeholder="Ex.: Araçatuba ou TJSP"
              value={formulario.abrangencia}
              onChange={(e) => setFormulario({ ...formulario, abrangencia: e.target.value })}
            />
          </div>
          <div className="form-field" style={{ justifyContent: "flex-end" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 400, marginBottom: 12 }}>
              <input
                type="checkbox"
                style={{ width: "auto" }}
                checked={formulario.anual}
                onChange={(e) => setFormulario({ ...formulario, anual: e.target.checked })}
              />
              Repete todo ano
            </label>
          </div>
          <div className="form-field full" style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Cadastrar feriado"}
            </button>
          </div>
        </form>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Onde vale</th>
              {pode("agenda", "excluir") && <th aria-label="Ações" />}
            </tr>
          </thead>
          <tbody>
            {lista.map((feriado) => (
              <tr key={feriado.id}>
                <td data-label="Data">{descreverData(feriado)}</td>
                <td data-label="Descrição">{feriado.descricao}</td>
                <td data-label="Onde vale">{feriado.abrangencia || "—"}</td>
                {pode("agenda", "excluir") && (
                  <td>
                    <button
                      type="button"
                      className="row-action row-action-danger"
                      title="Excluir"
                      aria-label={`Excluir o feriado ${feriado.descricao}`}
                      onClick={() => excluir(feriado)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {!feriados.carregando && lista.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-state">
                  Nenhum feriado local cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
