// Browser measurement for docs/performance/SECTION_ZOOM.md: load the project in sessionStorage
// "__load", then per view: open time, wheel step until the new view box is painted.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frame = () => new Promise((res) => requestAnimationFrame(() => setTimeout(res, 0)));
const stats = (t) => {
  t.sort((a, b) => a - b);
  return { median: Math.round(t[Math.floor(t.length / 2)]), max: Math.round(t.at(-1)) };
};
async function load(url) {
  const text = await (await fetch(url)).text();
  const input =
    [...document.querySelectorAll("input[type=file]")].find((i) =>
      (i.accept || "").includes("json"),
    ) ?? document.querySelector("input[type=file]");
  const dt = new DataTransfer();
  dt.items.add(new File([text], "gesamt.json", { type: "application/json" }));
  input.files = dt.files;
  input.dispatchEvent(new Event("change", { bubbles: true }));
  await wait(3000);
  [...document.querySelectorAll("button")]
    .find((b) => /Projekt laden/.test(b.textContent))
    ?.click();
  for (let i = 0; i < 240 && !/Projektdatei geladen/.test(document.body.innerText); i++)
    await wait(500);
}
async function measure(label, steps) {
  const btn = [...document.querySelectorAll('[title^="Klick öffnet den Schnitt"]')].find((b) =>
    b.textContent.includes(label),
  );
  const t0 = performance.now();
  btn.click();
  let svg;
  for (
    let i = 0;
    i < 240 && !(svg = document.querySelector(`svg[aria-label="Schnittzeichnung ${label}"]`));
    i++
  )
    await wait(100);
  await frame();
  const openMs = Math.round(performance.now() - t0);
  await wait(2000);
  const r = svg.getBoundingClientRect();
  const cx = r.x + r.width / 2,
    cy = r.y + r.height / 2;
  const z = [];
  for (let i = 0; i < steps; i++) {
    const before = svg.getAttribute("viewBox");
    const s = performance.now();
    svg.dispatchEvent(
      new WheelEvent("wheel", {
        deltaY: i % 2 ? 100 : -100,
        clientX: cx,
        clientY: cy,
        bubbles: true,
        cancelable: true,
      }),
    );
    for (let k = 0; k < 200 && svg.getAttribute("viewBox") === before; k++)
      await new Promise((res) => requestAnimationFrame(res));
    await frame();
    z.push(performance.now() - s);
    await wait(150);
  }
  return { label, elements: svg.querySelectorAll("*").length, openMs, zoom: stats(z) };
}
window.__zoomRun = async (steps = 20) => {
  await load(sessionStorage.getItem("__load"));
  const out = [];
  for (const label of ["Südansicht", "Schnitt A-A"]) out.push(await measure(label, steps));
  return out;
};
