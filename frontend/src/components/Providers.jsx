"use client";

import { ThemeProvider } from "@/contexts/ThemeContext";
import "../styles/design-system.css";

export default function Providers({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
