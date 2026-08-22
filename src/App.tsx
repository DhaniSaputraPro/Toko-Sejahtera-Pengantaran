import { useCallback, useEffect, useState } from "react";
import { konfigurasiLengkap } from "@/lib/supabase";
import { SesiTidakBerlaku, profilSaya } from "@/lib/kurir";
import { ambilToken, hapusSesi, profilTersimpan, type ProfilKurir } from "@/lib/sesi";
import { LayarMasuk } from "@/layar/Masuk";
import { LayarDaftar } from "@/layar/Daftar";
import { LayarBelumMasuk } from "@/layar/BelumMasuk";
import { LayarTugas } from "@/layar/Tugas";
import { LayarSaya } from "@/layar/Saya";
import { IkonOrang, IkonPaket, IkonPeringatan, IkonTruk } from "@/komponen/Ikon";

/**
 * Perutean seadanya, dan memang cukup segini.
 *
 * Aplikasi ini punya SATU jalur yang berarti — `/masuk/<token>`, yang dituju QR
 * — dan sisanya satu layar bertab. Memasang pustaka router untuk itu menambah
 * kilobyte yang harus diunduh kurir lewat jaringan seluler tanpa menjawab
 * pertanyaan apa pun yang belum terjawab tiga puluh baris ini.
 */
function useJalur(): [string, (j: string) => void] {
  const [jalur, setJalur] = useState(() => window.location.pathname);

  useEffect(() => {
    const balik = () => setJalur(window.location.pathname);
    window.addEventListener("popstate", balik);
    return () => window.removeEventListener("popstate", balik);
  }, []);

  const pindah = useCallback((j: string) => {
    // replaceState, bukan pushState: setelah undangan ditukar, tombol Kembali
    // tidak boleh memulangkan kurir ke URL undangan yang sudah hangus.
    window.history.replaceState({}, "", j);
    setJalur(j);
  }, []);

  return [jalur, pindah];
}

type Tab = "tugas" | "saya";

export function Aplikasi() {
  const [jalur, pindah] = useJalur();
  const [profil, setProfil] = useState<ProfilKurir | null>(profilTersimpan);
  const [adaSesi, setAdaSesi] = useState(() => Boolean(ambilToken()));
  const [terputus, setTerputus] = useState(false);
  const [tab, setTab] = useState<Tab>("tugas");

  const keluarSesi = useCallback(() => {
    hapusSesi();
    setAdaSesi(false);
    setProfil(null);
    setTerputus(true);
    pindah("/");
  }, [pindah]);

  // Sesi diperiksa ulang tiap aplikasi dibuka. Admin bisa mencabut peranti atau
  // menonaktifkan mitra kapan saja, dan tanpa pemeriksaan ini kurir baru tahu
  // saat menekan tombol di tengah jalan.
  useEffect(() => {
    if (!adaSesi) return;
    void (async () => {
      try {
        setProfil(await profilSaya());
      } catch (e) {
        if (e instanceof SesiTidakBerlaku) keluarSesi();
        // Galat jaringan dibiarkan: profil tersimpan sudah cukup untuk
        // menggambar layar, dan daftar antar akan melaporkan sendiri kalau
        // sambungannya memang putus.
      }
    })();
  }, [adaSesi, keluarSesi]);

  if (!konfigurasiLengkap) return <LayarKonfigurasi />;

  // Dua jalur masuk, dan sengaja dua alamat. `/masuk/` untuk mitra yang datanya
  // sudah diketik admin; `/rit/` untuk mitra yang memperkenalkan diri sendiri
  // lewat surat jalan cetak. Satu alamat untuk dua maksud akan memaksa layar
  // ini menebak yang mana yang dimaksud.
  const suratJalan = jalur.match(/^\/rit\/([0-9a-f]{64})\/?$/i);
  if (suratJalan) {
    return (
      <LayarDaftar
        token={suratJalan[1].toLowerCase()}
        selesai={(p) => {
          setProfil(p);
          setAdaSesi(true);
          setTerputus(false);
          setTab("tugas");
          pindah("/");
        }}
      />
    );
  }

  const undangan = jalur.match(/^\/masuk\/([0-9a-f]{64})\/?$/i);
  if (undangan) {
    return (
      <LayarMasuk
        token={undangan[1].toLowerCase()}
        selesai={(p) => {
          setProfil(p);
          setAdaSesi(true);
          setTerputus(false);
          setTab("tugas");
          pindah("/");
        }}
      />
    );
  }

  if (!adaSesi) {
    return (
      <>
        {terputus && (
          <div className="layar" style={{ minHeight: 0 }}>
            <div className="isi" style={{ paddingBottom: 0 }}>
              <div className="pesan-galat">
                Sesi Anda sudah tidak berlaku. Bisa jadi admin mencabut peranti ini, atau akun Anda
                sedang dinonaktifkan. Minta QR baru dari admin toko.
              </div>
            </div>
          </div>
        )}
        <LayarBelumMasuk buka={pindah} />
      </>
    );
  }

  return (
    <div className="layar">
      <header className="bilah-atas">
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 34,
            height: 34,
            borderRadius: 11,
            background: "var(--biru)",
            color: "#fff",
          }}
        >
          <IkonTruk ukuran={19} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontWeight: 700, lineHeight: 1.2 }}>
            {profil?.nama ?? "Kurir"}
          </span>
          <span
            className="samar"
            style={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {profil?.toko.nama ?? "Toko Sejahtera"}
          </span>
        </span>
      </header>

      {tab === "tugas" ? (
        <LayarTugas keluarSesi={keluarSesi} />
      ) : (
        <LayarSaya
          profil={profil}
          keluar={() => {
            hapusSesi();
            setAdaSesi(false);
            setProfil(null);
            setTerputus(false);
            pindah("/");
          }}
          keluarSesi={keluarSesi}
        />
      )}

      <nav className="bilah-bawah">
        <button
          className="tab"
          aria-current={tab === "tugas" ? "page" : undefined}
          onClick={() => setTab("tugas")}
        >
          <IkonPaket ukuran={21} />
          Antaran
        </button>
        <button
          className="tab"
          aria-current={tab === "saya" ? "page" : undefined}
          onClick={() => setTab("saya")}
        >
          <IkonOrang ukuran={21} />
          Saya
        </button>
      </nav>
    </div>
  );
}

function LayarKonfigurasi() {
  return (
    <div className="layar">
      <div className="isi" style={{ justifyContent: "center", alignItems: "center", gap: 16 }}>
        <span style={{ color: "var(--merah)" }}>
          <IkonPeringatan ukuran={40} />
        </span>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Aplikasi belum dikonfigurasi
          </div>
          <div className="lembut" style={{ maxWidth: 340 }}>
            <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> belum
            diisi. Keduanya harus menunjuk proyek Supabase yang sama dengan aplikasi admin — kalau
            berbeda, QR dari admin tidak akan pernah dikenali di sini.
          </div>
        </div>
      </div>
    </div>
  );
}
