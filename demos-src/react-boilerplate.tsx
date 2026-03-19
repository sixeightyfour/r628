import React from "react";
import { createRoot } from "react-dom/client";

export function mount(E: React.FC) {
  const e = document.createElement("root");
  document.body.appendChild(e);
  const root = createRoot(e).render(<E></E>);
}
