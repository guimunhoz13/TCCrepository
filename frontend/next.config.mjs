const isDev = process.env.NODE_ENV === "development";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const API_ORIGIN = new URL(API_URL).origin;

// O access token fica no localStorage, então um XSS conseguiria lê-lo. A CSP
// não impede o script de rodar (o Next injeta scripts inline sem nonce), mas
// restringe para onde ele consegue mandar dados: connect-src só aceita a
// própria origem, a API e o ViaCEP.
// upgrade-insecure-requests só entra com API em HTTPS: com a API local em
// http://127.0.0.1:8000 ele reescreveria as chamadas para https e quebraria
// o `npm run start` em desenvolvimento.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  `img-src 'self' blob: data: ${API_ORIGIN}`,
  `connect-src 'self' ${API_ORIGIN} https://viacep.com.br https://brasilapi.com.br${isDev ? " ws: wss:" : ""}`,
  `frame-src 'self' blob: ${API_ORIGIN}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(API_ORIGIN.startsWith("https://") ? ["upgrade-insecure-requests"] : []),
].join("; ");

const cabecalhosDeSeguranca = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: cabecalhosDeSeguranca }];
  },
};

export default nextConfig;
