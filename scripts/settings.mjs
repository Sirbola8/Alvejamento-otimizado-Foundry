import { DEFAULT_EFFECTS, getEffects, setEffects, MODULE_ID } from "./config.mjs";

export function registerSettings() {
  game.settings.register(MODULE_ID, "effects", {
    name: "Efeitos redirecionáveis",
    hint: "Configuração JSON das magias/efeitos que podem ser transferidos.",
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_EFFECTS
  });

  game.settings.registerMenu(MODULE_ID, "configuration", {
    name: "Configurar efeitos redirecionáveis",
    label: "Abrir configuração",
    hint: "Configure Hunter's Mark, Hex e efeitos personalizados.",
    icon: "fas fa-crosshairs",
    type: RedirectConfigApp,
    restricted: true
  });
}

class RedirectConfigApp extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: `${MODULE_ID}-config`,
      title: "Alvejamento Otimizado",
      width: 760,
      height: 620,
      closeOnSubmit: true
    });
  }

  getData() {
    return { json: JSON.stringify(getEffects(), null, 2) };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find("textarea").on("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") this.submit();
    });
  }

  async _updateObject(_event, formData) {
    try {
      const value = JSON.parse(formData.effects);
      if (!Array.isArray(value)) throw new Error("A raiz da configuração deve ser uma lista JSON.");
      await setEffects(value);
      ui.notifications.info("Alvejamento Otimizado: configuração salva.");
    } catch (error) {
      ui.notifications.error(`Alvejamento Otimizado: JSON inválido — ${error.message}`);
    }
  }

  async _renderInner(data) {
    return $(
      `<form class="ao-config-form">
        <p>Configure quais Active Effects podem ser redirecionados. Use nomes de efeito/item ou identificadores.</p>
        <textarea name="effects" spellcheck="false">${escapeHtml(data.json)}</textarea>
        <p class="notes">Ctrl+Enter para salvar. Teste primeiro em uma cópia do mundo.</p>
        <button type="submit"><i class="fas fa-save"></i> Salvar</button>
      </form>`
    );
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
