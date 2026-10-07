"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AjudaProvider } from "@/contexts/AjudaContext";
import { MenuMovelProvider } from "@/contexts/MenuMovelContext";
import RotulosAutomaticos from "@/components/shell/RotulosAutomaticos";
import { ConfirmacaoProvider } from "@/contexts/ConfirmacaoContext";
import { AvisosProvider } from "@/contexts/AvisosContext";
import "../styles/design-system.css";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <MenuMovelProvider>
        <AvisosProvider>
          <ConfirmacaoProvider>
            <AjudaProvider>{children}</AjudaProvider>
          </ConfirmacaoProvider>
        </AvisosProvider>
        <RotulosAutomaticos />
      </MenuMovelProvider>
    </ThemeProvider>
  );
}
