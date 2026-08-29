import { useEffect, useRef, useState } from "react";
import { intipRit, klaimRit, type IntipRit } from "@/lib/kurir";
import { simpanSesi, type ProfilKurir } from "@/lib/sesi";
import { rp } from "@/lib/format";
import { IkonPaket, IkonPeringatan, IkonTruk } from "@/komponen/Ikon";
import { LogoToko } from "@/komponen/LogoToko";

const KENDARAAN = [
  "Motor",
  "Motor + box",
  "Mobil",
  "Pikap bak terbuka",
  "Pikap box",
  "Truk engkel",
];

/**
 * Jalur masuk KEDUA: mitra memindai QR pada surat jalan cetak dan mengisi
 * datanya sendiri.
 *
 * Bedanya dengan `/masuk/<token>`: di sana data mitra SUDAH diketik admin dan
 * memindai cukup membuka pintu. Di sini toko belum mengenal orangnya — yang
 * dicetak cuma ritnya — jadi mitra yang memperkenalkan diri, lalu rit itu
 * langsung jadi miliknya.
 *
 * Ritnya diintip lebih dulu. Menolak surat jalan kedaluwarsa setelah mitra
 * mengetik empat kolom adalah cara paling mahal menyampaikan penolakan.
 */
export function LayarDaftar({
  token,
  selesai,
}: {
  token: string;
  selesai: (profil: ProfilKurir) => void;
}) {
  const [rit, setRit] = useState<IntipRit | null>(null);
  const [galatAwal, setGalatAwal] = useState("");
  const [galat, setGalat] = useState("");
  const [kirim, setKirim] = useState(false);

  const [nama, setNama] = useState("");
  const [wa, setWa] = useState("");
  const [plat, setPlat] = useState("");
  const [jenis, setJenis] = useState("");
  const sudah = useRef(false);

  useEffect(() => {
    if (sudah.current) return;
    sudah.current = true;
    void (async () => {
      try {
        setRit(await intipRit(token));
      } catch (e) {
        setGalatAwal(
          e instanceof Error ? e.message : "Rit tidak terbaca.",
        );
      }
    })();
  }, [token]);

  // Sudah diambil orang lain — atau oleh Anda sendiri, dan itu tidak bisa
  // dibedakan sebelum nomornya diketik. Layarnya menganggap yang lebih mungkin
  // (orang lain yang menang) dan menyediakan jalan kedua bagi pemegangnya.
  const diambil = rit?.sudah_diambil === true;

  // Cerminan syarat di `rit_klaim`. Ada di sini supaya tombolnya tidak
  // mengundang ditekan untuk kemudian ditolak; yang menegakkan tetap server.
  const angkaWa = wa.replace(/\D/g, "");
  const boleh = nama.trim().length > 0 && angkaWa.length >= 9;

  async function daftar() {
    setKirim(true);
    setGalat("");
    try {
      const hasil = await klaimRit(token, {
        nama: nama.trim(),
        wa: wa.trim(),
        plat: plat.trim(),
        jenis: jenis.trim(),
      });
      simpanSesi(hasil.token, hasil.kurir);
      selesai(hasil.kurir);
    } catch (e) {
      setGalat(e instanceof Error ? e.message : "Gagal mendaftar.");
      setKirim(false);
    }
  }

  if (galatAwal) {
    return (
      <div className="layar">
        <div
          className="isi"
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            gap: 18,
          }}
        >
          <span style={{ color: "var(--merah)" }}>
            <IkonPeringatan ukuran={44} />
          </span>
          <div>
            <div className="judul" style={{ marginBottom: 6 }}>
              Rit tidak berlaku
            </div>
            <div className="lembut" style={{ maxWidth: 330 }}>
              {galatAwal}
            </div>
          </div>
          <div className="samar" style={{ maxWidth: 330 }}>
            Kode berlaku sehari. Minta lembar rit baru ke toko.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layar">
      <div className="isi">
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <span style={{ display: "inline-block", marginBottom: 12 }}>
            <LogoToko ukuran={34} kotak={60} />
          </span>
          <div className="judul-besar">{diambil ? "Sudah diambil" : "Ambil antaran ini"}</div>
          <div className="lembut" style={{ marginTop: 4 }}>
            {diambil
              ? "Sudah lebih dulu diambil pengantar lain."
              : "Siapa lebih dulu mengisi, dia yang dapat."}
          </div>
        </div>

        {rit && (
          <div
            className="kartu"
            style={{ display: "flex", alignItems: "center", gap: 14 }}
          >
            <span style={{ color: "var(--biru)" }}>
              <IkonPaket ukuran={26} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontWeight: 620, fontSize: 16.5 }}>
                {rit.nama?.trim() || rit.kode}
              </span>
              <span className="samar">
                {rit.nama?.trim() ? `${rit.kode} · ` : ""}
                {rit.jumlah} tujuan
              </span>
            </span>
            <span style={{ textAlign: "right" }}>
              <span className="samar" style={{ display: "block" }}>
                {diambil ? "Upah (sudah diambil)" : "Upah"}
              </span>
              <span
                className="angka"
                style={{
                  fontSize: 20,
                  fontWeight: 660,
                  letterSpacing: "-0.02em",
                  color: "var(--biru)",
                }}
              >
                {rp(rit.upah)}
              </span>
            </span>
          </div>
        )}

        {galat && <div className="pesan-galat">{galat}</div>}

        {/* Yang kalah adalah keadaan yang WAJAR di sini, bukan kesalahan: satu
            sebaran dibaca banyak orang dan hanya satu yang menang. Jadi
            layarnya menerangkan, bukan menyalahkan — lalu tetap menyediakan
            jalan bagi pemegangnya yang HP-nya bermasalah. */}
        {diambil && (
          <div
            className="kartu"
            style={{
              background: "var(--kuning-lembut)",
              borderColor: "transparent",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 4,
                color: "var(--kuning)",
              }}
            >
              Pengantar lain lebih cepat
            </div>
            <div className="lembut" style={{ color: "var(--kuning)" }}>
              Tunggu sebaran berikutnya. Kalau ini memang milik Anda, isi nomor WhatsApp yang{" "}
              <em>sama</em> untuk masuk lagi.
            </div>
          </div>
        )}

        <div className="kartu" style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span className="judul-kecil">
              Nama <span style={{ color: "var(--merah)" }}>*</span>
            </span>
            <input
              className="medan"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama lengkap Anda"
              autoComplete="name"
              disabled={kirim}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="judul-kecil">
              Nomor WhatsApp <span style={{ color: "var(--merah)" }}>*</span>
            </span>
            <input
              className="medan"
              value={wa}
              onChange={(e) => setWa(e.target.value)}
              placeholder="0852-1234-5678"
              inputMode="tel"
              autoComplete="tel"
              disabled={kirim}
            />
            <span className="samar">Dipakai toko untuk menghubungi dan mengenali Anda.</span>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="judul-kecil">Plat nomor</span>
            <input
              className="medan"
              value={plat}
              onChange={(e) => setPlat(e.target.value.toUpperCase())}
              placeholder="DS 1234 AB"
              disabled={kirim}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span className="judul-kecil">Jenis kendaraan</span>
            <input
              className="medan"
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              placeholder="Motor, pikap, …"
              list="kendaraan"
              disabled={kirim}
            />
            <datalist id="kendaraan">
              {KENDARAAN.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
          </label>
        </div>

        <button
          className="tombol tombol-utama tombol-penuh"
          disabled={!boleh || kirim || !rit}
          onClick={() => void daftar()}
        >
          {kirim ? <span className="putar" /> : <IkonTruk ukuran={19} />}
          {kirim
            ? "Menyiapkan…"
            : diambil
              ? "Masuk sebagai pemegangnya"
              : `Ambil ${rit?.jumlah ?? ""} antaran`}
        </button>

        {!boleh && (
          <div className="samar" style={{ textAlign: "center" }}>
            Nama dan nomor WhatsApp wajib.
          </div>
        )}
      </div>
    </div>
  );
}
