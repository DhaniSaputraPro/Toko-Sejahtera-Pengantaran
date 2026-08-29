import { useCallback, useEffect, useMemo, useState } from "react";
import { SesiTidakBerlaku, ambilTugas, type Tugas } from "@/lib/kurir";
import { jarakKm, tampilJarak } from "@/lib/jarak";
import { tautanNavigasi } from "@/lib/peta";
import { rp } from "@/lib/format";
import { usePosisi, type Titik } from "@/lib/posisi";
import { IkonMuatUlang, IkonNavigasi, IkonPaket, IkonPin } from "@/komponen/Ikon";
import { LembarTugas } from "./Detail";

/** Satu tugas beserta jaraknya dari posisi kurir sekarang. null = tak diketahui. */
interface Baris {
  t: Tugas;
  jarak: number | null;
}

/**
 * Urutkan dari yang paling dekat dengan kurir.
 *
 * Yang belum dijemput didahulukan sebagai kelompok, baru di dalamnya diurut
 * jarak. Alasannya bukan estetika: yang belum dijemput masih ADA DI TOKO, dan
 * menyelipkannya di antara tujuan-tujuan antar berarti menyuruh kurir bolak-balik
 * ke toko di tengah rute.
 *
 * Tugas tanpa titik pin jatuh ke dasar kelompoknya. Jaraknya memang tidak
 * diketahui, dan menebaknya dari tulisan alamat akan menaruhnya di urutan yang
 * salah dengan percaya diri — lebih buruk daripada mengaku tidak tahu.
 */
function urutkan(daftar: Tugas[], titik: Titik | null): Baris[] {
  const baris: Baris[] = daftar.map((t) => ({
    t,
    jarak:
      titik && t.lat != null && t.lng != null
        ? jarakKm(titik.lat, titik.lng, t.lat, t.lng)
        : null,
  }));

  return baris.sort((a, b) => {
    const aJemput = a.t.dijemput_pada ? 1 : 0;
    const bJemput = b.t.dijemput_pada ? 1 : 0;
    if (aJemput !== bJemput) return aJemput - bJemput;
    if (a.jarak != null && b.jarak != null) return a.jarak - b.jarak;
    if (a.jarak != null) return -1;
    if (b.jarak != null) return 1;
    // Tanpa jarak, yang lebih dulu diteruskan dikerjakan lebih dulu.
    return (a.t.siap_jemput_pada ?? "").localeCompare(b.t.siap_jemput_pada ?? "");
  });
}

const perluTagih = (t: Tugas): number =>
  t.metode_bayar === "cod" && t.status_bayar !== "dibayar" ? t.total : 0;

