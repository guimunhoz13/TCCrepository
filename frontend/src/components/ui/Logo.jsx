/**
 * Monograma do LexNexo: L e N compartilham a mesma construção geométrica.
 * O traço contínuo representa a conexão entre processos, pessoas, prazos,
 * documentos e inteligência — sem recorrer aos clichês visuais do Direito.
 */
export default function Logo({ size = 24, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="LexNexo"
      className={className}
    >
      <path
        d="M5.25 4.5v15h13.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7.25 17V7l9.5 10V7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
