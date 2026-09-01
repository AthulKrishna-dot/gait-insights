/** Browser-side file download helpers used by the export buttons. */

export function downloadTextFile(filename: string, content: string, mime = "text/plain") {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, csv: string) {
  downloadTextFile(filename, csv, "text/csv");
}

export function printCurrentView() {
  if (typeof window !== "undefined") window.print();
}
