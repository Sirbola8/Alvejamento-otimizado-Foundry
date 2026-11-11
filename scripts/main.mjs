import { RedirectManager } from "./redirect-manager.mjs";
import { registerSettings } from "./settings.mjs";
import { MidiBridge } from "./midi-bridge.mjs";

Hooks.once("init", () => {
  registerSettings();
  console.info("Alvejamento Otimizado | carregando para Foundry VTT 13.351");
});

Hooks.once("ready", () => {
  if (game.system.id !== "dnd5e") {
    ui.notifications.error("Alvejamento Otimizado requer o sistema D&D 5e.");
    return;
  }

  const manager = new RedirectManager();
  globalThis.AlvejamentoOtimizado = { manager };
  manager.registerHooks();
  MidiBridge.register(manager);

  console.info(`Alvejamento Otimizado | pronto — Foundry ${game.version}, D&D 5e ${game.system.version}.`);
});
