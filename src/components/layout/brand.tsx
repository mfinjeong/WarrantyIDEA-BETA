export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      width="38"
      height="38"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 9h7l5 22h7l5-22h8M5 9l6 22h5M23 31l6-22M33 19v12"
        stroke="currentColor"
        strokeWidth="3.4"
        strokeLinejoin="bevel"
      />
      <circle cx="33" cy="11" r="2.1" fill="currentColor" />
    </svg>
  );
}
export function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={down ? { transform: "rotate(90deg)" } : undefined}
    >
      <path d="M3 12h17m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
export function Brand() {
  return (
    <>
      <BrandMark />
      <span>
        Warranty<span className="wordmark-suffix">IDEA</span>
      </span>
    </>
  );
}