export function LayarTugas({ keluarSesi }: { keluarSesi: () => void }) {
  const [daftar, setDaftar] = useState<Tugas[] | null>(null);
  const [galat, setGalat] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [dibuka, setDibuka] = useState<string | null>(null);
  const posisi = usePosisi();

  const muat = useCallback(
    async (diam = false) => {
      if (!diam) setMemuat(true);
      try {
        setDaftar(await ambilTugas());
        setGalat("");
      } catch (e) {
        if (e instanceof SesiTidakBerlaku) keluarSesi();
        else setGalat(e instanceof Error ? e.message : "Gagal memuat daftar antar.");
      } finally {
        setMemuat(false);
      }
    },
    [keluarSesi],
  );

  useEffect(() => {
    void muat();
    // Disegarkan berkala supaya tugas yang baru diteruskan admin muncul tanpa
    // kurir harus ingat menariknya. Satu menit: cukup cepat untuk terasa hidup,
    // cukup jarang untuk tidak menggerus kuota sepanjang hari.
    const t = setInterval(() => void muat(true), 60_000);
    // Kembali ke aplikasi setelah membuka Google Maps adalah saat paling
    // mungkin ada yang berubah, jadi itu ikut memicu penyegaran.
    const bangun = () => {
      if (document.visibilityState === "visible") void muat(true);
    };
    document.addEventListener("visibilitychange", bangun);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", bangun);
    };
  }, [muat]);

  const baris = useMemo(() => urutkan(daftar ?? [], posisi.titik), [daftar, posisi.titik]);
  const terbuka = useMemo(() => baris.find((b) => b.t.id === dibuka) ?? null, [baris, dibuka]);

  const belumDijemput = baris.filter((b) => !b.t.dijemput_pada).length;
  const totalTagih = baris.reduce((s, b) => s + perluTagih(b.t), 0);

  return (
    <>
      <div className="isi">
        {/* Ringkasan: satu baris, dan cuma dua angka yang benar-benar dipakai
            kurir sebelum berangkat — berapa antaran, dan berapa uang yang harus
            pulang bersamanya. */}
        {baris.length > 0 && (
          <div className="baris" style={{ padding: "0 4px", gap: 8 }}>
            <strong className="judul">{baris.length} antaran</strong>
            {belumDijemput > 0 && (
              <span className="lencana lencana-kuning">{belumDijemput} di toko</span>
            )}
            <span style={{ flex: 1 }} />
            {totalTagih > 0 && (
              <span className="lencana lencana-hijau angka">Tagih {rp(totalTagih)}</span>
            )}
          </div>
        )}

        <BilahPosisi posisi={posisi} adaTugas={baris.length > 0} />

        {galat && (
          <div className="pesan-galat">
            {galat}
            <button
              className="tombol tombol-kecil"
              style={{ marginTop: 10 }}
              onClick={() => void muat()}
            >
              Coba lagi
            </button>
          </div>
        )}

        {daftar === null && !galat ? (
          <div className="kartu" style={{ display: "grid", placeItems: "center", padding: 34 }}>
            <div className="putar" />
          </div>
        ) : (
          baris.map((b, i) => (
            <KartuTugas key={b.t.id} urut={i + 1} baris={b} buka={() => setDibuka(b.t.id)} />
          ))
        )}

        {daftar !== null && baris.length === 0 && !galat && (
          <div
            className="kartu"
            style={{ textAlign: "center", padding: "40px 18px", color: "var(--teks-samar)" }}
          >
            <div style={{ display: "grid", placeItems: "center", marginBottom: 10 }}>
              <IkonPaket ukuran={30} />
            </div>
            <div className="lembut">Belum ada antaran.</div>
          </div>
        )}

        {/* Daftar menyegarkan diri tiap menit dan tiap kali aplikasi dibuka
            kembali, jadi tombol ini cuma untuk yang tidak sabar — kecil, dan
            tidak ikut mengambil perhatian dari kartu di atasnya. */}
        <button
          className="tombol tombol-kecil tombol-polos"
          onClick={() => void muat()}
          disabled={memuat}
          style={{ alignSelf: "center", color: "var(--teks-samar)" }}
        >
          {memuat ? <span className="putar" /> : <IkonMuatUlang ukuran={16} />}
          {memuat ? "Memuat…" : "Muat ulang"}
        </button>
      </div>

      {terbuka && (
        <LembarTugas
          tugas={terbuka.t}
          jarak={terbuka.jarak}
          tutup={() => setDibuka(null)}
          berubah={() => {
            setDibuka(null);
            void muat();
          }}
          keluarSesi={keluarSesi}
        />
      )}
    </>
  );
}

/* --------------------------- bilah izin lokasi --------------------------- */

/**
 * Izin lokasi diminta lewat ketukan sadar, bukan saat aplikasi dibuka.
 *
 * Peramban menampilkan permintaan izin sekali saja per situs; sekali ditolak,
 * pintunya tertutup untuk seterusnya dan hanya bisa dibuka dari pengaturan
 * peramban — tempat yang tidak akan ditemukan kurir. Meminta sebelum ia tahu
 * untuk apa hampir menjamin penolakan itu terjadi.
 */
