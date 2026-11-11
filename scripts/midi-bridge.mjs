export const MidiBridge = {
  register(manager) {
    const midi = game.modules.get("midi-qol");
    if (!midi?.active) {
      console.info("Alvejamento Otimizado | Midi-QOL não ativo; recursos específicos de Midi-QOL serão ignorados.");
      return;
    }

    // Hooks públicos do Midi-QOL; o módulo não depende deles para a detecção básica de HP.
    Hooks.on("midi-qol.RollComplete", workflow => {
      if (workflow?.item) manager.lastWorkflow = workflow;
    });

    Hooks.on("midi-qol.postActiveEffects", workflow => {
      if (workflow?.item) manager.lastActiveEffectWorkflow = workflow;
    });

    console.info("Alvejamento Otimizado | Integração Midi-QOL detectada.");
  }
};
