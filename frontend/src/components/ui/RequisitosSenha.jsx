"use client";

import { Check, X } from "lucide-react";
import { REQUISITOS_SENHA } from "@/utils/senha";

export default function RequisitosSenha({ senha }) {
  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: "6px 0 0",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      {REQUISITOS_SENHA.map((req) => {
        const atendido = req.testar(senha || "");
        return (
          <li
            key={req.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.8125rem",
              color: atendido ? "var(--success)" : "var(--text-secondary)",
            }}
          >
            {atendido ? <Check size={14} /> : <X size={14} />}
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}
