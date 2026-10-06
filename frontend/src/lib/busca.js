/** Busca global do topo do sistema.
 *
 * Quem decide o que casa com o termo é o servidor (/api/busca/, que ignora
 * acentos e procura em todo o banco, não só no que estava carregado). Aqui
 * fica só como cada área aparece: rótulo, ícone, painel e linha do
 * resultado.
 */

import { Briefcase, CalendarDays, FileSignature, FileText, ListChecks, ScrollText, Timer, User } from "lucide-react";

/** O mínimo de letras para buscar: com uma só, tudo casa e o resultado
 *  não ajuda ninguém. */
export const MINIMO_CARACTERES = 2;

/** Quantos resultados por grupo. Oito grupos completos não cabem na tela. */
const POR_GRUPO = 4;

/** Os grupos, na ordem em que aparecem.
 *
 * `titulo` e `detalhe` montam a linha do resultado; `painel` é o painel
 * que abre ao escolher.
 */
export const GRUPOS_BUSCA = [
  {
    chave: "clientes",
    rotulo: "Clientes",
    painel: "clientes",
    icone: User,
    titulo: (c) => c.nome,
    detalhe: (c) => c.cpf || c.cnpj || c.email || "",
  },
  {
    chave: "processos",
    rotulo: "Processos",
    painel: "processos",
    icone: Briefcase,
    titulo: (p) => p.numero_processo,
    detalhe: (p) => p.titulo,
  },
  {
    chave: "tarefas",
    rotulo: "Tarefas",
    painel: "tarefas",
    icone: ListChecks,
    titulo: (t) => t.titulo,
    detalhe: (t) => t.responsavel_nome || "",
  },
  {
    chave: "agenda",
    rotulo: "Agenda",
    painel: "agenda",
    icone: CalendarDays,
    titulo: (e) => e.titulo,
    detalhe: (e) => e.numero_processo || e.local_evento || "",
  },
  {
    chave: "documentos",
    rotulo: "Documentos",
    painel: "documentos",
    icone: FileText,
    titulo: (d) => d.nome_arquivo,
    detalhe: (d) => d.numero_processo || "",
  },
  {
    chave: "contratos",
    rotulo: "Contratos",
    painel: "contratos",
    icone: ScrollText,
    titulo: (c) => c.numero_processo,
    detalhe: (c) => c.cliente_nome || c.processo_titulo || "",
  },
  {
    chave: "apontamentos",
    rotulo: "Horas apontadas",
    painel: "horas",
    icone: Timer,
    titulo: (a) => a.descricao,
    detalhe: (a) => a.numero_processo || "",
  },
  {
    chave: "modelos",
    rotulo: "Modelos de documento",
    painel: "modelos",
    icone: FileSignature,
    titulo: (m) => m.nome,
    detalhe: (m) => m.tipo_display || "",
  },
];

/** Transforma a resposta do servidor ({ clientes: [...], processos: [...] })
 * nos grupos exibidos, na ordem de GRUPOS_BUSCA e só com os que têm
 * resultado. Área ausente na resposta simplesmente não aparece. */
export function agruparResultados(resposta = {}) {
  return GRUPOS_BUSCA.map((grupo) => {
    const itens = (resposta?.[grupo.chave] || []).slice(0, POR_GRUPO);
    return itens.length > 0 ? { ...grupo, itens } : null;
  }).filter(Boolean);
}

/** Quantos resultados ao todo, para decidir entre a lista e o "nada
 *  encontrado". */
export function contarResultados(grupos) {
  return grupos.reduce((total, grupo) => total + grupo.itens.length, 0);
}
