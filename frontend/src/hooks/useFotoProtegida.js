"use client";

import { useEffect, useState } from "react";
import { buscarFotoAutenticada, fotoProtegida } from "@/services/api";

export default function useFotoProtegida(src) {
  const [imagem, setImagem] = useState({ src: "", url: "" });
  const protegida = fotoProtegida(src);

  useEffect(() => {
    if (!protegida) return;

    let ativo = true;
    let objetoUrl = "";
    buscarFotoAutenticada(src).then((blob) => {
      if (!ativo) return;
      objetoUrl = URL.createObjectURL(blob);
      setImagem({ src, url: objetoUrl });
    }).catch(() => {});

    return () => {
      ativo = false;
      if (objetoUrl) URL.revokeObjectURL(objetoUrl);
    };
  }, [src, protegida]);

  return protegida ? (imagem.src === src ? imagem.url : "") : (src || "");
}
