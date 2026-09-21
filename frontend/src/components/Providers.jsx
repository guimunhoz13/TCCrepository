"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import { AjudaProvider } from "@/contexts/AjudaContext";
import "../styles/design-system.css";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AjudaProvider>{children}</AjudaProvider>
    </ThemeProvider>
  );
}
