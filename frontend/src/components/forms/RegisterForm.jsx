"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registrarEscritorio } from "@/services/api";
import { formatarCEP, formatarCNPJ, formatarTelefone } from "@/utils/mascaras";
import { buscarEnderecoPorCep } from "@/utils/cep";
import { avisoDaEmpresa, buscarEmpresaPorCnpj } from "@/utils/cnpj";
import { senhaAtendeRequisitos } from "@/utils/senha";
import RequisitosSenha from "@/components/ui/RequisitosSenha";

const ETAPAS = ["Escritório", "Localização", "Administrador", "Revisão"];

export default function RegisterForm() {
  const router = useRouter();
  const formularioRef = useRef(null);
  const [etapa, setEtapa] = useState(0);
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

  useLayoutEffect(() => {
    // Foca antes de a etapa ficar interativa; um RAF atrasado pode roubar
    // o foco de quem já começou a digitar em outro campo da nova etapa.
    formularioRef.current?.querySelector(`[data-etapa="${etapa}"] input`)?.focus();
  }, [etapa]);

  function alterarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function irPara(numero) {
    setEtapa(numero);
    setErro("");
  }

  function validarEtapa(numero) {
    const campos = formularioRef.current?.querySelectorAll(`[data-etapa="${numero}"] input`) || [];
    const invalido = [...campos].find((campo) => !campo.checkValidity());
    if (invalido) {
      invalido.reportValidity();
      return false;
    }
    if (numero === 2 && !senhaAtendeRequisitos(form.senha_admin)) {
      setErro("Confira os requisitos da senha antes de continuar.");
      return false;
    }
    return true;
  }

  // Preenche só o que ainda está vazio: nunca sobrescreve o que foi digitado.
  async function handleBuscarCnpj(valor) {
    if ((valor || "").replace(/[^A-Za-z0-9]/g, "").length !== 14) return;
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

    if (etapa < 3) {
      if (validarEtapa(etapa)) irPara(etapa + 1);
      return;
    }
    for (let numero = 0; numero < 3; numero++) {
      if (!validarEtapa(numero)) {
        irPara(numero);
        return;
      }
    }

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
      const campo = Object.keys(error.campos || {})[0];
      const grupo = formularioRef.current?.elements.namedItem(campo)?.closest("[data-etapa]");
      if (grupo) setEtapa(Number(grupo.dataset.etapa));
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form ref={formularioRef} onSubmit={handleSubmit} noValidate className="cadastro-etapas">
      <h2>Criar escritório</h2>
      <p className="subtitle">
        Passo {etapa + 1} de {ETAPAS.length}: {ETAPAS[etapa]}
      </p>

      {erro && <div className="alert alert-error">{erro}</div>}

      <ol className="cadastro-progresso" aria-label="Etapas do cadastro">
        {ETAPAS.map((titulo, indice) => <li key={titulo} aria-current={indice === etapa ? "step" : undefined}>
          <span>{indice + 1}</span>{titulo}
        </li>)}
      </ol>

      <fieldset data-etapa="0" hidden={etapa !== 0} className="form-grid">
        <legend>Dados do escritório</legend>
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
            inputMode="text"
            autoCapitalize="characters"
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
      </fieldset>
      <fieldset data-etapa="1" hidden={etapa !== 1} className="form-grid">
        <legend>Onde fica o escritório?</legend>
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
      </fieldset>
      <fieldset data-etapa="2" hidden={etapa !== 2} className="form-grid">
        <legend>Primeiro administrador</legend>
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
      </fieldset>

      {etapa === 3 && <section className="cadastro-revisao" aria-label="Revise antes de criar">
        <h3>Está tudo certo?</h3>
        <p>Confira os dados. O primeiro acesso será feito com o e-mail do administrador.</p>
        <dl>
          <div><dt>Escritório</dt><dd>{form.nome_escritorio}</dd></div>
          <div><dt>CNPJ</dt><dd>{form.cnpj}</dd></div>
          <div><dt>Contato</dt><dd>{form.email_escritorio}<br />{form.telefone_escritorio}</dd></div>
          <div><dt>Endereço</dt><dd>{form.endereco_escritorio}{form.cidade && ` · ${form.cidade}`}{form.estado && `/${form.estado}`}</dd></div>
          <div><dt>Administrador</dt><dd>{form.nome_admin}<br />{form.email_admin}</dd></div>
        </dl>
      </section>}

      <div className="cadastro-acoes">
      {etapa > 0 && <button type="button" className="btn btn-secondary" data-preserva-formulario disabled={carregando} onClick={() => irPara(etapa - 1)}>Voltar</button>}
      <button
        className="btn btn-primary"
        disabled={carregando}
      >
        {carregando ? "Cadastrando..." : etapa === 3 ? "Criar escritório" : "Continuar"}
      </button>
      </div>

      <div className="auth-footer">
        Já possui conta? <Link href="/login">Voltar ao login</Link>
      </div>
    </form>
  );
}
