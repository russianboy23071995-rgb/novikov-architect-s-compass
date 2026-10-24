import { profileCommitSharing } from "./commit-sharing-profile.ts";
import { tick } from "./capacity.ts";

const button = document.querySelector<HTMLButtonElement>("#run")!,
  output = document.querySelector<HTMLPreElement>("#report")!;
button.onclick = async () => {
  button.disabled = true;
  try {
    const timing = await profileCommitSharing({
      sizes: [100, 1000, 5000, 20000],
      samples: (size) => (size >= 20000 ? 11 : 21),
      now: () => performance.now(),
      pause: tick,
      progress: (text) => (output.textContent = text),
    });
    output.textContent = JSON.stringify(
      { runtime: navigator.userAgent, date: new Date().toISOString(), timing },
      null,
      2,
    );
    output.dataset["done"] = "true";
  } catch (error) {
    output.textContent = String(error);
  } finally {
    button.disabled = false;
  }
};
