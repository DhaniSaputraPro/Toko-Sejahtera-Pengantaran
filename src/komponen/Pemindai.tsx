import { useCallback, useEffect, useRef, useState } from "react";
import { adaSenter, buatPembaca, bukaKamera, setelSenter } from "@/lib/pindai";
import { IkonPeringatan, IkonQr, IkonSenter, IkonSilang } from "@/komponen/Ikon";

/** Jeda antar pemeriksaan bingkai. */
const JEDA = 90;

/**
 * Pemindai QR satu layar penuh.
 *
 * Yang MENILAI isi QR bukan komponen ini melainkan layar yang memanggilnya,
 * lewat `terima`. Alasannya: hanya pemanggil yang tahu QR mana yang masuk akal
 * baginya, dan pemindai yang ikut menilai akan menutup diri sendiri untuk QR
 * yang sebenarnya salah tempat. `terima` mengembalikan `false` untuk QR yang
 * bukan miliknya, dan pemindainya tetap menyala sambil menerangkan apa yang
 * barusan terbaca — kurir tidak perlu membuka ulang kamera untuk tiap coba.
 */
export function Pemindai({
  judul,
  petunjuk,
  tutup,
  terima,
}: {
  judul: string;
  petunjuk: string;
  tutup: () => void;
  terima: (teks: string) => boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const aliranRef = useRef<MediaStream | null>(null);
  const jalanRef = useRef(true);
  const terakhirRef = useRef("");

  // `terima` lahir baru tiap gambar ulang. Menaruhnya di daftar dependensi
  // efek berarti kamera dimatikan dan dinyalakan ulang setiap kali layar ini
  // berkedip — lampu kamera berkedip ikut, dan pemindaian mulai dari nol.
  const terimaRef = useRef(terima);
  terimaRef.current = terima;

  const [galat, setGalat] = useState("");
  const [asing, setAsing] = useState("");
  const [siap, setSiap] = useState(false);
  const [bisaSenter, setBisaSenter] = useState(false);
  const [senter, setSenter] = useState(false);

  const hentikan = useCallback(() => {
    jalanRef.current = false;
    aliranRef.current?.getTracks().forEach((j) => j.stop());
    aliranRef.current = null;
  }, []);

  useEffect(() => {
    jalanRef.current = true;
    let tunda = 0;
    const baca = buatPembaca();

    void (async () => {
      let aliran: MediaStream;
      try {
        aliran = await bukaKamera();
      } catch (e) {
        if (jalanRef.current) {
          setGalat(e instanceof Error ? e.message : "Kamera tidak bisa dibuka.");
        }
        return;
      }

      // Layar sempat ditutup selagi izin ditunggu. Aliran yang terlanjur
      // terbuka harus tetap dimatikan, kalau tidak lampu kameranya menyala
      // terus sampai tabnya ditutup.
      if (!jalanRef.current) {
        aliran.getTracks().forEach((j) => j.stop());
        return;
      }

      aliranRef.current = aliran;
      setBisaSenter(adaSenter(aliran));

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = aliran;
      try {
        await video.play();
      } catch {
        // Sebagian peramban menolak memutar sebelum ada ketukan. Bingkainya
        // tetap mengalir begitu izin diberikan, jadi putaran di bawah tetap
        // jalan — dan kalau memang tidak, layarnya masih bisa ditutup.
      }
      if (jalanRef.current) setSiap(true);

      const putaran = async () => {
        if (!jalanRef.current) return;
        if (video.readyState >= 2) {
          try {
            const teks = await baca(video);
            if (teks && jalanRef.current) tanggapi(teks);
          } catch {
            // Satu bingkai gagal dibaca bukan alasan berhenti memindai.
          }
        }
        if (jalanRef.current) tunda = window.setTimeout(() => void putaran(), JEDA);
      };
      void putaran();
    })();

    function tanggapi(teks: string) {
      // QR yang sama masih di depan lensa. Tanpa penjaga ini, QR yang ditolak
      // akan ditolak ulang sepuluh kali sedetik.
      if (teks === terakhirRef.current) return;
      terakhirRef.current = teks;

      if (terimaRef.current(teks)) {
        // Getar, bukan bunyi: kurir memindai di jalan ramai, sering dengan HP
        // dalam mode sunyi, dan matanya sedang di QR bukan di layar.
        navigator.vibrate?.(60);
        hentikan();
        return;
      }
      setAsing("QR itu bukan undangan kurir. Pindai QR dari layar admin atau dari surat jalan.");
    }

    return () => {
      window.clearTimeout(tunda);
      hentikan();
    };
  }, [hentikan]);

  async function balikSenter() {
    const aliran = aliranRef.current;
    if (!aliran) return;
    const mau = !senter;
    try {
      await setelSenter(aliran, mau);
      setSenter(mau);
    } catch {
      // Lampunya menyebut dirinya bisa dikendalikan lalu menolak. Tidak ada
      // yang bisa dilakukan kurir soal itu, jadi tombolnya dicabut saja.
      setBisaSenter(false);
    }
  }

  return (
    <div className="pemindai" role="dialog" aria-modal="true" aria-label={judul}>
      {!galat && <video ref={videoRef} className="pemindai-video" playsInline muted autoPlay />}

      <div className="pemindai-lapis">
        <div className="pemindai-atas">
          <span style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 16 }}>{judul}</span>
          <button
            className="tombol-bulat"
            onClick={() => {
              hentikan();
              tutup();
            }}
            aria-label="Tutup pemindai"
          >
            <IkonSilang ukuran={20} />
          </button>
        </div>

        {galat ? (
          <div className="pemindai-tengah">
            <div className="pemindai-galat">
              <span style={{ display: "grid", placeItems: "center", marginBottom: 10 }}>
                <IkonPeringatan ukuran={30} />
              </span>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Kamera belum bisa dipakai</div>
              <div style={{ fontSize: 13.5, lineHeight: 1.5, opacity: 0.9 }}>{galat}</div>
              <button
                className="tombol tombol-utama tombol-penuh"
                style={{ marginTop: 14 }}
                onClick={() => {
                  hentikan();
                  tutup();
                }}
              >
                Kembali
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="pemindai-tengah">
              <div className="pemindai-kotak">
                {!siap && <div className="putar putar-terang" />}
              </div>
            </div>

            <div className="pemindai-bawah">
              {asing ? (
                <div className="pemindai-pesan pemindai-pesan-salah">
                  <IkonPeringatan ukuran={17} />
                  <span>{asing}</span>
                </div>
              ) : (
                <div className="pemindai-pesan">
                  <IkonQr ukuran={17} />
                  <span>{siap ? petunjuk : "Menyiapkan kamera…"}</span>
                </div>
              )}

              {bisaSenter && (
                <button
                  className="tombol tombol-gelap tombol-penuh"
                  style={{ marginTop: 12 }}
                  onClick={() => void balikSenter()}
                >
                  <IkonSenter ukuran={18} />
                  {senter ? "Matikan senter" : "Nyalakan senter"}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
