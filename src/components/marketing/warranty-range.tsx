import "./warranty-range.css";

export function WarrantyRange({
  bought,
  ends,
}: {
  bought: string;
  ends: string;
}) {
  return (
    <figure className="sample-range">
      <figcaption>Contoh rentang garansi</figcaption>
      <svg viewBox="0 0 400 28" preserveAspectRatio="none" aria-hidden="true">
        <path className="warranty-span-track" d="M8 14 H392" />
        <path className="warranty-span-line" d="M8 14 H392" pathLength="1" />
        <circle cx="8" cy="14" r="5" />
        <circle cx="392" cy="14" r="5" />
      </svg>
      <div className="sample-range-dates">
        <span>
          <span>Tanggal beli</span>
          <strong>{bought}</strong>
        </span>
        <span>
          <span>Akhir garansi</span>
          <strong>{ends}</strong>
        </span>
      </div>
    </figure>
  );
}
