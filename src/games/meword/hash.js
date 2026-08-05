// SHA-256 via the standard Web Crypto API — available as `crypto.subtle`
// in both the browser and modern Node, so this one function works
// unchanged in scripts/build-words.mjs (Node) and at runtime (browser).
export async function sha256Hex(str) {
  const bytes = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
