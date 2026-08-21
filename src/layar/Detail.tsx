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
            {dibawa ? `Diantar sejak ${jam(tugas.dijemput_pada)}` : "Perlu dijemput di toko"}
          </span>
          {jarak != null && (
            <span className="lencana lencana-biru angka">{tampilJarak(jarak)} dari Anda</span>
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
              <span style={{ color: "var(--merah)" }}>
                Pembeli tidak menulis alamat. Hubungi dulu sebelum berangkat.
              </span>
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

          <div className="baris" style={{ gap: 8, marginTop: 12 }}>
            {nav && (
              <a
                className="tombol tombol-utama"
                href={nav}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: "1 1 160px" }}
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
                  style={{ flex: "1 1 120px" }}
                >
                  <IkonChat ukuran={18} /> WhatsApp
                </a>
                <a
                  className="tombol"
                  href={tautanTelepon(tugas.telepon)}
                  style={{ flex: "0 0 auto", minWidth: 52, padding: 0 }}
                  aria-label={`Telepon ${tampilTelepon(tugas.telepon)}`}
                >
                  <IkonTelepon ukuran={18} />
                </a>
              </>
            )}
          </div>
        </div>

        {/* Uang — bagian yang paling menentukan apa yang harus dilakukan
            kurir saat sampai, jadi ditaruh sebelum daftar barang. */}
        <div
          className="kartu"
          style={{
            marginBottom: 12,
            ...(cod
              ? { background: "var(--hijau-lembut)", borderColor: "rgba(20,128,60,.22)" }
              : {}),
          }}
        >
          <div className="judul-kecil" style={{ marginBottom: 6 }}>
            Pembayaran
          </div>
          {cod ? (
            <>
              <div style={{ fontSize: 21, fontWeight: 800 }} className="angka">
                Tagih {rp(tugas.total)}
              </div>
              <div className="lembut" style={{ color: "var(--hijau)" }}>
                Bayar di tempat — terima uangnya sebelum barang diserahkan.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 600 }}>
                {tugas.status_bayar === "dibayar" ? "Sudah lunas" : "Belum lunas"} ·{" "}
                {namaBayar(tugas.metode_bayar)}
              </div>
              <div className="lembut angka">
                Nilai pesanan {rp(tugas.total)} — tidak ada yang perlu Anda tagih.
              </div>
            </>
          )}
        </div>

        {/* Barang */}
        <div className="kartu" style={{ marginBottom: 12 }}>
          <div className="judul-kecil" style={{ marginBottom: 8 }}>
            Isi paket · {tugas.nomor}
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
                <IkonCentang ukuran={19} /> Barang sudah diterima
              </button>
            )}
            <button className="tombol tombol-bahaya tombol-penuh" onClick={() => setMode("gagal")}>
              <IkonPeringatan ukuran={18} /> Antaran gagal
            </button>
          </div>
        )}

        {mode === "selesai" && (
          <div className="kartu" style={{ display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Selesaikan antaran</div>

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
                  <span className="samar" style={{ display: "block" }}>
                    Centang ini menandai pesanannya lunas di sistem toko.
                  </span>
                </span>
              </label>
            )}

            <div>
              <label
                className="tombol tombol-penuh"
                style={{ cursor: mengunggah ? "default" : "pointer" }}
              >
                <IkonKamera ukuran={18} />
                {mengunggah ? "Mengunggah…" : buktiUrl ? "Ganti foto bukti" : "Foto bukti (boleh dilewati)"}
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
              placeholder="Catatan, mis. diterima anaknya (boleh kosong)"
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
                {sibuk ? "Menyimpan…" : "Tandai selesai"}
              </button>
              <button className="tombol" onClick={() => setMode("lihat")} disabled={sibuk}>
                Batal
              </button>
            </div>

            {cod && !codDiterima && (
              <div className="samar" style={{ color: "var(--kuning)" }}>
                Uangnya belum dicentang diterima — pesanan tetap tercatat belum lunas.
              </div>
            )}
          </div>
        )}

        {mode === "gagal" && (
          <div className="kartu" style={{ display: "grid", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Antaran gagal</div>
            <div className="lembut">
              Paket kembali ke toko dan tugas ini lepas dari Anda. Admin akan melihat alasannya dan
              memutuskan langkah berikutnya.
            </div>
            <textarea
              className="medan"
              rows={3}
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Apa yang terjadi? Mis. rumah kosong, alamat tidak ketemu, pembeli menolak"
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
