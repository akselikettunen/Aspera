/** The Aspera mark — a four-armed compass/asterisk in the accent cyan. */
export function Logo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <line x1="32" y1="6" x2="32" y2="26" stroke="#22D4E6" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="32" y1="38" x2="32" y2="58" stroke="#22D4E6" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="6" y1="32" x2="26" y2="32" stroke="#22D4E6" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="38" y1="32" x2="58" y2="32" stroke="#22D4E6" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="4" fill="#22D4E6" />
    </svg>
  );
}
