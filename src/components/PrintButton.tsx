"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn btn-outline print:hidden" onClick={() => window.print()}>
      🖨 Print delivery note
    </button>
  );
}
