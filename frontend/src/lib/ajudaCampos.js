/**
 * Dicas curtas para campos cujo significado, formato ou efeito não é óbvio.
 *
 * Elas são aplicadas pelo RotulosAutomaticos a qualquer formulário que use o
 * padrão `.form-field`. O texto fica visível e também entra no
 * `aria-describedby` do campo, então a mesma orientação chega a quem usa
 * leitor de tela. Campos evidentes, como Nome, não recebem texto redundante.
 */
export const DICAS_CAMPOS = {
  "número do processo":
    "Informe a numeração única do CNJ, no formato 0000000-00.0000.0.00.0000.",
  "área do direito":
    "Escolha a área principal do caso. Ela ajuda nos filtros e relatórios.",
  vara: "Informe a unidade judicial responsável, por exemplo: 3ª Vara Cível.",
  comarca: "Informe a cidade ou circunscrição onde o processo tramita.",
  "valor da causa (r$)":
    "Use o valor registrado no processo. Digite somente números e centavos.",
  "parte contrária": "Nome da pessoa ou empresa do outro lado do processo.",
  "advogado adverso": "Nome do advogado que representa a parte contrária.",
  "oab do advogado adverso": "Informe número e UF, por exemplo: 123456/SP.",
  "% honorários de sucumbência":
    "Percentual fixado ou esperado sobre o valor devido pela parte vencida.",
  "segredo de justiça":
    "Quando ativado, somente o administrador e o advogado responsável verão o processo.",
  "tipo de pessoa":
    "Escolha pessoa física para CPF ou pessoa jurídica para CNPJ.",
  cpf: "Digite os 11 números. Pontos e traço são adicionados automaticamente.",
  cnpj: "Digite os 14 números. Ao sair do campo, o sistema pode preencher os dados públicos da empresa.",
  cep: "Digite os 8 números para buscar rua, bairro, cidade e estado.",
  "e-mail do escritório":
    "Endereço institucional usado nos dados do escritório e nas comunicações.",
  "e-mail do admin":
    "Será o login do primeiro administrador e receberá mensagens de segurança.",
  "consentimento lgpd":
    "Marque somente quando houver uma base válida ou consentimento registrado para tratar os dados.",
  "processo (opcional)":
    "Vincule quando este registro pertence a um processo específico; caso contrário, deixe em branco.",
  prioridade: "Define a ordem de atenção: alta aparece antes das demais.",
  "data da intimação ou referência (dia excluído)":
    "É o dia inicial da contagem. O sistema começa a contar no próximo dia útil.",
  "quantidade de dias": "Informe o prazo previsto na lei ou na intimação.",
  contagem: "Escolha dias úteis para prazos processuais ou corridos quando a regra exigir.",
  "data e hora": "Momento em que o compromisso acontece ou o prazo vence.",
  responsável: "Pessoa que receberá e acompanhará esta tarefa.",
  "prazo (opcional)": "Data-limite da tarefa. Sem data, ela aparecerá depois das tarefas com prazo.",
  "nome do arquivo": "Nome amigável exibido na lista. Se ficar vazio, será usado o nome do arquivo enviado.",
  arquivo: "Envie PDF, DOC, DOCX, JPG ou PNG, com até 10 MB.",
  "tipo de honorário": "Indica como o valor foi combinado: fixo, êxito, mensal ou outra modalidade.",
  "forma de pagamento": "Define se o valor será cobrado à vista ou dividido em parcelas.",
  "número de parcelas": "O sistema criará este número de cobranças a partir do valor total.",
  "valor por hora (opcional)": "Se ficar vazio, o lançamento registra o tempo sem calcular cobrança.",
  faturável: "Escolha Sim quando essas horas poderão ser cobradas do cliente.",
  "reembolsável pelo cliente": "Escolha Sim quando o escritório adiantou um custo que deverá ser devolvido.",
  "chave pix": "Informe a chave que receberá as cobranças geradas pelo LexNexo.",
  "nome do recebedor (até 25 letras)": "Nome que aparecerá para o cliente ao conferir o PIX.",
  "cidade (até 15 letras)": "Cidade do recebedor exigida no código PIX; não use acentos especiais.",
  "perfil de acesso": "O perfil define quais áreas e ações esta pessoa poderá usar.",
  "fuso horário": "Usado para exibir corretamente audiências, prazos e registros de atividade.",
  oab: "Informe número e UF, por exemplo: 123456/SP. É usada também na busca de intimações.",
  "documento (rg/cpf/cnh) — opcional": "Arquivo privado de identificação do profissional.",
};

export function normalizarRotulo(texto) {
  return (texto || "")
    .replace(/\s*\((obrigatório|required)\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}
