/** Busca global do topo do sistema.
 *
 * Fica separada do componente porque decidir o que casa com o termo é
 * lógica, não interface: dá para testar sem montar nada na tela.
 *
 * Toda a busca é local, sobre o que a dashboard já carregou. Isso mantém
 * o resultado instantâneo e não gera requisição a cada tecla — a
 * contrapartida é que ela enxerga apenas o que está em memória.
 */

import { Briefcase, CalendarDays, FileSignature, FileText, ListChecks, ScrollText, Timer, User } from "lucide-react";

/** Remove acentos para que "acao" encontre "Ação". */
export function normalizar(valor) {
  return (valor || "")
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** O mínimo de letras para buscar: com uma só, tudo casa e o resultado
 *  não ajuda ninguém. */
export const MINIMO_CARACTERES = 2;

/** Quantos resultados por grupo. Oito grupos completos não cabem na tela. */
const POR_GRUPO = 4;

/** Os grupos, na ordem em que aparecem.
 *
 * `campos` são os campos consultados; `titulo` e `detalhe` montam a linha
 * do resultado; `painel` é o painel que abre ao escolher.
 */
export const GRUPOS_BUSCA = [
  {
    chave: "clientes",
    rotulo: "Clientes",
    painel: "clientes",
    icone: User,
    campos: ["nome", "cpf", "email", "telefone"],
    titulo: (c) => c.nome,
    detalhe: (c) => c.cpf || c.email || "",
  },
  {
    chave: "processos",
    rotulo: "Processos",
    painel: "processos",
    icone: Briefcase,
    campos: ["numero_processo", "titulo", "cliente_nome"],
    titulo: (p) => p.numero_processo,
    detalhe: (p) => p.titulo,
  },
  {
    chave: "tarefas",
    rotulo: "Tarefas",
    painel: "tarefas",
    icone: ListChecks,
    campos: ["titulo", "descricao", "responsavel_nome", "numero_processo"],
    titulo: (t) => t.titulo,
    detalhe: (t) => t.responsavel_nome || "",
  },
  {
    chave: "agenda",
    rotulo: "Agenda",
    painel: "agenda",
    icone: CalendarDays,
    campos: ["titulo", "descricao", "local_evento", "numero_processo", "cliente_nome"],
    titulo: (e) => e.titulo,
    detalhe: (e) => e.numero_processo || e.local_evento || "",
  },
  {
    chave: "documentos",
    rotulo: "Documentos",
    painel: "documentos",
    icone: FileText,
    campos: ["nome_arquivo", "numero_processo"],
    titulo: (d) => d.nome_arquivo,
    detalhe: (d) => d.numero_processo || "",
  },
  {
    chave: "contratos",
    rotulo: "Contratos",
    painel: "contratos",
    icone: ScrollText,
    campos: ["numero_processo", "processo_titulo", "cliente_nome"],
    titulo: (c) => c.numero_processo,
    detalhe: (c) => c.cliente_nome || c.processo_titulo || "",
  },
  {
    chave: "apontamentos",
    rotulo: "Horas apontadas",
    painel: "horas",
    icone: Timer,
    campos: ["descricao", "numero_processo", "usuario_nome"],
    titulo: (a) => a.descricao,
    detalhe: (a) => a.numero_processo || "",
  },
  {
    chave: "modelos",
    rotulo: "Modelos de documento",
    painel: "modelos",
    icone: FileSignature,
    campos: ["nome", "tipo_display", "conteudo"],
    titulo: (m) => m.nome,
    detalhe: (m) => m.tipo_display || "",
  },
];

function casa(item, campos, alvo) {
  return campos.some((campo) => normalizar(item?.[campo]).includes(alvo));
}

/** Procura o termo em todas as coleções e devolve os grupos com resultado.
 *
 * `colecoes` é um objeto com as listas já carregadas, indexado pela chave
 * do grupo. Uma coleção ausente simplesmente não produz resultado — a
 * busca não quebra por causa de uma aba que ainda não carregou.
 */
export function buscarEmTudo(termo, colecoes = {}) {
  const alvo = normalizar((termo || "").trim());
  if (alvo.length < MINIMO_CARACTERES) return [];

  return GRUPOS_BUSCA.map((grupo) => {
    const itens = (colecoes[grupo.chave] || [])
      .filter((item) => casa(item, grupo.campos, alvo))
      .slice(0, POR_GRUPO);
    return itens.length > 0 ? { ...grupo, itens } : null;
  }).filter(Boolean);
}

/** Quantos resultados ao todo, para decidir entre a lista e o "nada
 *  encontrado". */
export function contarResultados(grupos) {
  return grupos.reduce((total, grupo) => total + grupo.itens.length, 0);
}
