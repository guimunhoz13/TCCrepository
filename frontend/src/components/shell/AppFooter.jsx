import Logo from "@/components/ui/Logo";

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-brand">
        <Logo size={16} />
        LexNexo
      </div>
      <span>© {new Date().getFullYear()} LexNexo — ERP Jurídico</span>
    </footer>
  );
}
