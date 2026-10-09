"use client";

import { useState } from "react";
import useFotoProtegida from "@/hooks/useFotoProtegida";

export default function Avatar({ src, nome, size = 32 }) {
  const [falhouUrl, setFalhouUrl] = useState("");
  const url = useFotoProtegida(src);
  const estilo = { width: size, height: size, fontSize: size * 0.42 };

  if (url && falhouUrl !== url) {
    return (
      <img
        src={url}
        alt=""
        className="avatar-img"
        style={estilo}
        onError={() => setFalhouUrl(url)}
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
