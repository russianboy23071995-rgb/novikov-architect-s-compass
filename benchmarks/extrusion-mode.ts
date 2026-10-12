/** Diagnostic-only switch. A prepared session captures its choice at creation. */
let reuse = true;
export const useSessionExtrusion = () => reuse;
export function setSessionExtrusion(value: boolean) {
  reuse = value;
}
