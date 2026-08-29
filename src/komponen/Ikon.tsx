// Ikon garis, ditulis langsung sebagai SVG.
//
// Pustaka ikon membawa ratusan bentuk untuk dipakai belasan. Di aplikasi yang
// dibuka dari tepi jalan lewat jaringan seluler, setiap kilobyte yang tidak
// dikirim adalah kilobyte yang tidak perlu ditunggu.

interface P {
  ukuran?: number;
  className?: string;
}

function Bingkai({ ukuran = 20, className, anak }: P & { anak: React.ReactNode }) {
  return (
    <svg
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      {anak}
    </svg>
  );
}

export const IkonTruk = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <path d="M3 7h11v9H3z" />
        <path d="M14 10h4l3 3.5V16h-7z" />
        <circle cx="7.5" cy="18" r="1.8" />
        <circle cx="17.5" cy="18" r="1.8" />
      </>
    }
  />
);

export const IkonPin = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.6" />
      </>
    }
  />
);

export const IkonNavigasi = (p: P) => (
  <Bingkai {...p} anak={<path d="M21 3 3 10.5l8 3 3 8z" />} />
);

export const IkonTelepon = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3z" />
    }
  />
);

export const IkonChat = (p: P) => (
  <Bingkai {...p} anak={<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.3A8 8 0 1 1 21 12z" />} />
);

export const IkonKamera = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <path d="M3 8h3.5L8 6h8l1.5 2H21v11H3z" />
        <circle cx="12" cy="13.5" r="3.4" />
      </>
    }
  />
);

export const IkonCentang = (p: P) => <Bingkai {...p} anak={<path d="M20 6 9 17l-5-5" />} />;

export const IkonSilang = (p: P) => <Bingkai {...p} anak={<path d="M18 6 6 18M6 6l12 12" />} />;

export const IkonKembali = (p: P) => (
  <Bingkai {...p} anak={<path d="M15 19 8 12l7-7" />} />
);

export const IkonPaket = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
      </>
    }
  />
);

export const IkonDompet = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <path d="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M3 7V6a2 2 0 0 1 2-2h11" />
        <circle cx="16.5" cy="13" r="1.2" />
      </>
    }
  />
);

export const IkonMuatUlang = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <path d="M20 11a8 8 0 1 0-.6 4" />
        <path d="M20 5v6h-6" />
      </>
    }
  />
);

export const IkonPeringatan = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5M12 16h.01" />
      </>
    }
  />
);

export const IkonOrang = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <circle cx="12" cy="8" r="3.6" />
        <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
      </>
    }
  />
);

export const IkonJam = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5.2l3.2 2" />
      </>
    }
  />
);

export const IkonQr = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
        <path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5z" />
      </>
    }
  />
);

export const IkonKeluar = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
        <path d="M10 16 6 12l4-4M6 12h9" />
      </>
    }
  />
);

export const IkonSenter = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <path d="M6 3h12v3l-3.5 4V21h-5v-11L6 6z" />
        <path d="M6 6h12" />
      </>
    }
  />
);

export const IkonMatahari = (p: P) => (
  <Bingkai
    {...p}
    anak={
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2.5M12 19.5V22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2 12h2.5M19.5 12H22M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
      </>
    }
  />
);

export const IkonBulan = (p: P) => (
  <Bingkai {...p} anak={<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />} />
);
