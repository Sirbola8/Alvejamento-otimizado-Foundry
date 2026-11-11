export const MODULE_ID = "alvejamento-otimizado";
export const FLAG = "pending";

export const DEFAULT_EFFECTS = [
  {
    id: "hunters-mark",
    label: "Hunter's Mark",
    effectNames: ["Hunter's Mark", "Hunter’s Mark"],
    itemNames: ["Hunter's Mark", "Hunter’s Mark"],
    itemIdentifiers: ["hunters-mark", "hunter-s-mark", "hunter's-mark"],
    targetMode: "hostile",
    requireRange: true,
    rangeFeet: 90,
    preserveDuration: true,
    transferEffect: true,
    damageProfile: "system"
  },
  {
    id: "hex",
    label: "Hex",
    effectNames: ["Hex"],
    itemNames: ["Hex"],
    itemIdentifiers: ["hex"],
    targetMode: "hostile",
    requireRange: true,
    rangeFeet: 90,
    preserveDuration: true,
    transferEffect: true,
    damageProfile: "system"
  }
];

export function getEffects() {
  return foundry.utils.deepClone(game.settings.get(MODULE_ID, "effects"));
}

export function setEffects(value) {
  return game.settings.set(MODULE_ID, "effects", value);
}
