import { useEffect, useRef, useState } from "react";
import { ArrowUp, Check, Command, Mic, Pencil, X } from "lucide-react";
import novikovLogo from "@/assets/novikov-logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { AiState } from "./cad-types";

const bars = [10, 18, 28, 16, 34, 22, 12, 26, 38, 20, 14, 30, 18, 10];

type AiCommandBarProps = { context: string; onExecute: (message: string) => void };

export function AiCommandBar({ context, onExecute }: AiCommandBarProps) {
  const [state, setState] = useState<AiState>("idle");
  const [command, setCommand] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state !== "listening") return;
    const timer = window.setTimeout(() => {
      setCommand("Create a wall five meters long");
      setState("preview");
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  const interpret = () => {
    if (!command.trim()) return;
    setState("preview");
  };

  const reset = () => {
    setState("idle");
    setCommand("");
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  if (state === "listening") {
    return (
      <div className="command-glass absolute bottom-5 left-1/2 z-30 w-[min(620px,calc(100%-32px))] -translate-x-1/2 rounded-xl border border-primary/30 px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 items-center gap-[3px] px-1" aria-hidden="true">
            {bars.map((height, index) => <span key={index} className="wave-bar w-0.5 rounded-full bg-primary" style={{ height, animationDelay: `${index * 55}ms` }} />)}
          </div>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase text-primary">Listening…</p><p className="truncate text-sm text-foreground">Create a wall five meters long…</p></div>
          <Button variant="ghost" size="sm" onClick={reset}><X /> Cancel</Button>
          <Button size="sm" onClick={() => { setCommand("Create a wall five meters long"); setState("preview"); }}><Check /> Interpret</Button>
        </div>
      </div>
    );
  }

  if (state === "preview") {
    return (
      <div className="command-glass absolute bottom-5 left-1/2 z-30 w-[min(560px,calc(100%-32px))] -translate-x-1/2 rounded-xl border border-primary/30 p-3">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10"><img src={novikovLogo} alt="NOVIKOV AI" width={1024} height={1024} loading="lazy" className="size-5 object-contain" /></div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase text-primary">AI interpreted command</p>
            <div className="mt-1 flex items-baseline justify-between gap-3"><h3 className="text-sm font-semibold text-foreground">Create Wall</h3><span className="truncate text-[10px] text-muted-foreground">{context}</span></div>
            <div className="mt-2 grid grid-cols-3 gap-1.5 text-[10px]">
              <div className="rounded border border-border bg-background/40 px-2 py-1"><span className="text-muted-foreground">Length</span><strong className="ml-1.5 font-mono text-foreground">5.00 m</strong></div>
              <div className="rounded border border-border bg-background/40 px-2 py-1"><span className="text-muted-foreground">Thickness</span><strong className="ml-1.5 font-mono text-foreground">240 mm</strong></div>
              <div className="rounded border border-border bg-background/40 px-2 py-1"><span className="text-muted-foreground">Height</span><strong className="ml-1.5 font-mono text-foreground">2.80 m</strong></div>
            </div>
            <div className="mt-3 flex justify-end gap-1.5">
              <Button variant="ghost" size="sm" onClick={reset}>Cancel</Button>
              <Button variant="outline" size="sm" onClick={() => { setState("idle"); inputRef.current?.focus(); }}><Pencil /> Modify</Button>
              <Button size="sm" onClick={() => { onExecute("Wall created · 5.00 m"); reset(); }}><Check /> Execute</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="command-glass absolute bottom-5 left-1/2 z-30 flex w-[min(620px,calc(100%-32px))] -translate-x-1/2 items-center gap-1 rounded-xl border border-border p-1.5" onSubmit={(event) => { event.preventDefault(); interpret(); }}>
      <div className="flex size-8 shrink-0 items-center justify-center"><img src={novikovLogo} alt="NOVIKOV AI" width={1024} height={1024} loading="lazy" className="size-[18px] object-contain" /></div>
      <div className="min-w-0 flex-1">
        <span className="block truncate px-2 text-[9px] text-muted-foreground">Context: {context}</span>
        <Input ref={inputRef} value={command} onChange={(event) => setCommand(event.target.value)} placeholder="Ask NOVIKOV or enter a command…" aria-label="AI command" className="h-6 border-0 bg-transparent px-2 text-xs shadow-none focus-visible:ring-0" />
      </div>
      <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={() => setState("listening")} aria-label="Start voice input"><Mic /></Button>
      <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground" aria-label="Command palette"><Command /></Button>
      <Button type="submit" size="icon" className={cn("size-8", !command.trim() && "opacity-45")} disabled={!command.trim()} aria-label="Interpret command"><ArrowUp /></Button>
    </form>
  );
}
