import { RedirectManager } from "./redirect-manager.mjs";
import { registerSettings } from "./settings.mjs";

const MODULE_ID = "alvejamento-otimizado";

Hooks.once("init", () => {
  // O módulo não intercepta, substitui ou acelera rolagens do D&D 5e.
  // A inicialização é isolada para que um erro de configuração do módulo
  // nunca interrompa o restante do ciclo de inicialização do sistema.
  try {
    registerSettings();
    console.info(`${MODULE_ID} | configurações registradas.`);
  } catch (error) {
    console.error(`${MODULE_ID} | falha ao registrar configurações; o redirecionamento continuará sem o menu de configuração.`, error);
  }

  console.info(`${MODULE_ID} | carregando para Foundry VTT ${game.version}.`);
});

Hooks.once("ready", () => {
  if (game.system.id !== "dnd5e") {
    ui.notifications.error("Alvejamento Otimizado requer o sistema D&D 5e.");
    return;
  }

  try {
    const manager = new RedirectManager();
    globalThis.AlvejamentoOtimizado = { manager };
    manager.registerHooks();

    console.info(`${MODULE_ID} | pronto — Foundry ${game.version}, D&D 5e ${game.system.version}.`);
  } catch (error) {
    console.error(`${MODULE_ID} | erro durante a inicialização.`, error);
    ui.notifications.error("Alvejamento Otimizado encontrou um erro ao inicializar. Consulte o console (F12).");
  }
});
