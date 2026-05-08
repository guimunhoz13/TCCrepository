import 'bootstrap/dist/css/bootstrap.min.css'
import "./globals.css";
import "../styles/theme.css";

export const metadata = {
  title: "TCC Advocacia",
  description: "Sistema Web para Advocacia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>{children}</body>
    </html>
  );
}