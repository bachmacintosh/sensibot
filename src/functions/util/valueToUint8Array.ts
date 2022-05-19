export default function valueToUint8Array (
  value: ArrayBuffer | Uint8Array | string,
  format?: string,
): Uint8Array {
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value,);
  }
  if (value instanceof Uint8Array) {
    return value;
  }
  if (value === "") {
    return new Uint8Array();
  }
  if (format === "hex") {
    const matches = value.match(/.{1,2}/gu,);
    if (matches === null) {
      throw new Error("Value is not a valid hex string",);
    }
    const hexVal = matches.map((byte: string,) => {
      return parseInt(byte, 16,);
    },);
    return new Uint8Array(hexVal,);
  } else {
    return new TextEncoder().encode(value,);
  }
}
