import { Cloud, ShieldCheck } from "lucide-react";

export default function EstadoRascunho({ mensagem }) {
  if (!mensagem) return null;
  const salvo = /salvo|restaurado/i.test(mensagem);
  const Icone = salvo ? ShieldCheck : Cloud;
  return (
    <div className="estado-rascunho" role="status" aria-live="polite">
      <Icone size={15} aria-hidden="true" />
      <span>{mensagem}</span>
    </div>
  );
}
