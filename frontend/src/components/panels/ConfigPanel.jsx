"use client";

import { useState } from "react";
import { usePanel } from "@/contexts/PanelContext";
import { useTheme } from "@/contexts/ThemeContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import { getUsuarioLogado, registrarAdvogado } from "@/services/api";

export default function ConfigPanel() {
  const { activePanel } = usePanel();
  const { theme, setTheme } = useTheme();
  const usuario = getUsuarioLogado();
  const [formAdvogado, setFormAdvogado] = useState({
    nome: "",
    email: "",
    senha: "",
    oab: "",
    especialidade: "",
  });
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  async function handleAdvogado(event) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      await registrarAdvogado(formAdvogado);
      setMensagem("Advogado cadastrado com sucesso.");
      setFormAdvogado({
        nome: "",
        email: "",
        senha: "",
        oab: "",
        especialidade: "",
      });
    } catch (error) {
      setErro(error.message);
    }
  }

  if (activePanel !== "config") return null;

  return (
    <OverlayPanel>
      {erro && <div className="alert alert-error">{erro}</div>}
      {mensagem && <div className="alert alert-success">{mensagem}</div>}

      <div className="contact-grid">
        <div className="contact-item">
          <strong>Tema da interface</strong>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button
              className={`btn btn-sm ${theme === "light" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setTheme("light")}
            >
              Claro
            </button>
            <button
              className={`btn btn-sm ${theme === "dark" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setTheme("dark")}
            >
              Escuro
            </button>
          </div>
        </div>

        <div className="contact-item">
          <strong>Usuário logado</strong>
          <span>
            {usuario?.nome} ({usuario?.tipo_usuario})
          </span>
        </div>

        {usuario?.tipo_usuario === "admin" && (
          <form className="form-grid" onSubmit={handleAdvogado}>
            <div className="form-field full">
              <strong>Cadastrar advogado no escritório</strong>
            </div>
            <div className="form-field">
              <label>Nome</label>
              <input
                value={formAdvogado.nome}
                onChange={(e) =>
                  setFormAdvogado({ ...formAdvogado, nome: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>E-mail</label>
              <input
                type="email"
                value={formAdvogado.email}
                onChange={(e) =>
                  setFormAdvogado({ ...formAdvogado, email: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Senha</label>
              <input
                type="password"
                value={formAdvogado.senha}
                onChange={(e) =>
                  setFormAdvogado({ ...formAdvogado, senha: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>OAB</label>
              <input
                value={formAdvogado.oab}
                onChange={(e) =>
                  setFormAdvogado({ ...formAdvogado, oab: e.target.value })
                }
                required
              />
            </div>
            <div className="form-field">
              <label>Especialidade</label>
              <input
                value={formAdvogado.especialidade}
                onChange={(e) =>
                  setFormAdvogado({
                    ...formAdvogado,
                    especialidade: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="form-field full">
              <button className="btn btn-primary">Cadastrar advogado</button>
            </div>
          </form>
        )}
      </div>
    </OverlayPanel>
  );
}
