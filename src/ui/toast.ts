import { $ } from "../util";

let timer = 0;

export function toast(message: string, isError = false): void {
  const el = $("#toast");
  el.textContent = message;
  el.className = "toast" + (isError ? " is-error" : "");
  el.hidden = false;
  clearTimeout(timer);
  timer = window.setTimeout(() => { el.hidden = true; }, isError ? 6000 : 2400);
}
