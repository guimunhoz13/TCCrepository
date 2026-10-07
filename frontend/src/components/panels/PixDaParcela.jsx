"use client";

import { Copy, MessageCircle } from "lucide-react";
import Janela from "@/components/ui/Janela";
import { useRecurso } from "@/hooks/useRecurso";
import { useAvisos } from "@/contexts/AvisosContext";
import { getPixDaParcela } from "@/services/api";
import { abrirWhatsApp } from "@/utils/whatsapp";
import { formatarMoeda } from "@/utils/formato";

export function montarMensagemPix(pix) {
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
  const recurso = useRecurso(() => getPixDaParcela(parcelaId), [parcelaId]);
  const pix = recurso.dados;

  async function copiar() {
    try {
      await navigator.clipboard.writeText(pix.payload);
      avisar("Código PIX copiado.");
    } catch {
      avisar("Não deu para copiar automaticamente. Selecione o código e copie.", "erro");
    }
  }

  return (
    <Janela titulo="Cobrar com PIX" onFechar={onFechar}>
      {recurso.carregando && <p className="dica-campo">Gerando o PIX…</p>}
      {recurso.erro && <div className="alert alert-error">{recurso.erro}</div>}
      {pix && (
        <div className="pix">
          <img src={pix.qr_code} alt={`QR code PIX de ${formatarMoeda(pix.valor)}`} />
          <p className="pix-valor">{formatarMoeda(pix.valor)}</p>
          <p className="dica-campo" style={{ marginTop: 0 }}>
            Parcela {pix.numero}/{pix.total_parcelas} · {pix.cliente_nome} · vence em{" "}
            {new Date(`${pix.data_vencimento}T00:00:00`).toLocaleDateString("pt-BR")}
            <br />
            Recebedor: {pix.recebedor}
          </p>
          <textarea
            className="campo-link"
            aria-label="PIX copia e cola"
            readOnly
            rows={3}
            value={pix.payload}
            onFocus={(e) => e.target.select()}
          />
          <div className="export-row" style={{ justifyContent: "center" }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={copiar}>
              <Copy size={14} /> Copiar código
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
          <p className="dica-campo">
            PIX estático: o banco não avisa o sistema do pagamento. Quando o
            dinheiro cair, marque a parcela como paga.
          </p>
        </div>
      )}
    </Janela>
  );
}
