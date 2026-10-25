/** Overlap stays allowed (user decision 24.10.2026); the opening only shows this hint. */
export function OverlapHint({ text }: { text: string }) {
  return text ? (
    <p role="status" className="max-w-96 text-xs text-amber-700">
      {text}
    </p>
  ) : null;
}
