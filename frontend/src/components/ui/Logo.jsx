/**
 * Monograma do LexOffice: um "L" serifado sobre a linha do razão, com o ponto
 * de citação em destaque. Substitui o ícone genérico de balança para dar
 * identidade própria à marca.
 */
export default function Logo({ size = 24, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="img"
      aria-label="LexOffice"
      className={className}
    >
      <path
        d="M9 5v11.4h7.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="butt"
      />
      <path
        d="M6.6 5h4.8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="19.3" cy="16.4" r="1.3" fill="currentColor" />
      <path
        d="M4.8 20.2h14.4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}
