import { isImageAssetHandle } from "../../domain/elements/reference/model.ts";
import type { RecoveryPayload } from "../../application/project-files/recovery-v2.ts";

/** Preserve the persisted SHA-256 input format exactly, including the untrusted fallback. */
export function payloadHashInput(p: RecoveryPayload): Uint8Array<ArrayBuffer> {
  const encoder = new TextEncoder();
  if (!isImageAssetHandle(p))
    return encoder.encode(JSON.stringify([p.mimeType, p.pixelWidth, p.pixelHeight, p.data]));
  // Only registered, owned handles prove immutable canonical ASCII Base64.
  // IDs are intentionally not part of the content key.
  const prefix = JSON.stringify([p.mimeType, p.pixelWidth, p.pixelHeight]).slice(0, -1) + ',"';
  const result = new Uint8Array(prefix.length + p.data.length + 2);
  encoder.encodeInto(prefix, result);
  encoder.encodeInto(p.data, result.subarray(prefix.length));
  result[result.length - 2] = 34;
  result[result.length - 1] = 93;
  return result;
}
