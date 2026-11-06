/** A finished PDF leaves the app (docs/PDF_EXPORT.md): as a download or to the print dialog. */
const pdfUrl = (bytes: Uint8Array<ArrayBuffer>) =>
  URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));

export function savePdf(bytes: Uint8Array<ArrayBuffer>, filename: string) {
  const url = pdfUrl(bytes);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The browser prints the PDF itself, so the paper keeps its true size. Where a frame cannot print
 * a PDF, it opens in a tab of its own with the print button of the PDF viewer.
 */
export function printPdf(bytes: Uint8Array<ArrayBuffer>) {
  const url = pdfUrl(bytes);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  frame.onload = () => {
    try {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    } catch {
      window.open(url, "_blank");
    }
  };
  frame.src = url;
  document.body.appendChild(frame);
  // The print dialog reads the frame as long as it is open; the next print replaces it.
  document.querySelector("iframe[data-pdf-print]")?.remove();
  frame.setAttribute("data-pdf-print", "");
}
