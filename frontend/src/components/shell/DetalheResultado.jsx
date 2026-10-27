"use client";

import { useRecurso } from "@/hooks/useRecurso";
import { getRegistroDaBusca, abrirDocumento } from "@/services/api";
import { usePanel, PANELS } from "@/contexts/PanelContext";
import { useAvisos } from "@/contexts/AvisosContext";

const CAMPOS = {
  clientes: [["nome", "Nome"], ["cpf", "CPF"], ["cnpj", "CNPJ"], ["email", "E-mail"], ["telefone", "Telefone"], ["endereco", "Endereço"]],
  tarefas: [["titulo", "Tarefa"], ["descricao", "Descrição"], ["status", "Situação"], ["responsavel_nome", "Responsável"], ["prazo", "Prazo"], ["prioridade", "Prioridade"]],
  agenda: [["titulo", "Compromisso ou prazo"], ["descricao", "Descrição"], ["data_evento", "Data e hora"], ["local_evento", "Local"], ["numero_processo", "Processo"]],
  documentos: [["nome_arquivo", "Documento"], ["numero_processo", "Processo"], ["enviado_em", "Enviado em"]],
  contratos: [["numero_processo", "Processo"], ["cliente_nome", "Cliente"], ["valor_total", "Valor contratado"], ["status", "Situação"]],
  horas: [["descricao", "Atividade"], ["numero_processo", "Processo"], ["data", "Data"], ["minutos", "Minutos"], ["valor_hora", "Valor por hora"]],
  modelos: [["nome", "Modelo"], ["tipo_display", "Tipo"], ["conteudo", "Conteúdo"]],
};

function exibir(campo, valor) {
  if (valor === null || valor === undefined || valor === "") return "Não informado";
  if (["data_evento", "enviado_em"].includes(campo)) return new Date(valor).toLocaleString("pt-BR");
  if (["prazo", "data"].includes(campo)) return new Date(`${valor}T00:00:00`).toLocaleDateString("pt-BR");
  if (["valor_total", "valor_hora"].includes(campo)) return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return String(valor);
}

export default function DetalheResultado({ painel, registroId }) {
  const { openPanel } = usePanel();
  const avisar = useAvisos();
  const recurso = useRecurso(() => getRegistroDaBusca(painel, registroId), [painel, registroId]);
  if (recurso.carregando) return <p role="status">Abrindo o registro selecionado…</p>;
  if (recurso.erro) return <div className="alert alert-error" role="alert">{recurso.erro}</div>;
  const item = recurso.dados;
  if (!item) return null;
  return (
    <section className="registro-detalhe" aria-label="Registro selecionado na busca">
      <dl>{(CAMPOS[painel] || []).map(([campo, rotulo]) => (
        <div key={campo}><dt>{rotulo}</dt><dd>{exibir(campo, item[campo])}</dd></div>
      ))}</dl>
      <div className="export-row">
        {item.processo && <button type="button" className="btn btn-secondary"
          onClick={() => openPanel(PANELS.PROCESSOS, "ficha", { processoId: item.processo })}>Ver processo relacionado</button>}
        {painel === "documentos" && <button type="button" className="btn btn-primary"
          onClick={() => abrirDocumento(item.id).catch((error) => avisar(error.message, "erro"))}>Abrir documento</button>}
      </div>
    </section>
  );
}
