"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AjudaProvider } from "@/contexts/AjudaContext";
import { MenuMovelProvider } from "@/contexts/MenuMovelContext";
import RotulosDeTabela from "@/components/shell/RotulosDeTabela";
import "../styles/design-system.css";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <MenuMovelProvider>
        <AjudaProvider>{children}</AjudaProvider>
        <RotulosDeTabela />
      </MenuMovelProvider>
    </ThemeProvider>
  );
}
