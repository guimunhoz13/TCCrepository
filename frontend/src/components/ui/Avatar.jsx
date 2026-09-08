"use client";

import { useState } from "react";

export default function Avatar({ src, nome, size = 32 }) {
  const [falhou, setFalhou] = useState(false);
  const estilo = { width: size, height: size, fontSize: size * 0.42 };

  if (src && !falhou) {
    return (
      <img
        src={src}
        alt=""
        className="avatar-img"
        style={estilo}
        onError={() => setFalhou(true)}
      />
    );
  }

  const inicial = (nome || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="avatar-fallback" style={estilo} aria-hidden="true">
      {inicial}
    </span>
  );
}
