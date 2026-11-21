import { clamp, closest, esc } from "../util";

export interface MenuItem {
  id: string;
  label: string;
  /** Destructive action: shown in red. */
  danger?: boolean;
}

/** A small right-click menu. `null` entries render as separators. */
export function createContextMenu(onPick: (itemId: string) => void) {
  const menu = Object.assign(document.createElement("div"), { className: "ctx-menu", hidden: true });
  menu.setAttribute("role", "menu");
  document.body.append(menu);
  let returnFocus: HTMLElement | null = null;

  function close(restoreFocus = false): void {
    if (menu.hidden) return;
    menu.hidden = true;
    if (restoreFocus) returnFocus?.focus({ preventScroll: true });
  }

  function open(items: (MenuItem | null)[], x: number, y: number): void {
    menu.innerHTML = items
      .map(item => (item ? `<button type="button" role="menuitem"${item.danger ? ' class="danger"' : ""} data-ctx="${esc(item.id)}">${esc(item.label)}</button>` : `<hr role="separator">`))
      .join("");
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    menu.hidden = false;
    const { width, height } = menu.getBoundingClientRect();
    menu.style.left = `${clamp(x, 4, window.innerWidth - width - 4)}px`;
    menu.style.top = `${clamp(y, 4, window.innerHeight - height - 4)}px`;
    menu.querySelector("button")?.focus({ preventScroll: true });
  }

  menu.addEventListener("click", event => {
    const id = closest(event, "[data-ctx]")?.dataset.ctx;
    if (!id) return;
    close();
    onPick(id);
  });
  menu.addEventListener("contextmenu", event => event.preventDefault());
  menu.addEventListener("keydown", event => {
    const buttons = [...menu.querySelectorAll("button")];
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === "ArrowDown") {
      event.preventDefault();
      buttons[(at + 1) % buttons.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      buttons[(at - 1 + buttons.length) % buttons.length]?.focus();
    } else if (event.key === "Escape" || event.key === "Tab") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  });
  // Anything that moves the page away from the menu dismisses it.
  document.addEventListener("pointerdown", event => { if (!closest(event, ".ctx-menu")) close(); });
  window.addEventListener("wheel", () => close(), { passive: true });
  window.addEventListener("resize", () => close());
  window.addEventListener("blur", () => close());

  return { open, close };
}
