import { memo, useRef, type ComponentType } from "react";

/**
 * The props with every function replaced by a stable wrapper that calls the latest one
 * (docs/TABS.md). A memoised child then re-renders only when a shown value changes, not because
 * the parent created new callbacks.
 */
export function useStableHandlers<P extends object>(props: P): P {
  const latest = useRef(props);
  latest.current = props;
  const wrappers = useRef(new Map<string, (...args: unknown[]) => unknown>());
  const stable: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (typeof value !== "function") {
      stable[key] = value;
      continue;
    }
    let wrapper = wrappers.current.get(key);
    if (!wrapper) {
      wrapper = (...args) =>
        (latest.current as Record<string, (...a: unknown[]) => unknown>)[key]!(...args);
      wrappers.current.set(key, wrapper);
    }
    stable[key] = wrapper;
  }
  return stable as P;
}

/** A component that skips rendering while its shown values stay the same. */
export function withStableHandlers<P extends object>(Component: ComponentType<P>) {
  const Inner = memo(Component) as unknown as ComponentType<P>;
  function Stable(props: P) {
    return <Inner {...useStableHandlers(props)} />;
  }
  Stable.displayName = `Stable(${Component.displayName ?? Component.name})`;
  return Stable;
}
