import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard IA | Agentes",
  description: "Monitoramento em tempo real dos agentes IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
