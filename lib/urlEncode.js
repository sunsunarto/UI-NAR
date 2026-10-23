export function toBase64Url(text) {
  if (text === null || text === undefined) return "";
  const utf8Bytes = unescape(encodeURIComponent(text.toString()));
  return btoa(utf8Bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(encoded) {
  if (!encoded) return "";
  try {
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) base64 += "=";
    return decodeURIComponent(escape(atob(base64)));
  } catch (err) {
    console.error("Gagal decode base64url:", err);
    return "";
  }
}