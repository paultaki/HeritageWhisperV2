export function fromBase64Url(b64u: string): Uint8Array {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
  const buf = Buffer.from(b64 + pad, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}
