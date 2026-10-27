"use client";

import { Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import Janela from "@/components/ui/Janela";
import { useRecurso } from "@/hooks/useRecurso";
import { useAvisos } from "@/contexts/AvisosContext";
import { getPixDaParcela, simularPixDaParcela } from "@/services/api";
import { abrirWhatsApp } from "@/utils/whatsapp";
import { formatarMoeda } from "@/utils/formato";

export function montarMensagemPix(pix) {
  if (pix.modo === "teste") return "Demonstração do LexNexo. Este código não pode ser pago e não deve ser enviado como cobrança.";
  const vencimento = new Date(`${pix.data_vencimento}T00:00:00`).toLocaleDateString("pt-BR");
  return [
    `Olá, ${pix.cliente_nome.split(" ")[0]}!`,
    `Segue o PIX da parcela ${pix.numero}/${pix.total_parcelas} dos honorários (processo ${pix.numero_processo}),`,
    `no valor de ${formatarMoeda(pix.valor)}, com vencimento em ${vencimento}.`,
    "",
    "PIX copia e cola:",
    pix.payload,
  ].join("\n");
}

/** QR code e "copia e cola" do PIX de uma parcela, pronto para mandar ao cliente. */
export default function PixDaParcela({ parcelaId, onFechar }) {
  const avisar = useAvisos();
  const [modo, setModo] = useState("teste");
  const [simulacao, setSimulacao] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const recurso = useRecurso(() => getPixDaParcela(parcelaId, modo), [parcelaId, modo]);
  // Não deixa copiar um código real antigo durante a troca para teste.
  const pix = !recurso.carregando && recurso.dados?.modo === modo ? recurso.dados : null;

  async function confirmarTeste() {
    if (confirmando) return;
    setConfirmando(true);
    try {
      const resposta = await simularPixDaParcela(parcelaId, pix.payload);
      setSimulacao(resposta.detail);
    } catch (erro) {
      avisar(erro.message || "Não foi possível simular. Tente novamente.", "erro");
    } finally {
      setConfirmando(false);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.payload);
      avisar(modo === "teste" ? "Código de teste copiado. Não é pagável em bancos." : "Código PIX copiado.");
    } catch {
      avisar("Não deu para copiar automaticamente. Selecione o código e copie.", "erro");
    }
  }

  return (
    <Janela titulo="Cobrar com PIX" onFechar={onFechar}>
      <label className="dica-campo" htmlFor="pix-modo">Tipo de operação</label>
      <select id="pix-modo" className="pix-modo" value={modo} disabled={confirmando} onChange={(e) => { setModo(e.target.value); setSimulacao(""); }}>
        <option value="teste">Teste — sem movimentar dinheiro</option>
        <option value="real">Pix real — cobrança do cliente</option>
      </select>
      <p className="dica-campo">
        {modo === "teste"
          ? "Ambiente de demonstração do LexNexo, não um sandbox bancário. Teste a confirmação abaixo; este QR não funciona no app do banco e não altera seu financeiro."
          : "Atenção: este é um Pix real. Se o cliente confirmar no banco, haverá transferência de dinheiro."}
      </p>
      {recurso.carregando && <p className="dica-campo">Gerando o PIX…</p>}
      {recurso.erro && <div className="alert alert-error">{recurso.erro}</div>}
      {pix && (
        <div className="pix">
          <img src={pix.qr_code} alt={`${modo === "teste" ? "QR de demonstração não pagável" : "QR code PIX"} de ${formatarMoeda(pix.valor)}`} />
          <p className="pix-valor">{formatarMoeda(pix.valor)}</p>
          <p className="dica-campo" style={{ marginTop: 0 }}>
            Parcela {pix.numero}/{pix.total_parcelas} · {pix.cliente_nome} · vence em{" "}
            {new Date(`${pix.data_vencimento}T00:00:00`).toLocaleDateString("pt-BR")}
            <br />
            Recebedor: {pix.recebedor}
          </p>
          <textarea
            className="campo-link"
            aria-label={modo === "teste" ? "Código de teste não pagável" : "PIX copia e cola"}
            readOnly
            rows={3}
            value={pix.payload}
            onFocus={(e) => e.target.select()}
          />
          <div className="export-row" style={{ justifyContent: "center" }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={copiar}>
              <Copy size={14} /> {modo === "teste" ? "Copiar código de teste" : "Copiar código"}
            </button>
            {pix.cliente_telefone && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => abrirWhatsApp(pix.cliente_telefone, montarMensagemPix(pix))}
              >
                <MessageCircle size={14} /> Enviar pelo WhatsApp
              </button>
            )}
          </div>
          {modo === "teste" && (
            simulacao
              ? <div className="alert alert-success" role="status">{simulacao}</div>
              : <button type="button" className="btn btn-primary" onClick={confirmarTeste} disabled={confirmando}>
                  {confirmando ? "Simulando…" : "Simular pagamento aprovado"}
                </button>
          )}
          <p className="dica-campo">
            {modo === "teste" ? "A confirmação é apenas demonstrativa e desaparece ao fechar a janela. A parcela real permanece como estava."
              : "PIX estático: o banco não avisa o sistema do pagamento. Quando o dinheiro cair, marque a parcela como paga."}
          </p>
        </div>
      )}
    </Janela>
  );
}
