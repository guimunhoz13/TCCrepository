import Logo from "@/components/ui/Logo";

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-brand">
        <Logo size={16} />
        LexOffice
      </div>
      <span>© {new Date().getFullYear()} LexOffice — ERP Jurídico</span>
    </footer>
  );
}
