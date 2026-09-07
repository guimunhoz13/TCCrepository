"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Scale,
  Users,
  Briefcase,
  CalendarDays,
  FileText,
  Bot,
  Mail,
  MessageCircle,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import styles from "./page.module.css";

const FEATURES = [
  {
    icon: Users,
    title: "Clientes organizados",
    desc: "Cadastro completo, histórico e status de cada cliente em um só lugar.",
  },
  {
    icon: Briefcase,
    title: "Processos sob controle",
    desc: "Acompanhe status, prazos e movimentações de cada processo, do início ao encerramento.",
  },
  {
    icon: CalendarDays,
    title: "Agenda integrada",
    desc: "Audiências e compromissos vinculados diretamente aos processos, sem retrabalho.",
  },
  {
    icon: FileText,
    title: "Documentos centralizados",
    desc: "Envie, organize e baixe documentos por processo, com segurança e histórico.",
  },
  {
    icon: BarChart3,
    title: "Relatórios sob demanda",
    desc: "Gere relatórios completos de qualquer cliente ou processo, prontos para PDF.",
  },
  {
    icon: Bot,
    title: "Assistente com IA",
    desc: "Tire dúvidas e obtenha respostas com o contexto real do seu escritório.",
  },
  {
    icon: Mail,
    title: "E-mail integrado",
    desc: "Envie relatórios e atualizações direto para o cliente, sem sair do sistema.",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp integrado",
    desc: "Compartilhe detalhes de processos pelo WhatsApp com um clique.",
  },
];

const STEPS = [
  {
    title: "Cadastre seu escritório",
    desc: "Leva menos de 2 minutos, sem cartão de crédito.",
  },
  {
    title: "Organize clientes e processos",
    desc: "Tudo isolado por escritório, com histórico completo.",
  },
  {
    title: "Acompanhe em um painel só",
    desc: "Agenda, documentos, relatórios e comunicação num único lugar.",
  },
];

const STATS = [
  { label: "Escritórios ativos", valor: 1240 },
  { label: "Processos geridos", valor: 38900 },
  { label: "Satisfação dos usuários", valor: 98, sufixo: "%" },
];

function useReveal() {
  const ref = useRef(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.18 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, visivel];
}

function ContadorAnimado({ valor, sufixo = "" }) {
  const [ref, visivel] = useReveal();
  const [exibido, setExibido] = useState(0);

  useEffect(() => {
    if (!visivel) return;
    const duracao = 1200;
    const inicio = performance.now();
    let frame;

    function tick(agora) {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      const facilitado = 1 - Math.pow(1 - progresso, 3);
      setExibido(Math.round(valor * facilitado));
      if (progresso < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [visivel, valor]);

  return (
    <strong ref={ref}>
      {exibido.toLocaleString("pt-BR")}
      {sufixo}
    </strong>
  );
}

function Reveal({ as: Tag = "div", className = "", delay = 0, children, id }) {
  const [ref, visivel] = useReveal();
  return (
    <Tag
      id={id}
      ref={ref}
      className={`${styles.reveal} ${visivel ? styles.revealVisible : ""} ${className}`}
      style={{ transitionDelay: visivel ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.bgOrbs} aria-hidden="true">
        <span className={styles.orb1} />
        <span className={styles.orb2} />
      </div>

      <header className={styles.nav}>
        <div className={styles.navBrand}>
          <span className={styles.navBrandIcon}>
            <Scale size={18} />
          </span>
          LexOffice
        </div>

        <nav className={styles.navLinks}>
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
        </nav>

        <div className={styles.navActions}>
          <Link href="/login" className="btn btn-secondary btn-sm">
            Entrar
          </Link>
          <Link href="/cadastro" className="btn btn-primary btn-sm">
            Criar conta grátis
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroText}>
          <div className={styles.heroBadge}>
            <Sparkles size={13} />
            Feito para escritórios de advocacia
          </div>

          <h1>
            Gestão jurídica moderna,
            <span className={styles.heroAccent}>
              {" "}
              do primeiro cliente ao último processo.
            </span>
          </h1>

          <p className={styles.heroLead}>
            Clientes, processos, agenda, documentos, relatórios e comunicação
            por e-mail e WhatsApp — tudo isolado por escritório, em um único
            painel elegante.
          </p>

          <div className={styles.heroActions}>
            <Link href="/cadastro" className="btn btn-primary">
              Começar agora
              <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn btn-secondary">
              Já tenho conta
            </Link>
          </div>

          <div className={styles.heroTrust}>
            <CheckCircle2 size={14} />
            Sem cartão de crédito
            <span>·</span>
            Configuração em minutos
          </div>
        </div>

        <div className={styles.heroMock} aria-hidden="true">
          <div className={styles.mockChrome}>
            <span />
            <span />
            <span />
          </div>

          <div className={styles.mockStats}>
            <div>
              <span>Clientes</span>
              <strong>42</strong>
            </div>
            <div>
              <span>Processos</span>
              <strong>87</strong>
            </div>
            <div>
              <span>Documentos</span>
              <strong>130</strong>
            </div>
          </div>

          <div className={styles.mockChart}>
            <div style={{ "--h": "42%" }} />
            <div style={{ "--h": "75%" }} />
            <div style={{ "--h": "55%" }} />
            <div style={{ "--h": "95%" }} />
            <div style={{ "--h": "65%" }} />
            <div style={{ "--h": "80%" }} />
          </div>

          <div className={styles.mockRow}>
            <span>Processo nº 0043/2026</span>
            <span className="badge badge-warning">Em andamento</span>
          </div>
          <div className={styles.mockRow}>
            <span>Processo nº 0041/2026</span>
            <span className="badge badge-success">Concluído</span>
          </div>
        </div>
      </section>

      <section className={styles.statsStrip}>
        {STATS.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <ContadorAnimado valor={s.valor} sufixo={s.sufixo} />
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      <section className={styles.features}>
        <Reveal id="recursos" className={styles.sectionHeading}>
          <span className={styles.eyebrow}>Recursos</span>
          <h2>Tudo que seu escritório precisa, em um só painel</h2>
        </Reveal>

        <div className={styles.featureGrid}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 60} className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <f.icon size={20} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={styles.steps}>
        <Reveal id="como-funciona" className={styles.sectionHeading}>
          <span className={styles.eyebrow}>Como funciona</span>
          <h2>Comece a usar em três passos</h2>
        </Reveal>

        <div className={styles.stepsList}>
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 100} className={styles.stepItem}>
              <span className={styles.stepIndex}>{i + 1}</span>
              <div>
                <strong>{s.title}</strong>
                <p>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal as="section" className={styles.ctaFinal}>
        <h2>Pronto para organizar seu escritório?</h2>
        <p>Crie sua conta gratuitamente e comece a usar em minutos.</p>
        <Link href="/cadastro" className="btn btn-primary">
          Criar minha conta
          <ArrowRight size={16} />
        </Link>
      </Reveal>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}>
          <Scale size={16} />
          LexOffice
        </div>
        <span>© {new Date().getFullYear()} LexOffice — ERP Jurídico</span>
        <Link href="/login">Entrar</Link>
      </footer>
    </div>
  );
}
