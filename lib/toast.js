import Swal from "sweetalert2";

export const TOAST_BASE = {
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2200,
  timerProgressBar: true,
  background: "#0a0a0a",
  color: "#ffffff",
};

export const toastSuccess = (nama, unit) =>
  Swal.fire({
    ...TOAST_BASE,
    icon: "success",
    title: "✅ Absensi Disimpan",
    html: `<b>Pemilik:</b> ${nama}<br/><b>Unit:</b> ${unit}`,
  });

export const toastDuplicate = (nama) =>
  Swal.fire({
    ...TOAST_BASE,
    icon: "info",
    title: "Sudah Absen",
    html: `<b>${nama}</b> sudah tercatat sebelumnya`,
  });

export const toastNotFound = () =>
  Swal.fire({ ...TOAST_BASE, icon: "error", title: "❌ Tidak Ditemukan", text: "NO KTP tidak ada di data" });

export const toastExcelNotReady = () =>
  Swal.fire({ ...TOAST_BASE, icon: "warning", title: "Data excel belum siap, coba lagi" });

export const toastExcelLoadFailed = () =>
  Swal.fire({ ...TOAST_BASE, icon: "error", title: "Gagal load data excel", timer: 4000 });

export const toastRejected = (message, detail) =>
  Swal.fire({
    ...TOAST_BASE,
    icon: "error",
    title: "⚠️ Data Ditolak",
    html: detail ? `${message}<br/><small>${detail}</small>` : message,
    timer: 4500,
  });

export const toastServerUnavailable = (message) =>
  Swal.fire({ ...TOAST_BASE, icon: "error", title: "⚠️ Server Bermasalah", text: message, timer: 4000 });

export const toastServerError = (message, detail) =>
  Swal.fire({
    ...TOAST_BASE,
    icon: "error",
    title: "⚠️ Terjadi Kesalahan Server",
    html: detail ? `${message}<br/><small>${detail}</small>` : message,
    timer: 4500,
  });

export const toastNetworkError = () =>
  Swal.fire({ ...TOAST_BASE, icon: "error", title: "⚠️ Koneksi Gagal", text: "Tidak dapat terhubung ke server" });