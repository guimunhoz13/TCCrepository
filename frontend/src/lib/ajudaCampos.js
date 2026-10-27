/**
 * Dicas curtas para campos cujo significado, formato ou efeito não é óbvio.
 *
 * Elas são aplicadas pelo RotulosAutomaticos a qualquer formulário que use o
 * padrão `.form-field`. O texto fica visível e também entra no
 * `aria-describedby` do campo, então a mesma orientação chega a quem usa
 * leitor de tela. Campos evidentes, como Nome, não recebem texto redundante.
 */
export const DICAS_CAMPOS = {
  nome: "Informe o nome completo, como deve aparecer nas fichas e documentos.",
  "razão social": "Informe o nome empresarial registrado no CNPJ.",
  título: "Use um título curto e fácil de localizar nas buscas e listas.",
  descrição: "Explique o contexto necessário para que outra pessoa entenda este registro.",
  detalhes: "Acrescente informações úteis para quem for executar ou consultar este registro.",
  "detalhes (opcional)": "Acrescente informações úteis para quem receber a tarefa.",
  status: "Escolha a situação atual; ela controla filtros, indicadores e ações disponíveis.",
  "número do processo":
    "Informe a numeração única do CNJ, no formato 0000000-00.0000.0.00.0000.",
  processo: "Escolha o processo ao qual este registro ficará vinculado.",
  cliente: "Escolha a pessoa ou empresa representada pelo escritório.",
  advogado: "Escolha quem será o principal responsável pelo acompanhamento.",
  "advogado responsável": "Escolha quem será o principal responsável pelo acompanhamento.",
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
  cnpj: "Informe as 14 posições do CNPJ, com números ou letras e os dois dígitos finais. Confira os dados públicos preenchidos antes de salvar.",
  cep: "Digite os 8 números para buscar rua, bairro, cidade e estado.",
  "e-mail": "Informe um endereço válido que a pessoa realmente consulte.",
  telefone: "Informe o número com DDD; ele também pode ser usado para abrir uma conversa no WhatsApp.",
  endereço: "Informe logradouro, número, complemento, bairro, cidade e estado quando disponíveis.",
  cidade: "Informe a cidade vinculada ao endereço.",
  "estado (uf)": "Use a sigla de duas letras, como SP, RJ ou MG.",
  "data de nascimento": "Use a data registrada no documento da pessoa.",
  rg: "Informe somente quando necessário para documentos ou identificação.",
  "estado civil": "Selecione a situação civil atual da pessoa.",
  nacionalidade: "Informe a nacionalidade que deve aparecer nos documentos gerados.",
  "foto (opcional)": "Envie uma foto para facilitar a identificação visual no sistema.",
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
  tipo: "Escolha a categoria que melhor representa este registro.",
  local: "Informe endereço, sala ou link da reunião, se houver.",
  "data de início": "Data em que o acompanhamento ou a atuação começou.",
  "data de encerramento": "Preencha somente quando a atuação estiver concluída.",
  responsável: "Pessoa que receberá e acompanhará esta tarefa.",
  "prazo (opcional)": "Data-limite da tarefa. Sem data, ela aparecerá depois das tarefas com prazo.",
  "nome do arquivo": "Nome amigável exibido na lista. Se ficar vazio, será usado o nome do arquivo enviado.",
  arquivo: "Envie PDF, DOC, DOCX, JPG ou PNG, com até 10 MB.",
  observações: "Registre condições ou informações complementares do acordo.",
  "valor total (r$)": "Informe o valor total combinado no contrato de honorários.",
  "tipo de honorário": "Indica como o valor foi combinado: fixo, êxito, mensal ou outra modalidade.",
  "forma de pagamento": "Define se o valor será cobrado à vista ou dividido em parcelas.",
  "número de parcelas": "O sistema criará este número de cobranças a partir do valor total.",
  "valor por hora (opcional)": "Se ficar vazio, o lançamento registra o tempo sem calcular cobrança.",
  horas: "Informe somente as horas inteiras; use o campo Minutos para completar o tempo.",
  minutos: "Informe de 0 a 59 minutos adicionais.",
  data: "Data em que o trabalho, gasto ou evento ocorreu.",
  "o que foi feito": "Descreva a atividade realizada de forma clara para o relatório do cliente.",
  valor: "Informe o valor efetivamente pago ou lançado.",
  faturável: "Escolha Sim quando essas horas poderão ser cobradas do cliente.",
  "reembolsável pelo cliente": "Escolha Sim quando o escritório adiantou um custo que deverá ser devolvido.",
  "chave pix": "Informe a chave que receberá as cobranças geradas pelo LexNexo.",
  "nome do recebedor (até 25 letras)": "Nome que aparecerá para o cliente ao conferir o PIX.",
  "cidade (até 15 letras)": "Cidade do recebedor exigida no código PIX; não use acentos especiais.",
  "perfil de acesso": "O perfil define quais áreas e ações esta pessoa poderá usar.",
  "fuso horário": "Usado para exibir corretamente audiências, prazos e registros de atividade.",
  oab: "Informe número e UF, por exemplo: 123456/SP. É usada também na busca de intimações.",
  especialidade: "Informe a principal área de atuação do profissional.",
  "nome do modelo": "Use um nome que deixe claro quando este modelo deve ser utilizado.",
  conteúdo: "Escreva o texto do documento e insira variáveis para preencher dados automaticamente.",
  modelo: "Escolha o texto-base que será preenchido com os dados cadastrados.",
  "preencher a partir de": "Escolha se os dados virão de um processo ou diretamente de um cliente.",
  "nome do escritório": "Informe o nome que será exibido no sistema e nos relatórios.",
  "nome do admin": "Nome da primeira pessoa responsável pela administração do escritório.",
  "senha do admin": "Crie uma senha exclusiva que cumpra todos os requisitos mostrados abaixo.",
  "documento (rg/cpf/cnh) — opcional": "Arquivo privado de identificação do profissional.",
  "onde vale (opcional)":
    "Deixe vazio para todo o escritório ou informe a comarca ou tribunal, como Araçatuba ou TJSP.",
  "repete todo ano":
    "Marque para feriados que ocorrem na mesma data todos os anos; não marque para suspensões pontuais.",
};

export function normalizarRotulo(texto) {
  return (texto || "")
    .replace(/\s*\((obrigatório|required)\)\s*/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}
