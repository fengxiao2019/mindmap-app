import { $, closest, isNarrow } from "../util";

/**
 * Drop-down menu bar. Every item carries `data-action="name"`; choosing one calls `actions[name]`.
 * Supports click, hover-to-switch, Escape, and the arrow keys.
 */
export function createMenubar(actions: Record<string, () => void | Promise<void>>, onEscapeOutside: () => void) {
  const menubar = $("#menubar");
  const triggers = [...menubar.querySelectorAll<HTMLElement>(".mb-trigger")];
  const panelOf = (trigger: HTMLElement): HTMLElement => $(`#${trigger.getAttribute("aria-controls")}`);
  const itemsOf = (trigger: HTMLElement): HTMLElement[] => [...panelOf(trigger).querySelectorAll<HTMLElement>('[role^="menuitem"]')];
  const openTrigger = (): HTMLElement | undefined => triggers.find(t => t.getAttribute("aria-expanded") === "true");

  function closeMenus(): void {
    for (const trigger of triggers) {
      trigger.setAttribute("aria-expanded", "false");
      panelOf(trigger).hidden = true;
    }
  }
  function openMenu(trigger: HTMLElement, focusFirst = false): void {
    closeMenus();
    trigger.setAttribute("aria-expanded", "true");
    panelOf(trigger).hidden = false;
    if (focusFirst) itemsOf(trigger)[0]?.focus();
  }

  for (const trigger of triggers) {
    trigger.addEventListener("click", () => (trigger === openTrigger() ? closeMenus() : openMenu(trigger)));
    trigger.addEventListener("pointerenter", () => {
      const open = openTrigger();
      if (open && open !== trigger) openMenu(trigger);
    });
  }

  menubar.addEventListener("click", event => {
    const name = closest(event, "[data-action]")?.dataset.action;
    if (!name) return;
    closeMenus();
    void actions[name]?.();
  });
  document.addEventListener("pointerdown", event => { if (!closest(event, ".mb-menu")) closeMenus(); });

  menubar.addEventListener("keydown", event => {
    const target = event.target as HTMLElement;
    const trigger = triggers.find(t => t === target || panelOf(t).contains(target));
    if (!trigger) return;
    const inPanel = panelOf(trigger).contains(target);
    const items = itemsOf(trigger);
    const step = <T,>(list: T[], index: number, delta: number): T | undefined => list[(index + delta + list.length) % list.length];
    const moveTrigger = (delta: number): void => {
      const next = step(triggers, triggers.indexOf(trigger), delta);
      if (!next) return;
      if (openTrigger()) openMenu(next, inPanel);
      else next.focus();
    };

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!inPanel) openMenu(trigger, true);
      else step(items, items.indexOf(target), 1)?.focus();
    } else if (event.key === "ArrowUp" && inPanel) {
      event.preventDefault();
      step(items, items.indexOf(target), -1)?.focus();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTrigger(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTrigger(-1);
    } else if (event.key === "Escape" && inPanel) {
      event.stopPropagation();
      closeMenus();
      trigger.focus();
    }
  });

  // Escape elsewhere: close menus, and let a narrow-screen sidebar close too.
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    closeMenus();
    if (isNarrow()) onEscapeOutside();
  });

  return { closeMenus };
}
