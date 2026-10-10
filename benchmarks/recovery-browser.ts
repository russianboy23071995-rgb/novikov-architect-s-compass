import {
  createRecoveryStorage,
  openRecoveryDatabase,
} from "../src/interop/project-file/recovery-storage";
import { readRecovery, saveRecovery } from "../src/application/project-files/recovery";
import { createExampleProject } from "../src/components/cad/bim-view";
import { createEditingState } from "../src/application/direct-edit/controller";

const params = new URLSearchParams(location.search);
const peer = params.has("peer");
const token = params.get("peer") ?? crypto.randomUUID();
if (!/^[a-f0-9-]{36}$/.test(token)) throw new Error("Ungültige Diagnosekennung");
const name = `novikov-recovery-test-${token}`;
const channel = new BroadcastChannel(name);
const storage = createRecoveryStorage(() => openRecoveryDatabase(name));
const root = document.querySelector<HTMLElement>("#root")!;
root.style.cssText =
  "max-width:900px;margin:40px auto;font:16px system-ui;line-height:1.6;color:#24343c";
const title = document.createElement("h1");
title.textContent = peer ? "Recovery-Diagnose: zweiter Tab" : "NOVIKOV Recovery-Browserprüfung";
root.append(title);
const info = document.createElement("p");
info.textContent =
  "Isolierte Testdatenbank. Produktions-Snapshots werden nicht gelesen oder verändert. Kein Nachweis für Stromausfall, Speicherverdrängung oder echte Quota-Erschöpfung.";
root.append(info);
const output = document.createElement("pre");
output.style.whiteSpace = "pre-wrap";
output.setAttribute("role", "status");
root.append(output);
const log = (text: string) => {
  output.textContent += `${text}\n`;
};
const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

