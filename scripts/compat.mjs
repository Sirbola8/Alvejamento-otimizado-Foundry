import { MODULE_ID } from "./config.mjs";

export function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function getHp(actor) {
  return Number(foundry.utils.getProperty(actor, "system.attributes.hp.value") ?? 0);
}

export function isDead(actor) {
  return getHp(actor) <= 0;
}

export function resolveUuid(uuid) {
  if (!uuid) return null;
  try { return fromUuidSync(uuid); } catch { return null; }
}

export function resolveSourceActor(effect) {
  const origin = resolveUuid(effect?.origin);
  if (origin?.documentName === "Item") return origin.actor ?? origin.parent ?? null;
  if (origin?.documentName === "ActiveEffect") return origin.parent?.actor ?? origin.parent ?? null;
  if (origin?.documentName === "Actor") return origin;
  return null;
}

function collectEffectIdentifiers(effect) {
  const origin = resolveUuid(effect?.origin);
  const values = [
    effect?.name,
    effect?.label,
    effect?.id,
    effect?._id,
    effect?.origin,
    effect?.flags?.dae?.stackable,
    effect?.flags?.["midi-qol"]?.originUuid,
    effect?.flags?.core?.statusId,
    origin?.name,
    origin?.identifier,
    origin?.system?.identifier,
    origin?.flags?.["dnd5e"]?.identifier
  ];
  return values.filter(Boolean).map(normalize);
}

export function matchConfiguredEffect(effect, config) {
  const available = collectEffectIdentifiers(effect);
  const wanted = [
    ...(config.effectNames ?? []),
    ...(config.itemNames ?? []),
    ...(config.itemIdentifiers ?? [])
  ].filter(Boolean).map(normalize);
  return available.some(value => wanted.includes(value));
}

export function getTokenForActor(actor) {
  if (!actor) return null;
  return canvas.tokens?.placeables.find(token => token.actor?.uuid === actor.uuid || token.actor?.id === actor.id) ?? null;
}

export function distanceBetweenTokens(a, b) {
  if (!a || !b) return Infinity;
  try {
    return canvas.grid.measureDistance(a.center, b.center);
  } catch {
    return Infinity;
  }
}

export function isValidTarget(token, casterToken, config) {
  const actor = token?.actor;
  if (!actor || isDead(actor)) return false;
  if (token.id === casterToken?.id) return false;

  if (config.targetMode === "hostile" && casterToken) {
    if (token.document.disposition === casterToken.document.disposition) return false;
  }

  if (config.requireRange) {
    const distance = distanceBetweenTokens(casterToken, token);
    if (distance > Number(config.rangeFeet ?? 0)) return false;
  }
  return true;
}

export function systemGeneration() {
  const version = String(game.system.version ?? "");
  const major = Number(version.split(".")[0]);
  return major >= 4 ? "2024" : "2014";
}

export function damageProfile(config) {
  return config.damageProfile === "system" ? systemGeneration() : (config.damageProfile ?? systemGeneration());
}

export function cloneEffectData(effect) {
  const source = foundry.utils.deepClone(effect.toObject());
  delete source._id;
  delete source.id;
  return source;
}
