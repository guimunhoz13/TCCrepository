"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

const AvisosContext = createContext(null);

const DURACAO_MS = 4500;

/**
 * Avisos rápidos no canto da tela ("Processo excluído.", "Não foi possível
 * abrir o documento."), no lugar do alert() do navegador e para ações que
 * não têm um formulário onde mostrar o resultado (excluir uma linha, por
 * exemplo). Ficam numa região aria-live: o leitor de tela anuncia sem tirar
 * o foco de onde a pessoa está.
 */
export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const proximoId = useRef(1);

  const dispensar = useCallback((id) => {
    setAvisos((atuais) => atuais.filter((aviso) => aviso.id !== id));
  }, []);

  const avisar = useCallback(
    (mensagem, tipo = "sucesso") => {
      const id = proximoId.current++;
      setAvisos((atuais) => [...atuais.slice(-2), { id, mensagem, tipo }]);
      setTimeout(() => dispensar(id), DURACAO_MS);
    },
    [dispensar]
  );

  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((aviso) => (
          <div key={aviso.id} className={`aviso aviso-${aviso.tipo}`}>
            {aviso.tipo === "erro" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{aviso.mensagem}</span>
            <button type="button" onClick={() => dispensar(aviso.id)} aria-label="Dispensar aviso">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  );
}

export function useAvisos() {
  const contexto = useContext(AvisosContext);
  if (!contexto) throw new Error("useAvisos deve ser usado dentro de AvisosProvider");
  return contexto;
}
