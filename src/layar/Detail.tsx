import { useState } from "react";
import {
  SesiTidakBerlaku,
  gagalkan,
  jemput,
  selesaikan,
  unggahBukti,
  type Tugas,
} from "@/lib/kurir";
import { kecilkan } from "@/lib/gambar";
import { tautanNavigasi, tautanTelepon, tautanWa } from "@/lib/peta";
import { jam, namaBayar, rp, tampilTelepon } from "@/lib/format";
import { tampilJarak } from "@/lib/jarak";
import {
  IkonCentang,
  IkonChat,
  IkonKamera,
  IkonNavigasi,
  IkonPeringatan,
  IkonSilang,
  IkonTelepon,
  IkonTruk,
} from "@/komponen/Ikon";

type Mode = "lihat" | "selesai" | "gagal";

/**
 * Rincian satu antaran, sebagai lembar yang naik dari bawah.
 *
 * Lembar, bukan halaman tersendiri: kurir membukanya untuk memeriksa satu hal
 * (patokannya apa, uangnya berapa) lalu menutupnya lagi, dan lembar
 * mengembalikannya ke daftar tanpa memuat ulang apa pun.
 */
export function LembarTugas({
  tugas,
  jarak,
  tutup,
  berubah,
  keluarSesi,
}: {
  tugas: Tugas;
  jarak: number | null;
  tutup: () => void;
  berubah: () => void;
  keluarSesi: () => void;
}) {
  const [mode, setMode] = useState<Mode>("lihat");
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState("");

  const [catatan, setCatatan] = useState("");
  const [alasan, setAlasan] = useState("");
  const [buktiUrl, setBuktiUrl] = useState("");
  const [mengunggah, setMengunggah] = useState(false);
  const cod = tugas.metode_bayar === "cod" && tugas.status_bayar !== "dibayar";
  const [codDiterima, setCodDiterima] = useState(cod);

  const dibawa = Boolean(tugas.dijemput_pada);
  const nav = tautanNavigasi(tugas.alamat, tugas.lat, tugas.lng);

  async function jalankan(kerja: () => Promise<unknown>) {
    setSibuk(true);
    setGalat("");
    try {
      await kerja();
      berubah();
    } catch (e) {
      if (e instanceof SesiTidakBerlaku) keluarSesi();
      else setGalat(e instanceof Error ? e.message : "Gagal menyimpan.");
    } finally {
      setSibuk(false);
    }
  }

  async function pilihFoto(berkas: File) {
    setMengunggah(true);
    setGalat("");
    try {
      setBuktiUrl(await unggahBukti(tugas.id, await kecilkan(berkas)));
    } catch (e) {
      if (e instanceof SesiTidakBerlaku) keluarSesi();
      else setGalat(e instanceof Error ? e.message : "Gagal mengunggah foto.");
    } finally {
      setMengunggah(false);
    }
  }

  return (
    <div className="tirai" onClick={tutup} role="presentation">
      <div
        className="lembar"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Antaran ${tugas.nomor}`}
      >
        <div className="pegangan" />

        {/* Kepala */}
        <div className="baris" style={{ gap: 8, marginBottom: 12 }}>
          <span className={`lencana ${dibawa ? "lencana-ungu" : "lencana-kuning"}`}>
            {dibawa ? `Dibawa sejak ${jam(tugas.dijemput_pada)}` : "Di toko"}
          </span>
          {jarak != null && (
            <span className="lencana lencana-biru angka">{tampilJarak(jarak)}</span>
          )}
          <span style={{ flex: 1 }} />
          <button
            className="tombol tombol-kecil"
            onClick={tutup}
            aria-label="Tutup"
            style={{ minWidth: 38, padding: 0 }}
          >
            <IkonSilang ukuran={18} />
          </button>
        </div>

        {galat && (
          <div className="pesan-galat" style={{ marginBottom: 12 }}>
            {galat}
          </div>
        )}

        {/* Tujuan */}
        <div className="kartu" style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 19, fontWeight: 700 }}>{tugas.nama_penerima}</div>
          <div style={{ marginTop: 6, lineHeight: 1.5 }}>
            {tugas.alamat || (
              <span style={{ color: "var(--merah)" }}>Alamat tidak ditulis — hubungi dulu.</span>
            )}
          </div>
          {tugas.patokan && (
            <div className="lembut" style={{ marginTop: 6 }}>
              <strong>Patokan:</strong> {tugas.patokan}
            </div>
          )}

          {tugas.foto_alamat_url && (
            <a href={tugas.foto_alamat_url} target="_blank" rel="noopener noreferrer">
              <img
                src={tugas.foto_alamat_url}
                alt="Foto depan rumah dari pembeli"
                loading="lazy"
                style={{
                  marginTop: 10,
                  width: "100%",
                  maxHeight: 190,
                  objectFit: "cover",
                  borderRadius: 12,
                  display: "block",
                }}
              />
            </a>
          )}

          <div className="baris" style={{ gap: 8, marginTop: 12, flexWrap: "nowrap" }}>
            {nav && (
              <a
                className="tombol tombol-utama"
                href={nav}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: "1 1 120px", minWidth: 0 }}
              >
                <IkonNavigasi ukuran={18} /> Navigasi
              </a>
            )}
            {tugas.telepon && (
              <>
                <a
                  className="tombol"
                  href={tautanWa(
                    tugas.telepon,
                    `Halo ${tugas.nama_penerima}, saya kurir Toko Sejahtera yang mengantar pesanan ${tugas.nomor}.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ flex: "1 1 96px", minWidth: 0 }}
                >
                  <IkonChat ukuran={18} /> WhatsApp
                </a>
                <a
                  className="tombol"
                  href={tautanTelepon(tugas.telepon)}
                  style={{ flex: "0 0 auto", width: 48, minWidth: 48, padding: 0 }}
                  aria-label={`Telepon ${tampilTelepon(tugas.telepon)}`}
                >
                  <IkonTelepon ukuran={18} />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Uang. Yang COD mendapat kartunya sendiri — itu satu-satunya hal di
            layar ini yang menuntut kurir melakukan sesuatu saat sampai. Yang
            sudah lunas tidak menuntut apa pun, jadi ia cukup menumpang di kepala
            daftar barang alih-alih memakai satu kartu penuh untuk mengabarkan
            bahwa tidak ada yang perlu dikerjakan. */}
        {cod && (
          <div
            className="kartu"
            style={{
              marginBottom: 12,
              background: "var(--hijau-lembut)",
              borderColor: "rgba(20,128,60,.22)",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 800 }} className="angka">
              Tagih {rp(tugas.total)}
            </div>
            <div className="samar" style={{ color: "var(--hijau)" }}>
              Bayar di tempat
            </div>
          </div>
        )}

        {/* Barang */}
        <div className="kartu" style={{ marginBottom: 12 }}>
          <div className="baris" style={{ gap: 8, marginBottom: 8 }}>
            <span className="judul-kecil" style={{ flex: 1 }}>
              Isi paket · {tugas.nomor}
            </span>
            {!cod && (
              <span className="samar angka">
                {tugas.status_bayar === "dibayar" ? "Lunas" : namaBayar(tugas.metode_bayar)} ·{" "}
                {rp(tugas.total)}
              </span>
            )}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {tugas.barang.map((b, i) => (
              <div key={i} className="baris" style={{ gap: 10, alignItems: "flex-start" }}>
                <span className="angka" style={{ minWidth: 34, fontWeight: 700 }}>
                  {b.jumlah}×
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>{b.nama}</span>
              </div>
            ))}
            {tugas.barang.length === 0 && <span className="samar">Rincian barang tidak ada.</span>}
          </div>
          {tugas.catatan && (
            <div className="lembut" style={{ marginTop: 10 }}>
              <strong>Catatan pembeli:</strong> {tugas.catatan}
            </div>
          )}
        </div>

        {/* Tindakan */}
        {mode === "lihat" && (
          <div style={{ display: "grid", gap: 8 }}>
            {!dibawa ? (
              <button
                className="tombol tombol-hijau tombol-penuh"
                disabled={sibuk}
                onClick={() => void jalankan(() => jemput(tugas.id))}
              >
                <IkonTruk ukuran={19} />
                {sibuk ? "Menyimpan…" : "Sudah saya jemput"}
              </button>
            ) : (
              <button
                className="tombol tombol-hijau tombol-penuh"
                onClick={() => setMode("selesai")}
              >
                <IkonCentang ukuran={19} /> Sudah saya antar
              </button>
            )}
            <button className="tombol tombol-bahaya tombol-penuh" onClick={() => setMode("gagal")}>
              <IkonPeringatan ukuran={18} /> Antaran gagal
            </button>
          </div>
        )}

        {mode === "selesai" && (
          <div className="kartu" style={{ display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Sampai di tujuan</div>

            {cod && (
              <label className="baris" style={{ gap: 10, cursor: "pointer", alignItems: "flex-start" }}>
                <input
                  type="checkbox"
                  checked={codDiterima}
                  onChange={(e) => setCodDiterima(e.target.checked)}
                  style={{ width: 22, height: 22, marginTop: 1, accentColor: "var(--hijau)" }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <strong className="angka">Uang {rp(tugas.total)} sudah saya terima</strong>
                </span>
              </label>
            )}

            <div>
              <label
                className="tombol tombol-penuh"
                style={{ cursor: mengunggah ? "default" : "pointer" }}
              >
                <IkonKamera ukuran={18} />
                {mengunggah ? "Mengunggah…" : buktiUrl ? "Ganti foto" : "Foto bukti"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={mengunggah}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void pilihFoto(f);
                    e.target.value = "";
                  }}
                  style={{ display: "none" }}
                />
              </label>
              {buktiUrl && (
                <img
                  src={buktiUrl}
                  alt="Bukti serah terima"
                  style={{
                    marginTop: 8,
                    width: 96,
                    height: 96,
                    objectFit: "cover",
                    borderRadius: 12,
                    display: "block",
                  }}
                />
              )}
            </div>

            <input
              className="medan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              placeholder="Catatan, mis. diterima anaknya"
            />

            <div className="baris" style={{ gap: 8 }}>
              <button
                className="tombol tombol-hijau"
                style={{ flex: 1 }}
                disabled={sibuk || mengunggah}
                onClick={() =>
                  void jalankan(() =>
                    selesaikan(tugas.id, {
                      catatan: catatan.trim(),
                      buktiUrl,
                      codDiterima: cod && codDiterima,
                    }),
                  )
                }
              >
                {sibuk ? "Menyimpan…" : "Tandai sampai tujuan"}
              </button>
              <button className="tombol" onClick={() => setMode("lihat")} disabled={sibuk}>
                Batal
              </button>
            </div>

            {cod && !codDiterima && (
              <div className="samar" style={{ color: "var(--kuning)" }}>
                Belum dicentang: pesanan tetap tercatat belum lunas.
              </div>
            )}
          </div>
        )}

        {mode === "gagal" && (
          <div className="kartu" style={{ display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Antaran gagal</div>
            <div className="samar">Paket kembali ke toko.</div>
            <textarea
              className="medan"
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Apa yang terjadi? Mis. rumah kosong, alamat tidak ketemu"
            />
            <div className="baris" style={{ gap: 8 }}>
              <button
                className="tombol tombol-bahaya"
                style={{ flex: 1 }}
                disabled={sibuk || alasan.trim().length < 3}
                onClick={() => void jalankan(() => gagalkan(tugas.id, alasan.trim()))}
              >
                {sibuk ? "Menyimpan…" : "Catat gagal antar"}
              </button>
              <button className="tombol" onClick={() => setMode("lihat")} disabled={sibuk}>
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
