"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { AREAS_DIREITO } from "@/lib/areaDireito";
import { formatarMoeda } from "@/utils/formato";
import EstadoRascunho from "@/components/ui/EstadoRascunho";

const CAMPOS_OBRIGATORIOS = [
  "numero_processo",
  "titulo",
  "descricao",
  "cliente",
  "advogado",
];

function CampoErro({ campo, errosCampos, prefixo }) {
  const mensagem = errosCampos?.[campo];
  if (!mensagem) return null;
  return (
    <p
      id={`${prefixo}-${campo}-erro`}
      className="field-error field-error-api"
      role="alert"
    >
      {mensagem}
    </p>
  );
}

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
  errosCampos = {},
  onLimparErroCampo,
  estadoRascunho,
}) {
  const formRef = useRef(null);
  const prefixo = `processo-${useId().replace(/:/g, "")}`;

  const obrigatoriosPreenchidos = useMemo(
    () =>
      CAMPOS_OBRIGATORIOS.filter((campo) =>
        String(formulario[campo] ?? "").trim()
      ).length,
    [formulario]
  );

  const etapaIdentificacaoCompleta = ["numero_processo", "titulo", "descricao"].every(
    (campo) => String(formulario[campo] ?? "").trim()
  );
  const etapaPessoasCompleta = ["cliente", "advogado"].every((campo) =>
    String(formulario[campo] ?? "").trim()
  );

  function atualizar(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
    onLimparErroCampo?.(campo);
  }

  function idsDescritivos(campo) {
    return [
      `${prefixo}-${campo}-ajuda`,
      errosCampos[campo] ? `${prefixo}-${campo}-erro` : null,
    ]
      .filter(Boolean)
      .join(" ");
  }

  function atributosCampo(campo) {
    return {
      id: `${prefixo}-${campo}`,
      name: campo,
      "aria-describedby": idsDescritivos(campo),
      "aria-invalid": errosCampos[campo] ? "true" : undefined,
    };
  }

  function irParaSecao(secao) {
    const elemento = document.getElementById(`${prefixo}-${secao}`);
    elemento?.scrollIntoView({ behavior: "smooth", block: "start" });
    elemento
      ?.querySelector("input:not([type='hidden']), select, textarea")
      ?.focus({ preventScroll: true });
  }

  useEffect(() => {
    const formularioAtual = formRef.current;
    if (!formularioAtual) return;
    const primeiroCampoComErro = Object.keys(errosCampos).find((campo) =>
      formularioAtual.elements.namedItem(campo)
    );
    if (!primeiroCampoComErro) return;

    const campo = formularioAtual.elements.namedItem(primeiroCampoComErro);
    campo?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    campo?.focus?.({ preventScroll: true });
  }, [errosCampos]);

  return (
    <form
      ref={formRef}
      className="processo-form"
      data-erros-controlados="true"
      onSubmit={onSubmit}
    >
      <EstadoRascunho mensagem={estadoRascunho} />
      <header className="processo-form-guia">
        <div className="processo-form-guia-texto">
          <span className="processo-form-sobretitulo">
            {onCancelar ? "Edição orientada" : "Cadastro guiado"}
          </span>
          <h3>{onCancelar ? "Revise os dados do processo" : "Cadastre o processo por etapas"}</h3>
          <p>
            Os cinco campos obrigatórios bastam para salvar. Os demais deixam a ficha,
            os relatórios e as automações mais completos.
          </p>
        </div>
        <div className="processo-form-progresso">
          <strong>
            {obrigatoriosPreenchidos} de {CAMPOS_OBRIGATORIOS.length} obrigatórios
          </strong>
          <progress
            value={obrigatoriosPreenchidos}
            max={CAMPOS_OBRIGATORIOS.length}
            aria-label={`${obrigatoriosPreenchidos} de ${CAMPOS_OBRIGATORIOS.length} campos obrigatórios preenchidos`}
          />
          <span>
            {obrigatoriosPreenchidos === CAMPOS_OBRIGATORIOS.length
              ? "Pronto para salvar"
              : "Você pode completar os opcionais depois"}
          </span>
        </div>
      </header>

      <nav className="processo-etapas" aria-label="Etapas do cadastro do processo">
        <button
          type="button"
          className={etapaIdentificacaoCompleta ? "processo-etapa concluida" : "processo-etapa"}
          onClick={() => irParaSecao("identificacao")}
          aria-controls={`${prefixo}-identificacao`}
        >
          <span className="processo-etapa-numero" aria-hidden="true">1</span>
          <span><strong>Identificação</strong><small>Dados básicos do caso</small></span>
        </button>
        <button
          type="button"
          className={etapaPessoasCompleta ? "processo-etapa concluida" : "processo-etapa"}
          onClick={() => irParaSecao("pessoas")}
          aria-controls={`${prefixo}-pessoas`}
        >
          <span className="processo-etapa-numero" aria-hidden="true">2</span>
          <span><strong>Pessoas</strong><small>Cliente e responsáveis</small></span>
        </button>
        <button
          type="button"
          className="processo-etapa"
          onClick={() => irParaSecao("tribunal-valores")}
          aria-controls={`${prefixo}-tribunal-valores`}
        >
          <span className="processo-etapa-numero" aria-hidden="true">3</span>
          <span><strong>Tribunal e valores</strong><small>Detalhes opcionais</small></span>
        </button>
      </nav>

      <fieldset id={`${prefixo}-identificacao`} className="processo-secao">
        <legend><span>1</span> Identificação do processo</legend>
        <p className="processo-secao-descricao">
          Informe como o caso será reconhecido na busca, nas tarefas e nos relatórios.
        </p>
        <div className="form-grid">
          <div className={`form-field ${errosCampos.numero_processo ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-numero_processo`}>Número do processo</label>
            <p id={`${prefixo}-numero_processo-ajuda`} className="field-hint">
              Use a numeração CNJ, se já existir. Ex.: 0001234-56.2026.8.26.0100.
            </p>
            <input
              {...atributosCampo("numero_processo")}
              value={formulario.numero_processo}
              onChange={(e) => atualizar("numero_processo", e.target.value)}
              placeholder="0001234-56.2026.8.26.0100"
              required
            />
            <CampoErro campo="numero_processo" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.titulo ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-titulo`}>Título</label>
            <p id={`${prefixo}-titulo-ajuda`} className="field-hint">
              Um nome curto para localizar o caso rapidamente. Ex.: Cobrança de contrato.
            </p>
            <input
              {...atributosCampo("titulo")}
              value={formulario.titulo}
              onChange={(e) => atualizar("titulo", e.target.value)}
              placeholder="Ex.: Cobrança de contrato"
              required
            />
            <CampoErro campo="titulo" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field full ${errosCampos.descricao ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-descricao`}>Descrição</label>
            <p id={`${prefixo}-descricao-ajuda`} className="field-hint">
              Resuma o pedido, o contexto e o objetivo. Não inclua senhas nem dados desnecessários.
            </p>
            <textarea
              {...atributosCampo("descricao")}
              value={formulario.descricao}
              onChange={(e) => atualizar("descricao", e.target.value)}
              placeholder="Descreva brevemente o caso e o resultado esperado"
              required
            />
            <CampoErro campo="descricao" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.status ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-status`}>Status</label>
            <p id={`${prefixo}-status-ajuda`} className="field-hint">
              Indica a situação atual e alimenta os filtros e gráficos do escritório.
            </p>
            <select
              {...atributosCampo("status")}
              value={formulario.status}
              onChange={(e) => atualizar("status", e.target.value)}
            >
              <option value="Em andamento">Em andamento</option>
              <option value="Concluido">Concluído</option>
              <option value="Suspenso">Suspenso</option>
              <option value="Arquivado">Arquivado</option>
            </select>
            <CampoErro campo="status" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
        </div>
        <div className="processo-secao-acoes">
          <button type="button" className="btn btn-secondary" onClick={() => irParaSecao("pessoas")}>
            Continuar para pessoas
          </button>
        </div>
      </fieldset>

      <fieldset id={`${prefixo}-pessoas`} className="processo-secao">
        <legend><span>2</span> Pessoas envolvidas</legend>
        <p className="processo-secao-descricao">
          Relacione o cliente e quem será responsável pelo acompanhamento do caso.
        </p>
        <div className="form-grid">
          <div className={`form-field ${errosCampos.cliente ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-cliente`}>Cliente</label>
            <p id={`${prefixo}-cliente-ajuda`} className="field-hint">
              Pessoa ou empresa representada pelo escritório. Cadastre-a primeiro em Clientes.
            </p>
            <select
              {...atributosCampo("cliente")}
              value={formulario.cliente}
              onChange={(e) => atualizar("cliente", e.target.value)}
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>
              ))}
            </select>
            <CampoErro campo="cliente" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.advogado ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-advogado`}>Advogado responsável</label>
            <p id={`${prefixo}-advogado-ajuda`} className="field-hint">
              Receberá o vínculo principal e terá acesso ao processo se houver sigilo.
            </p>
            <select
              {...atributosCampo("advogado")}
              value={formulario.advogado}
              onChange={(e) => atualizar("advogado", e.target.value)}
              required
            >
              <option value="">Selecione um advogado</option>
              {advogados.map((adv) => (
                <option key={adv.id} value={adv.id}>{adv.nome}</option>
              ))}
            </select>
            <CampoErro campo="advogado" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.nome_parte_contraria ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-nome_parte_contraria`}>Parte contrária</label>
            <p id={`${prefixo}-nome_parte_contraria-ajuda`} className="field-hint">
              Nome da pessoa ou empresa do outro lado do processo.
            </p>
            <input
              {...atributosCampo("nome_parte_contraria")}
              value={formulario.nome_parte_contraria}
              onChange={(e) => atualizar("nome_parte_contraria", e.target.value)}
              placeholder="Nome completo ou razão social"
            />
            <CampoErro campo="nome_parte_contraria" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.nome_advogado_adverso ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-nome_advogado_adverso`}>Advogado da parte contrária</label>
            <p id={`${prefixo}-nome_advogado_adverso-ajuda`} className="field-hint">
              Preencha quando essa informação estiver disponível nos autos.
            </p>
            <input
              {...atributosCampo("nome_advogado_adverso")}
              value={formulario.nome_advogado_adverso}
              onChange={(e) => atualizar("nome_advogado_adverso", e.target.value)}
              placeholder="Nome do advogado adverso"
            />
            <CampoErro campo="nome_advogado_adverso" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.oab_advogado_adverso ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-oab_advogado_adverso`}>OAB do advogado adverso</label>
            <p id={`${prefixo}-oab_advogado_adverso-ajuda`} className="field-hint">
              Informe o número e o estado, como 123456/SP.
            </p>
            <input
              {...atributosCampo("oab_advogado_adverso")}
              value={formulario.oab_advogado_adverso}
              onChange={(e) => atualizar("oab_advogado_adverso", e.target.value)}
              placeholder="123456/SP"
            />
            <CampoErro campo="oab_advogado_adverso" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
        </div>
        <div className="processo-secao-acoes">
          <button type="button" className="btn btn-secondary" onClick={() => irParaSecao("tribunal-valores")}>
            Continuar para tribunal e valores
          </button>
        </div>
      </fieldset>

      <fieldset id={`${prefixo}-tribunal-valores`} className="processo-secao">
        <legend><span>3</span> Tribunal, datas e valores</legend>
        <p className="processo-secao-descricao">
          Estes campos são opcionais, mas ajudam nos relatórios financeiros e no acompanhamento jurídico.
        </p>
        <div className="form-grid">
          <div className={`form-field ${errosCampos.data_inicio ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-data_inicio`}>Data de início</label>
            <p id={`${prefixo}-data_inicio-ajuda`} className="field-hint">
              Data em que o escritório começou a atuar no caso.
            </p>
            <input
              {...atributosCampo("data_inicio")}
              type="date"
              value={formulario.data_inicio}
              onChange={(e) => atualizar("data_inicio", e.target.value)}
            />
            <CampoErro campo="data_inicio" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.data_fim ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-data_fim`}>Data de encerramento</label>
            <p id={`${prefixo}-data_fim-ajuda`} className="field-hint">
              Use somente quando a atuação ou o processo estiver encerrado.
            </p>
            <input
              {...atributosCampo("data_fim")}
              type="date"
              value={formulario.data_fim}
              onChange={(e) => atualizar("data_fim", e.target.value)}
            />
            <CampoErro campo="data_fim" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.area_direito ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-area_direito`}>Área do direito</label>
            <p id={`${prefixo}-area_direito-ajuda`} className="field-hint">
              Classifica o caso para filtros e indicadores do escritório.
            </p>
            <select
              {...atributosCampo("area_direito")}
              value={formulario.area_direito}
              onChange={(e) => atualizar("area_direito", e.target.value)}
            >
              <option value="">Não informado</option>
              {AREAS_DIREITO.map((area) => (
                <option key={area.value} value={area.value}>{area.label}</option>
              ))}
            </select>
            <CampoErro campo="area_direito" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.vara ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-vara`}>Vara ou órgão julgador</label>
            <p id={`${prefixo}-vara-ajuda`} className="field-hint">
              Unidade responsável pelo julgamento. Ex.: 3ª Vara Cível.
            </p>
            <input
              {...atributosCampo("vara")}
              value={formulario.vara}
              onChange={(e) => atualizar("vara", e.target.value)}
              placeholder="Ex.: 3ª Vara Cível"
            />
            <CampoErro campo="vara" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.comarca ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-comarca`}>Comarca</label>
            <p id={`${prefixo}-comarca-ajuda`} className="field-hint">
              Cidade ou circunscrição em que o processo tramita.
            </p>
            <input
              {...atributosCampo("comarca")}
              value={formulario.comarca}
              onChange={(e) => atualizar("comarca", e.target.value)}
              placeholder="Ex.: São Paulo/SP"
            />
            <CampoErro campo="comarca" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.valor_causa ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-valor_causa`}>Valor da causa (R$)</label>
            <p id={`${prefixo}-valor_causa-ajuda`} className="field-hint">
              Digite apenas o valor numérico informado no processo.
            </p>
            <input
              {...atributosCampo("valor_causa")}
              type="number"
              step="0.01"
              min="0"
              value={formulario.valor_causa}
              onChange={(e) => atualizar("valor_causa", e.target.value)}
              placeholder="0,00"
            />
            <CampoErro campo="valor_causa" errosCampos={errosCampos} prefixo={prefixo} />
          </div>
          <div className={`form-field ${errosCampos.percentual_honorarios_sucumbencia ? "form-field-invalid" : ""}`}>
            <label htmlFor={`${prefixo}-percentual_honorarios_sucumbencia`}>
              Honorários de sucumbência (%)
            </label>
            <p id={`${prefixo}-percentual_honorarios_sucumbencia-ajuda`} className="field-hint">
              Percentual fixado ou estimado sobre o valor da causa, entre 0 e 100.
            </p>
            <input
              {...atributosCampo("percentual_honorarios_sucumbencia")}
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formulario.percentual_honorarios_sucumbencia}
              onChange={(e) => atualizar("percentual_honorarios_sucumbencia", e.target.value)}
              placeholder="Ex.: 10"
            />
            {formulario.valor_causa && formulario.percentual_honorarios_sucumbencia && (
              <p className="processo-estimativa">
                Estimativa: {formatarMoeda(
                  (Number(formulario.valor_causa) * Number(formulario.percentual_honorarios_sucumbencia)) / 100
                )}
              </p>
            )}
            <CampoErro campo="percentual_honorarios_sucumbencia" errosCampos={errosCampos} prefixo={prefixo} />
          </div>

          <label className="campo-marcar full">
            <input
              name="sigiloso"
              type="checkbox"
              checked={Boolean(formulario.sigiloso)}
              onChange={(e) => atualizar("sigiloso", e.target.checked)}
            />
            <span>
              <strong>Segredo de justiça</strong>
              <small>
                Ative somente quando houver sigilo. O processo e seus dados ficam visíveis apenas
                para o administrador e o advogado responsável.
              </small>
            </span>
          </label>
        </div>
      </fieldset>

      <div className="form-sticky-footer processo-form-rodape">
        <p aria-live="polite">
          <strong>{obrigatoriosPreenchidos}/{CAMPOS_OBRIGATORIOS.length}</strong>
          <span> campos obrigatórios preenchidos</span>
        </p>
        <div className="processo-form-rodape-acoes">
          {onCancelar && (
            <button type="button" className="btn btn-secondary" onClick={onCancelar} disabled={salvando}>
              Cancelar
            </button>
          )}
          <button className="btn btn-primary" disabled={salvando}>
            {salvando ? "Salvando..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}
