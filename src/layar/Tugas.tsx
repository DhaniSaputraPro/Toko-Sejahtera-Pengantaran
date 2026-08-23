import { useCallback, useEffect, useMemo, useState } from "react";
import { SesiTidakBerlaku, ambilTugas, type Tugas } from "@/lib/kurir";
import { jarakKm, tampilJarak } from "@/lib/jarak";
import { tautanNavigasi } from "@/lib/peta";
import { rp, sejak } from "@/lib/format";
import { usePosisi, type Titik } from "@/lib/posisi";
import {
  IkonMuatUlang,
  IkonNavigasi,
  IkonPaket,
  IkonPin,
  IkonTruk,
} from "@/komponen/Ikon";
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
        {/* Ringkasan hari ini */}
        <div className="kartu">
          <div style={{ fontSize: 19, fontWeight: 700 }}>
            {baris.length === 0
              ? "Belum ada antaran"
              : `${baris.length} antaran${belumDijemput > 0 ? `, ${belumDijemput} perlu dijemput` : ""}`}
          </div>
          <div className="lembut" style={{ marginTop: 3 }}>
            {baris.length === 0
              ? "Tugas akan muncul di sini begitu admin toko meneruskan pesanan ke Anda."
              : totalTagih > 0
                ? `Uang COD yang harus Anda tagih hari ini: ${rp(totalTagih)}`
                : "Semua pesanan sudah lunas — tidak ada uang yang perlu ditagih."}
          </div>
        </div>

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
          baris.map((b) => (
            <KartuTugas key={b.t.id} baris={b} buka={() => setDibuka(b.t.id)} />
          ))
        )}

        {daftar !== null && baris.length === 0 && !galat && (
          <div
            className="kartu"
            style={{ textAlign: "center", padding: "34px 18px", color: "var(--teks-samar)" }}
          >
            <div style={{ display: "grid", placeItems: "center", marginBottom: 10 }}>
              <IkonPaket ukuran={30} />
            </div>
            <div className="lembut">Tidak ada paket yang menunggu diantar.</div>
          </div>
        )}

        <button
          className="tombol tombol-penuh"
          onClick={() => void muat()}
          disabled={memuat}
          style={{ marginTop: 2 }}
        >
          {memuat ? <span className="putar" /> : <IkonMuatUlang ukuran={18} />}
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
        <IkonPin ukuran={14} />
        Diurutkan dari yang terdekat dengan posisi Anda
        {posisi.titik && posisi.titik.akurasi > 120 && (
          <span> · sinyal GPS masih kasar (±{Math.round(posisi.titik.akurasi)} m)</span>
        )}
      </div>
    );
  }

  if (posisi.keadaan === "ditolak" || posisi.keadaan === "gagal") {
    return (
      <div className="kartu" style={{ background: "var(--kuning-lembut)", borderColor: "transparent" }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>
          {posisi.keadaan === "ditolak" ? "Izin lokasi ditolak" : "Lokasi tidak terbaca"}
        </div>
        <div className="lembut" style={{ color: "var(--kuning)" }}>
          Daftar di bawah diurutkan dari yang paling dulu diteruskan, bukan dari yang terdekat.
          {posisi.keadaan === "ditolak" &&
            " Untuk mengurutkan dari yang terdekat, izinkan lokasi lewat ikon gembok di sebelah alamat situs."}
        </div>
      </div>
    );
  }

  if (posisi.nyala) {
    return (
      <div className="baris samar" style={{ padding: "0 4px", gap: 8 }}>
        <span className="putar" style={{ width: 14, height: 14 }} /> Mencari posisi Anda…
      </div>
    );
  }

  return (
    <button className="kartu kartu-ketuk" onClick={posisi.nyalakan} style={{ cursor: "pointer" }}>
      <div className="baris" style={{ gap: 10 }}>
        <span style={{ color: "var(--biru)" }}>
          <IkonPin ukuran={22} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 600 }}>
            Urutkan dari yang terdekat
          </span>
          <span className="samar">Ketuk untuk mengizinkan aplikasi membaca lokasi Anda.</span>
        </span>
      </div>
    </button>
  );
}

/* ------------------------------ kartu tugas ------------------------------ */

function KartuTugas({ baris, buka }: { baris: Baris; buka: () => void }) {
  const { t, jarak } = baris;
  const nav = tautanNavigasi(t.alamat, t.lat, t.lng);
  const tagih = perluTagih(t);
  const dibawa = Boolean(t.dijemput_pada);

  return (
    <div className="kartu" style={{ padding: 0, overflow: "hidden" }}>
      <button className="kartu-ketuk" onClick={buka} style={{ border: 0, background: "none", padding: 14 }}>
        <div className="baris" style={{ gap: 7, marginBottom: 7 }}>
          {jarak != null ? (
            <span className="lencana lencana-biru angka">
              <IkonPin ukuran={13} /> {tampilJarak(jarak)}
            </span>
          ) : (
            <span className="lencana lencana-abu">Jarak tak diketahui</span>
          )}
          <span className={`lencana ${dibawa ? "lencana-ungu" : "lencana-kuning"}`}>
            {dibawa ? "Sedang diantar" : "Perlu dijemput di toko"}
          </span>
          {tagih > 0 && <span className="lencana lencana-hijau angka">Tagih {rp(tagih)}</span>}
        </div>

        <div style={{ fontSize: 16.5, fontWeight: 700, lineHeight: 1.25 }}>{t.nama_penerima}</div>

        <div className="lembut" style={{ marginTop: 3, lineHeight: 1.45 }}>
          {t.alamat || <em style={{ color: "var(--merah)" }}>Alamat tidak ditulis pembeli</em>}
        </div>
        {t.patokan && (
          <div className="samar" style={{ marginTop: 2 }}>
            Patokan: {t.patokan}
          </div>
        )}

        <div className="samar angka" style={{ marginTop: 6 }}>
          {t.nomor} · {t.barang.length} jenis barang · {rp(t.total)}
          {t.siap_jemput_pada && ` · ${sejak(t.siap_jemput_pada)}`}
        </div>
      </button>

      {/* Navigasi dibuat sebagai baris tersendiri selebar kartu, bukan tombol
          kecil di pojok: inilah yang paling sering ditekan, dan sering ditekan
          sambil berdiri di atas motor. */}
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
          <span className="tombol" style={{ flex: 1, border: 0, borderRadius: 0, color: "var(--teks-samar)" }}>
            Tidak ada alamat
          </span>
        )}
        <button
          className="tombol"
          onClick={buka}
          style={{
            flex: 1,
            border: 0,
            borderLeft: "1px solid var(--garis)",
            borderRadius: 0,
            background: "none",
          }}
        >
          <IkonTruk ukuran={18} /> {dibawa ? "Sampai tujuan" : "Rincian"}
        </button>
      </div>
    </div>
  );
}
