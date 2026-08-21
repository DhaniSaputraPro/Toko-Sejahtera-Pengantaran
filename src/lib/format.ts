export const rp = (n: number): string => "Rp" + Math.round(n).toLocaleString("id-ID");

export const jam = (iso: string | null): string =>
  !iso
    ? "—"
    : new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export const tanggalJam = (iso: string | null): string =>
  !iso
    ? "—"
    : new Date(iso).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

/** "5 menit lalu", "2 jam lalu" — untuk menakar apakah tugasnya baru masuk. */
export function sejak(iso: string | null): string {
  if (!iso) return "";
  const detik = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (detik < 90) return "baru saja";
  const menit = Math.round(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jamLalu = Math.round(menit / 60);
  if (jamLalu < 24) return `${jamLalu} jam lalu`;
  return `${Math.round(jamLalu / 24)} hari lalu`;
}

const NAMA_BAYAR: Record<string, string> = {
  va: "Virtual Account",
  gopay: "GoPay",
  qris: "QRIS",
  dana: "DANA",
  kartu: "Kartu",
  cod: "Bayar di tempat (COD)",
  transfer: "Transfer manual",
};

export const namaBayar = (kode: string): string => NAMA_BAYAR[kode] ?? kode.toUpperCase();

/** "0852-1234-5678" dari "6285212345678". */
export function tampilTelepon(telepon: string): string {
  const t = telepon.replace(/\D/g, "");
  const lokal = t.startsWith("62") ? "0" + t.slice(2) : t;
  return lokal.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}
