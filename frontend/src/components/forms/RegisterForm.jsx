"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registrarEscritorio } from "@/services/api";
import { formatarCEP, formatarCNPJ, formatarTelefone } from "@/utils/mascaras";
import { buscarEnderecoPorCep } from "@/utils/cep";
import { avisoDaEmpresa, buscarEmpresaPorCnpj } from "@/utils/cnpj";
import { senhaAtendeRequisitos } from "@/utils/senha";
import RequisitosSenha from "@/components/ui/RequisitosSenha";
import OrientacaoFormulario from "@/components/ui/OrientacaoFormulario";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome_escritorio: "",
    cnpj: "",
    email_escritorio: "",
    telefone_escritorio: "",
    endereco_escritorio: "",
    cidade: "",
    estado: "",
    nome_admin: "",
    email_admin: "",
    senha_admin: "",
  });
  const [cep, setCep] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [avisoCnpj, setAvisoCnpj] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  function alterarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  // Preenche só o que ainda está vazio: nunca sobrescreve o que foi digitado.
  async function handleBuscarCnpj(valor) {
    if ((valor || "").replace(/\D/g, "").length !== 14) return;
    try {
      setBuscandoCnpj(true);
      const empresa = await buscarEmpresaPorCnpj(valor);
      setAvisoCnpj(avisoDaEmpresa(empresa));
      if (!empresa) return;
      setForm((atual) => ({
        ...atual,
        nome_escritorio: atual.nome_escritorio || empresa.nomeFantasia || empresa.razaoSocial,
        telefone_escritorio:
          atual.telefone_escritorio || (empresa.telefone ? formatarTelefone(empresa.telefone) : ""),
        email_escritorio: atual.email_escritorio || empresa.email,
        endereco_escritorio:
          atual.endereco_escritorio ||
          [empresa.logradouro, empresa.complemento, empresa.bairro].filter(Boolean).join(", "),
        cidade: atual.cidade || empresa.cidade,
        estado: atual.estado || empresa.estado,
      }));
      if (empresa.cep) setCep((atual) => atual || formatarCEP(empresa.cep));
    } finally {
      setBuscandoCnpj(false);
    }
  }

  async function handleBuscarCep(valor) {
    if ((valor || "").replace(/\D/g, "").length !== 8) return;

    try {
      setBuscandoCep(true);
      const endereco = await buscarEnderecoPorCep(valor);
      if (!endereco) return;

      setForm((atual) => ({
        ...atual,
        endereco_escritorio: [endereco.logradouro, endereco.bairro]
          .filter(Boolean)
          .join(", "),
        cidade: endereco.cidade || atual.cidade,
        estado: endereco.estado || atual.estado,
      }));
    } finally {
      setBuscandoCep(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!senhaAtendeRequisitos(form.senha_admin)) {
      setErro("A senha do admin não atende a todos os requisitos obrigatórios.");
      return;
    }

    try {
      setCarregando(true);
      const data = await registrarEscritorio(form);

      sessionStorage.setItem(
        "sucessoCadastro",
        data.requer_verificacao_email
          ? "Escritório cadastrado! Enviamos um link de confirmação para o e-mail do administrador — confirme antes de fazer login."
          : "Escritório cadastrado! Faça login com o e-mail do administrador."
      );

      router.push("/login");
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Criar escritório</h2>
      <p className="subtitle">
        Cadastre seu escritório e crie o usuário administrador
      </p>

      {erro && <div className="alert alert-error">{erro}</div>}

      <OrientacaoFormulario
        titulo="Configure o escritório e o primeiro acesso"
        descricao="Primeiro informe os dados institucionais; depois crie o administrador que poderá convidar a equipe e concluir a configuração."
        etapas={["Dados institucionais", "Localização", "Primeiro administrador"]}
      />

      <div className="form-grid">
        <div className="form-field full">
          <label>Nome do escritório</label>
          <input
            name="nome_escritorio"
            value={form.nome_escritorio}
            autoComplete="organization"
            onChange={(e) => alterarCampo("nome_escritorio", e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label>CNPJ</label>
          <input
            name="cnpj"
            value={form.cnpj}
            inputMode="numeric"
            onChange={(e) => alterarCampo("cnpj", formatarCNPJ(e.target.value))}
            onBlur={(e) => handleBuscarCnpj(e.target.value)}
            aria-describedby="aviso-cnpj"
            required
          />
          {(buscandoCnpj || avisoCnpj) && (
            <span id="aviso-cnpj" role="status" style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              {buscandoCnpj ? "Buscando dados da empresa..." : avisoCnpj}
            </span>
          )}
        </div>
        <div className="form-field">
          <label>Telefone</label>
          <input
            name="telefone_escritorio"
            type="tel"
            autoComplete="tel"
            value={form.telefone_escritorio}
            onChange={(e) =>
              alterarCampo("telefone_escritorio", formatarTelefone(e.target.value))
            }
            required
          />
        </div>
        <div className="form-field">
          <label>E-mail do escritório</label>
          <input
            name="email_escritorio"
            type="email"
            autoComplete="email"
            value={form.email_escritorio}
            onChange={(e) => alterarCampo("email_escritorio", e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label>CEP</label>
          <input
            name="cep"
            value={cep}
            inputMode="numeric"
            autoComplete="postal-code"
            onChange={(e) => setCep(formatarCEP(e.target.value))}
            onBlur={(e) => handleBuscarCep(e.target.value)}
            placeholder="00000-000"
            maxLength={9}
          />
          {buscandoCep && (
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Buscando endereço...
            </span>
          )}
        </div>
        <div className="form-field">
          <label>Cidade</label>
          <input
            name="cidade"
            value={form.cidade}
            autoComplete="address-level2"
            onChange={(e) => alterarCampo("cidade", e.target.value)}
          />
        </div>
        <div className="form-field full">
          <label>Endereço</label>
          <input
            name="endereco_escritorio"
            value={form.endereco_escritorio}
            autoComplete="street-address"
            onChange={(e) =>
              alterarCampo("endereco_escritorio", e.target.value)
            }
            required
          />
        </div>
        <div className="form-field">
          <label>Estado (UF)</label>
          <input
            name="estado"
            maxLength={2}
            autoComplete="address-level1"
            value={form.estado}
            onChange={(e) => alterarCampo("estado", e.target.value.toUpperCase())}
          />
        </div>
        <div className="form-field full">
          <strong style={{ marginTop: 8 }}>Administrador do escritório</strong>
        </div>
        <div className="form-field">
          <label>Nome do admin</label>
          <input
            name="nome_admin"
            value={form.nome_admin}
            autoComplete="name"
            onChange={(e) => alterarCampo("nome_admin", e.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label>E-mail do admin</label>
          <input
            name="email_admin"
            type="email"
            autoComplete="username"
            value={form.email_admin}
            onChange={(e) => alterarCampo("email_admin", e.target.value)}
            required
          />
        </div>
        <div className="form-field full">
          <label>Senha do admin</label>
          <input
            name="senha_admin"
            type="password"
            autoComplete="new-password"
            value={form.senha_admin}
            onChange={(e) => alterarCampo("senha_admin", e.target.value)}
            required
          />
          <RequisitosSenha senha={form.senha_admin} />
        </div>
      </div>

      <button
        className="btn btn-primary"
        style={{ width: "100%", marginTop: 20 }}
        disabled={carregando || !senhaAtendeRequisitos(form.senha_admin)}
      >
        {carregando ? "Cadastrando..." : "Criar escritório"}
      </button>

      <div className="auth-footer">
        Já possui conta? <Link href="/login">Voltar ao login</Link>
      </div>
    </form>
  );
}
