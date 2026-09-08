import { Scale } from "lucide-react";

export default function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-brand">
        <Scale size={16} />
        LexOffice
      </div>
      <span>© {new Date().getFullYear()} LexOffice — ERP Jurídico</span>
    </footer>
  );
}
