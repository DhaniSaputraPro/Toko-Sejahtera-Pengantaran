/**
 * Kecilkan foto sebelum diunggah.
 *
 * Kamera HP sekarang menghasilkan berkas 3–8 MB. Foto serah terima cuma perlu
 * cukup jelas untuk menunjukkan barang dan orangnya; mengunggah ukuran penuh
 * dari tepi jalan dengan sinyal seadanya berarti kurir menunggu satu menit
 * untuk sesuatu yang bisa selesai dalam tiga detik — dan sering gagal di tengah.
 */
const SISI_MAKS = 1280;
const MUTU = 0.72;

export async function kecilkan(berkas: File): Promise<Blob> {
  const bitmap = await bacaBitmap(berkas);
  const skala = Math.min(1, SISI_MAKS / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * skala));
  const h = Math.max(1, Math.round(bitmap.height * skala));

  const kanvas = document.createElement("canvas");
  kanvas.width = w;
  kanvas.height = h;
  const ctx = kanvas.getContext("2d");
  if (!ctx) return berkas;
  ctx.drawImage(bitmap, 0, 0, w, h);
  if ("close" in bitmap) bitmap.close();

  const hasil = await new Promise<Blob | null>((res) =>
    kanvas.toBlob(res, "image/jpeg", MUTU),
  );
  // Kalau pengecilan gagal, berkas aslinya tetap dikirim: foto besar lebih baik
  // daripada tidak ada foto sama sekali.
  return hasil ?? berkas;
}

async function bacaBitmap(berkas: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(berkas);
    } catch {
      /* Safari lama menolak sebagian JPEG; jatuh ke <img> di bawah. */
    }
  }
  const url = URL.createObjectURL(berkas);
  try {
    return await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = () => rej(new Error("Foto tidak bisa dibaca."));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}
