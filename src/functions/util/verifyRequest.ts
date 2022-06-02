import valueToUint8Array from "./valueToUint8Array";

export default async function verifyRequest (
  request: Request,
  publicKey: string,
): Promise<boolean> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    valueToUint8Array(publicKey, "hex",),
    {
      name: "NODE-ED25519",
      namedCurve: "NODE-ED25519",
    },
    true,
    ["verify",],
  );
  const encoder = new TextEncoder();

  const signatureHeader = request.headers.get("X-Signature-Ed25519",);
  const timestamp = request.headers.get("X-Signature-Timestamp",);
  if (signatureHeader === null || timestamp === null) {
    return false;
  }
  const signature = valueToUint8Array(signatureHeader, "hex",);
  const body = await request.clone().text();
  const verified = await crypto.subtle.verify(
    "NODE-ED25519",
    cryptoKey,
    signature,
    encoder.encode(timestamp + body,),
  );
  return verified;
}
