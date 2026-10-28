import { PreferencesProvider } from "@/contexts/PreferencesContext";

export default function DashboardLayout({ children }) {
  // O layout permanece montado ao navegar entre a dashboard e Compromissos.
  // Assim, a densidade não volta ao padrão durante a troca de página.
  return (
    <PreferencesProvider>
      {children}
    </PreferencesProvider>
  );
}
