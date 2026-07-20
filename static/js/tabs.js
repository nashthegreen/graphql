export function bindTabs() {
  const buttons = document.querySelectorAll("[data-tab]");
  const panels = document.querySelectorAll("[data-tab-panel]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.dataset.tab;

      buttons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tab));
      panels.forEach((panel) => {
        panel.classList.toggle("hidden", panel.dataset.tabPanel !== tab);
      });
    });
  });
}
