import Swal from "sweetalert2";

export async function confirmAbsensiModal({ nama, unit, ppjb, no_ktp }) {
  const result = await Swal.fire({
    title: "Konfirmasi Data Absensi",
    html: `
      <div style="text-align:left; line-height:1.8; font-size:15px;">
        <div><b>Nama</b> &nbsp;: ${nama}</div>
        <div><b>Unit</b> &nbsp;&nbsp;: ${unit}</div>
        <div><b>PPJB</b> &nbsp;: ${ppjb}</div>
        <div><b>No. KTP</b> : ${no_ktp}</div>
      </div>
    `,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sesuai",
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