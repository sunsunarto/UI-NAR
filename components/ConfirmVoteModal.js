import Swal from "sweetalert2";

export async function confirmVoteModal(candidate) {
  const result = await Swal.fire({
    title: "Konfirmasi Pilihan",
    html: `Anda memilih:<br/><b style="font-size:22px; color:#2dd4bf;">${candidate}</b><br/><small style="opacity:0.7">Pilihan tidak dapat diubah setelah dikonfirmasi</small>`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Pilih",
    cancelButtonText: "Batal",
    confirmButtonColor: "#2dd4bf",
    cancelButtonColor: "#ef4444",
    background: "#0a0a0a",
    color: "#ffffff",
    reverseButtons: true,
    allowOutsideClick: false,
  });
  return result.isConfirmed;
}