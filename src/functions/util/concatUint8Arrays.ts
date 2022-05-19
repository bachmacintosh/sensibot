export default function concatUint8Arrays (
  arr1: Uint8Array,
  arr2: Uint8Array,
): Uint8Array {
  const merged = new Uint8Array(arr1.length + arr2.length,);
  merged.set(arr1,);
  merged.set(arr2, arr1.length,);
  return merged;
}
