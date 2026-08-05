import Providers from "@/components/Providers";
import "./globals.css";

export const metadata = {
  title: "LexOffice — ERP Jurídico",
  description: "Sistema ERP multi-escritório para advocacia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
