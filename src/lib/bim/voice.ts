/** Minimal browser adapter, independently testable without microphone access. */
export interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((event: {
        results: ArrayLike<{ isFinal: boolean; [index: number]: { transcript: string } }>;
      }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}
export type RecognitionConstructor = new () => Recognition;
export function recognitionConstructor(scope: object): RecognitionConstructor | undefined {
  const host = scope as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition;
}
export function startVoice(
  RecognitionClass: RecognitionConstructor,
  callbacks: { result(text: string): void; error(message: string): void; end(): void },
): () => void {
  const recognition = new RecognitionClass();
  recognition.lang = "de-DE";
  recognition.continuous = false;
  recognition.interimResults = false;
  let active = true;
  const timeout = setTimeout(() => {
    close();
    callbacks.error("Aufnahme nach 20 Sekunden beendet. Bitte erneut versuchen.");
  }, 20000);
  const close = () => {
    if (!active) return;
    active = false;
    clearTimeout(timeout);
    recognition.onresult = null;
    recognition.onerror = null;
    recognition.onend = null;
    try {
      recognition.abort();
    } catch {
      /* Already stopped. */
    }
    callbacks.end();
  };
  recognition.onresult = (event) => {
    if (!active) return;
    const final = Array.from(event.results)
      .filter((result) => result.isFinal)
      .map((result) => result[0]?.transcript ?? "")
      .join(" ")
      .trim();
    if (!final) return;
    close();
    callbacks.result(final);
  };
  recognition.onerror = (event) => {
    if (!active) return;
    const messages: Record<string, string> = {
      "not-allowed":
        "Mikrofonzugriff nicht erlaubt. Bitte Browserberechtigung prüfen oder Text eingeben.",
      "service-not-allowed": "Spracherkennung ist in diesem Browser nicht freigegeben.",
      "audio-capture": "Kein verwendbares Mikrofon gefunden.",
      "no-speech": "Keine Sprache erkannt. Bitte erneut versuchen.",
      network: "Spracherkennungsdienst nicht erreichbar. Bitte Text eingeben.",
    };
    close();
    callbacks.error(messages[event.error] ?? "Spracheingabe fehlgeschlagen. Bitte Text eingeben.");
  };
  recognition.onend = () => {
    if (active) {
      close();
      callbacks.error("Keine Sprache erkannt. Bitte erneut versuchen.");
    }
  };
  try {
    recognition.start();
  } catch {
    close();
    callbacks.error("Spracheingabe konnte nicht gestartet werden. Bitte Text eingeben.");
  }
  return close;
}

/** Normalize only explicit spoken units and simple numbers, without guessing intent. */
export function normalizeSpeech(text: string): string {
  const numbers: Record<string, string> = {
    null: "0",
    eins: "1",
    ein: "1",
    eine: "1",
    zwei: "2",
    drei: "3",
    vier: "4",
    fünf: "5",
    sechs: "6",
    sieben: "7",
    acht: "8",
    neun: "9",
    zehn: "10",
    elf: "11",
    zwölf: "12",
  };
  return text
    .trim()
    .toLocaleLowerCase("de")
    .replace(/[.!?]$/u, "")
    .replace(
      /\b(null|eins|ein|eine|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf)\b/gu,
      (word) => numbers[word]!,
    )
    .replace(/(\d+)\s+komma\s+(\d+)/gu, "$1,$2")
    .replace(/\bmillimeter\b/gu, "mm")
    .replace(/\bzentimeter\b/gu, "cm")
    .replace(/\bmeter\b/gu, "m");
}