if (peer) {
  log("Bereit für konkurrierenden Schreibversuch.");
  channel.onmessage = async ({ data }) => {
    if (data?.kind === "ping") {
      channel.postMessage({ kind: "ready" });
      return;
    }
    if (
      data?.kind !== "replace" ||
      typeof data.expected !== "string" ||
      typeof data.next !== "string"
    )
      return;
    try {
      await storage.replace(data.expected, data.next);
      channel.postMessage({ kind: "result", accepted: true });
      log("Schreibversuch bestätigt.");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      channel.postMessage({ kind: "result", accepted: false, message });
      log(message);
    }
  };
  channel.postMessage({ kind: "ready" });
} else {
  const link = document.createElement("a");
  link.href = `?peer=${token}`;
  link.target = "_blank";
  link.textContent = "Zweiten Test-Tab öffnen";
  root.append(link);
  const button = document.createElement("button");
  button.textContent = "Prüfung starten";
  button.disabled = true;
  button.style.cssText = "margin-left:20px;padding:10px";
  root.append(button);
  let receive: ((value: { accepted: boolean; message?: string }) => void) | undefined;
  channel.onmessage = ({ data }) => {
    if (data?.kind === "ready") {
      button.disabled = false;
    }
    if (data?.kind === "result") receive?.(data);
  };
  channel.postMessage({ kind: "ping" });
  button.onclick = async () => {
    button.disabled = true;
    output.textContent = "";
    const live = createEditingState(createExampleProject());
    const unchanged = JSON.stringify(live);
    try {
      await saveRecovery(live.history.present, storage);
      const baseline = await storage.read();
      let aborted = false;
      // Wrap only the connection in this test. The production adapter still performs
      // its real get/put; abort after native put success, before transaction commit.
      const aborting = createRecoveryStorage(async () => {
        const db = await openRecoveryDatabase(name);
        return new Proxy(db, {
          get(target, prop) {
            if (prop === "transaction")
              return (...args: Parameters<IDBDatabase["transaction"]>) => {
                const tx = target.transaction(...args);
                return new Proxy(tx, {
                  get(t, p) {
                    if (p === "objectStore")
                      return (storeName: string) => {
                        const store = t.objectStore(storeName);
                        return new Proxy(store, {
                          get(s, key) {
                            if (key === "put")
                              return (...values: Parameters<IDBObjectStore["put"]>) => {
                                const request = s.put(...values);
                                request.addEventListener("success", () => {
                                  aborted = true;
                                  t.abort();
                                });
                                return request;
                              };
                            const value = Reflect.get(s, key, s);
                            return typeof value === "function" ? value.bind(s) : value;
                          },
                        });
                      };
                    const value = Reflect.get(t, p, t);
                    return typeof value === "function" ? value.bind(t) : value;
                  },
                  set(t, p, value) {
                    return Reflect.set(t, p, value, t);
                  },
                });
              };
            const value = Reflect.get(target, prop, target);
            return typeof value === "function" ? value.bind(target) : value;
          },
        });
      });
      let rejected = false;
      try {
        await saveRecovery({ ...live.history.present, id: "must-not-publish" }, aborting);
      } catch (error) {
        rejected = true;
        log(`Erwarteter Fehler: ${(error as Error).message}`);
      }
      assert(aborted && rejected, "Abbruch muss Promise ablehnen");
      assert((await storage.read()) === baseline, "Abbruch hat Datensatz verändert");
      assert(
        (await readRecovery(storage))?.project.id === live.history.present.id,
        "Alter Stand nicht lesbar",
      );
      log(
        "PASS: echte Transaktion nach put-Erfolg abgebrochen; alter Stand bytegleich und validiert.",
      );

      const a = JSON.parse(baseline!);
      const b = JSON.parse(baseline!);
      a.current.json = JSON.stringify({ ...live.history.present, id: "writer-a" });
      b.current.json = JSON.stringify({ ...live.history.present, id: "writer-b" });
      const other = new Promise<{ accepted: boolean; message?: string }>((resolve, reject) => {
        const timer = window.setTimeout(() => {
          receive = undefined;
          reject(new Error("Zweiter Tab antwortet nicht"));
        }, 10000);
        receive = (value) => {
          clearTimeout(timer);
          receive = undefined;
          resolve(value);
        };
      });
      channel.postMessage({ kind: "replace", expected: baseline, next: JSON.stringify(b) });
      const local = storage.replace(baseline, JSON.stringify(a)).then(
        () => ({ accepted: true }),
        (error) => ({ accepted: false, message: String(error) }),
      );
      const results = await Promise.all([local, other]);
      assert(results.filter((r) => r.accepted).length === 1, "Genau ein Schreiber muss gewinnen");
      const winner = (await readRecovery(storage))!;
      assert(["writer-a", "writer-b"].includes(winner.project.id), "Gewinner nicht gültig");
      const winnerRaw = await storage.read();
      try {
        await storage.replace(baseline, JSON.stringify(a));
        throw new Error("Staler Schreibversuch akzeptiert");
      } catch (error) {
        assert(String(error).includes("anderer Vorgang"), "Falscher Konfliktfehler");
      }
      assert((await storage.read()) === winnerRaw, "Konflikt hat Gewinner verändert");
      log(
        `PASS: zwei Tabs, genau ein Gewinner (${winner.project.id}); Konflikt erhält gültigen Stand.`,
      );

      await saveRecovery({ ...live.history.present, id: "next" }, storage);
      const beforeDamage = await storage.read();
      const damaged = JSON.parse(beforeDamage!);
      damaged.current.json = "{broken";
      await storage.replace(beforeDamage, JSON.stringify(damaged));
      const fallback = (await readRecovery(storage))!;
      assert(
        fallback.fallback && fallback.project.id === winner.project.id,
        "Vorgänger nicht angeboten",
      );
      assert((await storage.read()) === JSON.stringify(damaged), "Lesen hat Datensatz verändert");
      assert(JSON.stringify(live) === unchanged, "Arbeitsmodell oder History verändert");
      log(
        "PASS: beschädigter Stand bietet validierten Vorgänger; Arbeitsmodell und History unverändert.",
      );
      log("ERGEBNIS: 3/3 Browserprüfungen bestanden.");
    } catch (error) {
      log(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      const removal = indexedDB.deleteDatabase(name);
      removal.onsuccess = () => {
        log("Isolierte Testdatenbank entfernt.");
        button.disabled = false;
      };
      removal.onerror = () => {
        log("Testdatenbank konnte nicht entfernt werden.");
        button.disabled = false;
      };
    }
  };
}
