"use client";

import { useState } from "react";
import Janela from "@/components/ui/Janela";
import { useRecurso } from "@/hooks/useRecurso";
import { getPixTestePlano, simularPixPlano } from "@/services/api";
import { formatarMoeda } from "@/utils/formato";

export default function PixTestePlano({ plano, onFechar }) {
  const recurso = useRecurso(() => getPixTestePlano(plano.id), [plano.id]);
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const pix = recurso.dados;

  async function simular() {
    if (enviando) return;
    setEnviando(true);
    setErro("");
    try {
      const resposta = await simularPixPlano(plano.id, pix.payload);
      setConfirmacao(resposta.detail);
    } catch (falha) {
      setErro(falha.message || "Não foi possível simular. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Janela titulo={`Testar Pix do plano ${plano.nome}`} onFechar={onFechar}>
      <div className="alert alert-warning">Demonstração sem valor financeiro. Não é uma contratação nem um sandbox bancário.</div>
      <p className="dica-campo">O QR abaixo é exclusivo do simulador LexNexo: não pode ser pago no banco. Confirmar o teste não muda seu plano, não libera recursos pagos e não gera cobrança.</p>
      {(recurso.erro || erro) && <div className="alert alert-error" role="alert">{recurso.erro || erro}</div>}
      {recurso.carregando && <p role="status">Preparando demonstração…</p>}
      {pix && <div className="pix">
        <img src={pix.qr_code} alt="QR de demonstração de assinatura, não pagável" />
        <p className="pix-valor">{formatarMoeda(pix.valor)} / mês (simulado)</p>
        <textarea className="campo-link" aria-label="Código de teste da assinatura" readOnly rows={3} value={pix.payload} />
        {confirmacao
          ? <div className="alert alert-success" role="status">{confirmacao}</div>
          : <button type="button" className="btn btn-primary" disabled={enviando} onClick={simular}>{enviando ? "Simulando…" : "Simular assinatura aprovada"}</button>}
      </div>}
    </Janela>
  );
}
