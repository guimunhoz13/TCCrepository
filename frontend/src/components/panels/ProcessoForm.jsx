"use client";

import { AREAS_DIREITO } from "@/lib/areaDireito";
import { formatarMoeda } from "@/utils/formato";

/** Campos de um processo, compartilhados entre "Novo processo" e a edição
 * de um processo já existente — a mesma ficha de dados nos dois casos,
 * só o que acontece ao salvar muda. */
export default function ProcessoForm({
  formulario,
  setFormulario,
  clientes,
  advogados,
  onSubmit,
  salvando,
  submitLabel,
  onCancelar,
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <div className="form-field">
        <label>Número do processo</label>
        <input
          value={formulario.numero_processo}
          onChange={(e) =>
            setFormulario({ ...formulario, numero_processo: e.target.value })
          }
          required
        />
      </div>
      <div className="form-field">
        <label>Título</label>
        <input
          value={formulario.titulo}
          onChange={(e) => setFormulario({ ...formulario, titulo: e.target.value })}
          required
        />
      </div>
      <div className="form-field full">
        <label>Descrição</label>
        <textarea
          value={formulario.descricao}
          onChange={(e) => setFormulario({ ...formulario, descricao: e.target.value })}
          required
        />
      </div>
      <div className="form-field">
        <label>Cliente</label>
        <select
          value={formulario.cliente}
          onChange={(e) => setFormulario({ ...formulario, cliente: e.target.value })}
          required
        >
          <option value="">Selecione</option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>Advogado</label>
        <select
          value={formulario.advogado}
          onChange={(e) => setFormulario({ ...formulario, advogado: e.target.value })}
          required
        >
          <option value="">Selecione</option>
          {advogados.map((adv) => (
            <option key={adv.id} value={adv.id}>
              {adv.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>Status</label>
        <select
          value={formulario.status}
          onChange={(e) => setFormulario({ ...formulario, status: e.target.value })}
        >
          <option value="Em andamento">Em andamento</option>
          <option value="Concluido">Concluído</option>
          <option value="Suspenso">Suspenso</option>
          <option value="Arquivado">Arquivado</option>
        </select>
      </div>
      <div className="form-field">
        <label>Data início</label>
        <input
          type="date"
          value={formulario.data_inicio}
          onChange={(e) => setFormulario({ ...formulario, data_inicio: e.target.value })}
        />
      </div>
      <div className="form-field">
        <label>Data fim</label>
        <input
          type="date"
          value={formulario.data_fim}
          onChange={(e) => setFormulario({ ...formulario, data_fim: e.target.value })}
        />
      </div>

      <div className="form-field full">
        <label style={{ marginTop: 8 }}>Dados jurídicos adicionais</label>
      </div>
      <div className="form-field">
        <label>Área do direito</label>
        <select
          value={formulario.area_direito}
          onChange={(e) => setFormulario({ ...formulario, area_direito: e.target.value })}
        >
          <option value="">Não informado</option>
          {AREAS_DIREITO.map((area) => (
            <option key={area.value} value={area.value}>
              {area.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-field">
        <label>Vara</label>
        <input
          value={formulario.vara}
          onChange={(e) => setFormulario({ ...formulario, vara: e.target.value })}
          placeholder="Ex.: 3ª Vara Cível"
        />
      </div>
      <div className="form-field">
        <label>Comarca</label>
        <input
          value={formulario.comarca}
          onChange={(e) => setFormulario({ ...formulario, comarca: e.target.value })}
        />
      </div>
      <div className="form-field">
        <label>Valor da causa (R$)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={formulario.valor_causa}
          onChange={(e) => setFormulario({ ...formulario, valor_causa: e.target.value })}
        />
      </div>
      <div className="form-field">
        <label>Parte contrária</label>
        <input
          value={formulario.nome_parte_contraria}
          onChange={(e) =>
            setFormulario({ ...formulario, nome_parte_contraria: e.target.value })
          }
        />
      </div>
      <div className="form-field">
        <label>Advogado adverso</label>
        <input
          value={formulario.nome_advogado_adverso}
          onChange={(e) =>
            setFormulario({ ...formulario, nome_advogado_adverso: e.target.value })
          }
        />
      </div>
      <div className="form-field">
        <label>OAB do advogado adverso</label>
        <input
          value={formulario.oab_advogado_adverso}
          onChange={(e) =>
            setFormulario({ ...formulario, oab_advogado_adverso: e.target.value })
          }
          placeholder="123456/SP"
        />
      </div>
      <div className="form-field">
        <label>% Honorários de sucumbência</label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="100"
          value={formulario.percentual_honorarios_sucumbencia}
          onChange={(e) =>
            setFormulario({
              ...formulario,
              percentual_honorarios_sucumbencia: e.target.value,
            })
          }
          placeholder="Ex.: 10 (fixado pelo juízo)"
        />
        {formulario.valor_causa && formulario.percentual_honorarios_sucumbencia && (
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 6 }}>
            Estimativa: {formatarMoeda(
              (Number(formulario.valor_causa) * Number(formulario.percentual_honorarios_sucumbencia)) / 100
            )}
          </p>
        )}
      </div>

      <div className="form-sticky-footer">
        {onCancelar && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancelar}
            disabled={salvando}
          >
            Cancelar
          </button>
        )}
        <button className="btn btn-primary" disabled={salvando}>
          {salvando ? "Salvando..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
