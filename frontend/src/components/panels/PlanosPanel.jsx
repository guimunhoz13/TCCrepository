"use client";

import { usePanel, PANELS } from "@/contexts/PanelContext";
import OverlayPanel from "@/components/shell/OverlayPanel";
import CartoesDePlanos from "@/components/planos/CartoesDePlanos";
import { useRecurso } from "@/hooks/useRecurso";
import { getPlanoAtual, getPlanos } from "@/services/api";
import { formatarData } from "@/utils/formato";

const ROTULOS_USO = {
  usuarios: "Usuários ativos",
  processos_ativos: "Processos ativos",
};

function BarraDeUso({ rotulo, usado, limite }) {
  const ilimitado = limite === null || limite === undefined;
  const proporcao = ilimitado ? 0 : Math.min(usado / limite, 1);
  const cheio = !ilimitado && usado >= limite;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
        <span>{rotulo}</span>
        <strong style={{ color: cheio ? "var(--danger)" : "var(--text-primary)" }}>
          {ilimitado ? `${usado} (ilimitado)` : `${usado} de ${limite}`}
        </strong>
      </div>
      {!ilimitado && (
        <div
          role="meter"
          aria-label={rotulo}
          aria-valuemin={0}
          aria-valuemax={limite}
          aria-valuenow={usado}
          style={{ height: 6, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}
        >
          <div
            style={{
              width: `${proporcao * 100}%`,
              height: "100%",
              background: cheio ? "var(--danger)" : "var(--accent)",
            }}
          />
        </div>
      )}
    </div>
  );
}

function botaoDoPlano(plano, ehAtual, { ordem, ordemAtual, contato }) {
  if (ehAtual || ordem < ordemAtual) return null;
  if (contato) {
    const assunto = encodeURIComponent(`Quero o plano ${plano.nome} do LexOffice`);
    return (
      <a className="btn btn-primary" style={{ width: "100%" }} href={`mailto:${contato}?subject=${assunto}`}>
        Quero o plano {plano.nome}
      </a>
    );
  }
  return (
    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
      Para contratar, fale com o administrador da plataforma.
    </p>
  );
}

export default function PlanosPanel() {
  const { activePanel } = usePanel();
  const aberto = activePanel === PANELS.PLANOS;
  const catalogo = useRecurso(getPlanos, [], { ativo: aberto });
  const atual = useRecurso(getPlanoAtual, [], { ativo: aberto });

  if (!aberto) return null;

  const planos = catalogo.dados?.planos || [];
  const situacao = atual.dados;
  const ordemAtual = planos.findIndex((p) => p.id === situacao?.plano);
  const nomeContratado = planos.find((p) => p.id === situacao?.plano_contratado)?.nome;

  return (
    <OverlayPanel>
      <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontSize: "0.925rem" }}>
        O LexOffice é gratuito para começar, sem cartão de crédito. Os planos pagos ampliam os
        limites e trazem as automações e a inteligência artificial.
      </p>

      {(catalogo.erro || atual.erro) && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: 16 }}>
          {catalogo.erro || atual.erro}
        </div>
      )}

      {situacao && (
        <section className="settings-section" aria-labelledby="uso-do-plano" style={{ marginBottom: 24 }}>
          <h3 id="uso-do-plano" style={{ fontSize: "1rem", marginBottom: 14 }}>
            Seu escritório está no plano {situacao.nome}
            {situacao.validade && !situacao.vencido && (
              <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
                {" "}· válido até {formatarData(situacao.validade)}
              </span>
            )}
          </h3>
          {situacao.vencido && (
            <div className="alert alert-warning" role="status" style={{ marginBottom: 14 }}>
              O plano {nomeContratado} venceu em {formatarData(situacao.validade)}. Até a renovação,
              valem os limites do {situacao.nome}; nenhum dado foi apagado.
            </div>
          )}
          <div style={{ display: "grid", gap: 14 }}>
            {Object.entries(ROTULOS_USO).map(([chave, rotulo]) => (
              <BarraDeUso
                key={chave}
                rotulo={rotulo}
                usado={situacao.uso[chave]}
                limite={situacao.limites[chave]}
              />
            ))}
          </div>
        </section>
      )}

      {catalogo.carregando && !planos.length ? (
        <p style={{ color: "var(--text-muted)" }}>Carregando os planos…</p>
      ) : (
        <CartoesDePlanos
          planos={planos}
          atual={situacao?.plano}
          acao={(plano, ehAtual) =>
            botaoDoPlano(plano, ehAtual, {
              ordem: planos.indexOf(plano),
              ordemAtual,
              contato: catalogo.dados?.contato_comercial,
            })
          }
        />
      )}
    </OverlayPanel>
  );
}
