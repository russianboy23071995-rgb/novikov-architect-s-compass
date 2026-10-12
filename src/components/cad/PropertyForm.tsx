import { useCallback, useEffect, useRef } from "react";
import type { ComponentProps } from "react";
import { PropertyCommitContext } from "./property-commit-context";
/** Discrete choices commit immediately; text/number drafts commit on blur or Enter. */
export function PropertyForm({ children, ...props }: ComponentProps<"form">) {
  const ref = useRef<HTMLFormElement>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const schedule = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (ref.current?.isConnected && ref.current.reportValidity()) ref.current.requestSubmit();
    }, 0);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <PropertyCommitContext.Provider value={schedule}>
      <form
        {...props}
        ref={ref}
        onKeyDown={(event) => {
          if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
            event.preventDefault();
            schedule();
          }
        }}
        onChangeCapture={(event) => {
          const el = event.target;
          dirty.current = true;
          if (
            el instanceof HTMLSelectElement ||
            (el instanceof HTMLInputElement && ["checkbox", "range"].includes(el.type))
          )
            schedule();
        }}
        onBlurCapture={(event) => {
          const el = event.target;
          if (
            dirty.current &&
            el instanceof HTMLInputElement &&
            ["number", "text"].includes(el.type)
          )
            schedule();
        }}
      >
        {children}
      </form>
    </PropertyCommitContext.Provider>
  );
}
