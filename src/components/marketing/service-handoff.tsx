import { HandoffMotion } from "./handoff-motion";
export function ServiceHandoff() {
  return (
    <HandoffMotion>
      <div className="handoff-scene">
        <span className="handoff-packet" aria-hidden="true">
          <svg width="30" height="38" viewBox="0 0 30 38">
            <path d="M2 1h19l7 7v28H2Z" fill="#f3f1de" stroke="#153f32" />
            <path
              d="M21 1v8h7M7 15h16M7 21h16M7 27h10"
              fill="none"
              stroke="#176145"
              strokeWidth="2"
            />
          </svg>
        </span>
        <svg
          className="handoff-route"
          viewBox="0 0 1200 380"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="route-base"
            d="M235 180 H385 Q420 180 420 215 V280 Q420 310 455 310 H755 Q790 310 790 275 V180 Q790 150 825 150 H990"
          />
          <path
            className="route-trace"
            pathLength="1"
            d="M235 180 H385 Q420 180 420 215 V280 Q420 310 455 310 H755 Q790 310 790 275 V180 Q790 150 825 150 H990"
          />
          <circle cx="420" cy="215" r="6" />
          <circle cx="790" cy="275" r="6" />
        </svg>
        <article className="evidence-object" data-motion="evidence">
          <div className="receipt-top">
            <span>NOTA / SALINAN</span>
            <span className="receipt-emblem" aria-hidden="true">
              W.
            </span>
          </div>
          <h2>Bukti pembelian</h2>
          <dl>
            <div>
              <dt>Barang</dt>
              <dd>Laptop</dd>
            </div>
            <div>
              <dt>Nomor seri</dt>
              <dd>… 2841</dd>
            </div>
            <div>
              <dt>Dokumen</dt>
              <dd>Nota + ketentuan</dd>
            </div>
          </dl>
          <div className="receipt-tear" aria-hidden="true" />
          <p>Keluhan pembeli</p>
          <strong>“Tidak mau menyala.”</strong>
          <svg
            className="receipt-bars"
            width="150"
            height="23"
            viewBox="0 0 150 23"
            aria-hidden="true"
          >
            <path
              d="M2 0v23m5-23v23m8-23v23m4-23v23m9-23v23m5-23v23m9-23v23m4-23v23m7-23v23m9-23v23m4-23v23m8-23v23m5-23v23m9-23v23m4-23v23m7-23v23m9-23v23m5-23v23m9-23v23m4-23v23m8-23v23"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </article>
        <span className="handoff-note evidence-note">Bukti ikut barang</span>
        <article className="inspection-object" data-motion="inspection">
          <div className="inspection-photo">
            <picture>
              <source
                media="(max-width: 767px)"
                srcSet="/images/repair-workbench-small.webp"
              />
              <img
                src="/images/repair-workbench.webp"
                width="1120"
                height="1000"
                alt="Tangan teknisi memeriksa komponen laptop di meja servis."
                fetchPriority="high"
                loading="eager"
              />
            </picture>
            <svg
              className="inspection-annotation"
              viewBox="0 0 380 225"
              aria-hidden="true"
            >
              <circle cx="228" cy="140" r="39" />
              <path d="m259 114 38-48h58" />
              <path className="inspection-tick" d="m210 141 12 12 25-29" />
            </svg>
            <span className="photo-label">Titik pemeriksaan</span>
          </div>
          <div className="inspection-label">
            <h2>Catatan pemeriksaan</h2>
            <p>Uji daya. Catat kondisi. Cocokkan bukti.</p>
          </div>
        </article>
        <span className="handoff-note inspection-note">Temuan jadi dasar</span>
        <article className="response-object" data-motion="response">
          <span className="tag-hole" aria-hidden="true" />
          <p>UNTUK PEMBELI</p>
          <h2>Tanggapan garansi</h2>
          <div className="response-stamp" data-motion="stamp">
            Ada alasan.
            <br />
            Ada langkah lanjut.
          </div>
          <dl>
            <div>
              <dt>Dasar</dt>
              <dd>Temuan + ketentuan</dd>
            </div>
            <div>
              <dt>Tanggapan</dt>
              <dd>Penanganan & alasan</dd>
            </div>
            <div>
              <dt>Jika ada biaya</dt>
              <dd>Minta persetujuan dulu</dd>
            </div>
          </dl>
        </article>
      </div>
      <div className="handoff-bottom">
        <p>
          Nota tidak menentukan hasil sendirian. Kondisi barang dan ketentuan
          garansi tetap diperiksa.
        </p>
      </div>
    </HandoffMotion>
  );
}
