import * as nacl from "tweetnacl";
import concatUint8Arrays from "./concatUint8Arrays";
import valueToUint8Array from "./valueToUint8Array";

export default function verifyKey (
  body: ArrayBuffer | Uint8Array | string,
  signature: ArrayBuffer | Uint8Array | string,
  timestamp: ArrayBuffer | Uint8Array | string,
  clientPublicKey: ArrayBuffer | Uint8Array | string,
): boolean {
  try {
    const timestampData = valueToUint8Array(timestamp,);
    const bodyData = valueToUint8Array(body,);
    const message = concatUint8Arrays(timestampData, bodyData,);

    const signatureData = valueToUint8Array(signature, "hex",);
    const publicKeyData = valueToUint8Array(clientPublicKey, "hex",);
    return nacl.sign.detached.verify(message, signatureData, publicKeyData,);
  } catch (ex) {
    console.error("Invalid verifyKey parameters: ", ex,);
    return false;
  }
}