function BilahPosisi({
  posisi,
  adaTugas,
}: {
  posisi: ReturnType<typeof usePosisi>;
  adaTugas: boolean;
}) {
  if (!adaTugas) return null;

  if (posisi.keadaan === "ada") {
    return (
      <div className="baris samar" style={{ padding: "0 4px", gap: 6 }}>
        <IkonPin ukuran={13} />
        Terdekat di atas
      </div>
    );
  }

  if (posisi.keadaan === "ditolak" || posisi.keadaan === "gagal") {
    return (
      <div className="baris samar" style={{ padding: "0 4px", gap: 6, color: "var(--kuning)" }}>
        <IkonPin ukuran={13} />
        Lokasi mati — urutan mengikuti waktu masuk
      </div>
    );
  }

  if (posisi.nyala) {
    return (
      <div className="baris samar" style={{ padding: "0 4px", gap: 8 }}>
        <span className="putar" style={{ width: 13, height: 13 }} /> Mencari posisi…
      </div>
    );
  }

  return (
    <button
      className="tombol tombol-penuh"
      onClick={posisi.nyalakan}
      style={{ justifyContent: "flex-start", gap: 9, color: "var(--biru)" }}
    >
      <IkonPin ukuran={18} /> Urutkan dari yang terdekat
    </button>
  );
}

/* ------------------------------ kartu tugas ------------------------------ */

/**
 * Satu antaran, dibaca sambil berdiri.
 *
 * Empat hal saja, dan urutannya mengikuti pertanyaan kurir: yang mana giliran
 * ini (nomor urut), ke siapa, ke mana, dan apa yang harus dibawa pulang
 * (uang COD). Sisanya — isi paket, patokan, nomor telepon — ada di rincian,
 * dibuka dengan mengetuk kartunya.
 *
 * Satu tombol di kaki kartu, bukan dua. "Rincian" dulu berdiri di sana padahal
 * mengetuk kartunya sendiri sudah membukanya; yang tersisa Navigasi, yang
 * memang paling sering ditekan dan sering ditekan sambil di atas motor.
 */
function KartuTugas({ urut, baris, buka }: { urut: number; baris: Baris; buka: () => void }) {
  const { t, jarak } = baris;
  const nav = tautanNavigasi(t.alamat, t.lat, t.lng);
  const tagih = perluTagih(t);
  const dibawa = Boolean(t.dijemput_pada);

  return (
    <div className="kartu" style={{ padding: 0, overflow: "hidden" }}>
      <button
        className="kartu-ketuk"
        onClick={buka}
        style={{ border: 0, background: "none", padding: 13 }}
      >
        <div className="baris" style={{ gap: 10, flexWrap: "nowrap", alignItems: "flex-start" }}>
          <span className="urutan angka">{urut}</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: "block",
                fontSize: 16.5,
                fontWeight: 620,
                letterSpacing: "-0.018em",
                lineHeight: 1.25,
              }}
            >
              {t.nama_penerima}
            </span>
            <span className="lembut" style={{ display: "block", marginTop: 2, lineHeight: 1.4 }}>
              {t.alamat || <em style={{ color: "var(--merah)" }}>Alamat tidak ditulis</em>}
            </span>
          </span>
          {jarak != null && (
            <span className="angka" style={{ fontWeight: 600, color: "var(--biru)" }}>
              {tampilJarak(jarak)}
            </span>
          )}
        </div>

        <div className="baris" style={{ gap: 6, marginTop: 9 }}>
          <span className={`lencana ${dibawa ? "lencana-ungu" : "lencana-kuning"}`}>
            {dibawa ? "Dibawa" : "Di toko"}
          </span>
          {tagih > 0 && <span className="lencana lencana-hijau angka">Tagih {rp(tagih)}</span>}
          <span style={{ flex: 1 }} />
          <span className="samar angka">{t.nomor}</span>
        </div>
      </button>

      <div style={{ display: "flex", borderTop: "1px solid var(--garis)" }}>
        {nav ? (
          <a
            className="tombol"
            href={nav}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              border: 0,
              borderRadius: 0,
              color: "var(--biru)",
              background: "none",
            }}
          >
            <IkonNavigasi ukuran={18} /> Navigasi
          </a>
        ) : (
          <span
            className="tombol"
            style={{ flex: 1, border: 0, borderRadius: 0, color: "var(--teks-samar)" }}
          >
            Tidak ada alamat
          </span>
        )}
      </div>
    </div>
  );
}
