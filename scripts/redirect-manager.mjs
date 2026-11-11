import { getEffects, MODULE_ID, FLAG } from "./config.mjs";
import {
  isDead, resolveSourceActor, matchConfiguredEffect, isValidTarget,
  damageProfile, cloneEffectData
} from "./compat.mjs";

export class RedirectManager {
  constructor() {
    this.lastWorkflow = null;
    this.lastActiveEffectWorkflow = null;
  }

  registerHooks() {
    Hooks.on("updateActor", (actor, changes) => this.onActorUpdate(actor, changes));
    Hooks.on("updateToken", (doc, changes) => this.onTokenUpdate(doc, changes));
    Hooks.on("combatTurn", (combat, updateData) => this.onCombatTurn(combat, updateData));
    game.socket.on(`module.${MODULE_ID}`, packet => this.onSocket(packet));
  }

  async onActorUpdate(actor, changes) {
    const hpChanged = foundry.utils.hasProperty(changes, "system.attributes.hp.value");
    if (hpChanged && isDead(actor)) await this.inspectDeadTarget(actor);
  }

  async onTokenUpdate(doc, changes) {
    if (!("actorData" in changes || "actorId" in changes)) return;
    if (doc.actor && isDead(doc.actor)) await this.inspectDeadTarget(doc.actor);
  }

  async inspectDeadTarget(targetActor) {
    for (const effect of targetActor.effects.contents) {
      for (const config of getEffects()) {
        if (!config.transferEffect || !matchConfiguredEffect(effect, config)) continue;

        const casterActor = resolveSourceActor(effect);
        if (!casterActor) continue;

        const pending = {
          id: foundry.utils.randomID(),
          configId: config.id,
          label: config.label,
          casterActorUuid: casterActor.uuid,
          targetActorUuid: targetActor.uuid,
          effectUuid: effect.uuid,
          effectData: cloneEffectData(effect),
          createdAt: Date.now(),
          damageProfile: damageProfile(config)
        };

        const current = casterActor.getFlag(MODULE_ID, FLAG) ?? [];
        if (current.some(item => item.effectUuid === pending.effectUuid)) continue;
        await casterActor.setFlag(MODULE_ID, FLAG, [...current, pending]);
      }
    }
  }

  async onCombatTurn(combat, updateData) {
    if (!combat?.started || !Number.isInteger(updateData?.turn)) return;

    const nextCombatant = combat.turns?.[updateData.turn];
    const actor = nextCombatant?.actor;
    if (!actor) return;

    const pending = actor.getFlag(MODULE_ID, FLAG) ?? [];
    if (!pending.length) return;

    const user = this.findOwner(actor);
    if (!user) return;

    game.socket.emit(`module.${MODULE_ID}`, {
      type: "prompt",
      userId: user.id,
      casterUuid: actor.uuid,
      pending
    });
  }

  findOwner(actor) {
    const owners = game.users.filter(user => user.active && (user.isGM || actor.testUserPermission(user, "OWNER")));
    return owners.find(user => !user.isGM) ?? owners[0] ?? null;
  }

  async onSocket(packet) {
    if (!packet?.type) return;
    if (packet.userId && packet.userId !== game.user.id) return;

    if (packet.type === "prompt") {
      const caster = await fromUuid(packet.casterUuid);
      if (!caster) return;
      for (const pending of packet.pending ?? []) await this.promptRedirect(caster, pending);
      return;
    }

    if (packet.type === "redirect") {
      if (!game.user.isGM) return;
      await this.redirectAsGM(packet);
    }
  }

  async promptRedirect(caster, pending) {
    const config = getEffects().find(item => item.id === pending.configId);
    if (!config) return this.removePending(caster, pending.id);

    const casterToken = canvas.tokens?.placeables.find(token => token.actor?.uuid === caster.uuid);
    if (!casterToken) return;

    const candidates = canvas.tokens.placeables
      .filter(token => isValidTarget(token, casterToken, config))
      .sort((a, b) => String(a.name).localeCompare(String(b.name), "pt-BR"));

    if (!candidates.length) {
      ui.notifications.info(`${config.label}: nenhum alvo válido no alcance.`);
      return this.removePending(caster, pending.id);
    }

    const buttons = candidates.map(token => ({
      action: `target-${token.id}`,
      label: token.name,
      callback: async () => {
        const packet = {
          type: "redirect",
          userId: game.users.find(user => user.isGM)?.id,
          casterUuid: caster.uuid,
          targetUuid: token.actor.uuid,
          pendingId: pending.id
        };
        game.socket.emit(`module.${MODULE_ID}`, packet);
      }
    }));

    buttons.push({
      action: "cancel",
      label: "Não redirecionar",
      callback: async () => this.removePending(caster, pending.id)
    });

    await foundry.applications.api.DialogV2.wait({
      window: { title: "Alvejamento Otimizado", icon: "fas fa-crosshairs" },
      content: `<div class="ao-dialog"><h3>${escapeHtml(config.label)}</h3><p>O alvo original chegou a 0 HP.</p><p>Escolha um novo alvo válido para manter o efeito.</p><small>Alcance configurado: ${config.requireRange ? `${config.rangeFeet} ft` : "sem limite"} · Perfil: ${pending.damageProfile}</small></div>`,
      buttons
    });
  }

  async redirectAsGM(packet) {
    const caster = await fromUuid(packet.casterUuid);
    const targetActor = await fromUuid(packet.targetUuid);
    if (!caster || !targetActor || isDead(targetActor)) return;

    const pending = (caster.getFlag(MODULE_ID, FLAG) ?? []).find(item => item.id === packet.pendingId);
    if (!pending) return;

    const config = getEffects().find(item => item.id === pending.configId);
    if (!config) return this.removePending(caster, pending.id);

    const casterToken = canvas.tokens?.placeables.find(token => token.actor?.uuid === caster.uuid);
    const targetToken = canvas.tokens?.placeables.find(token => token.actor?.uuid === targetActor.uuid);
    if (!isValidTarget(targetToken, casterToken, config)) return;

    const source = foundry.utils.deepClone(pending.effectData);
    delete source._id;
    delete source.id;

    await targetActor.createEmbeddedDocuments("ActiveEffect", [source]);
    await this.removePending(caster, pending.id);

    ui.notifications.info(`${config.label} redirecionado para ${targetActor.name}.`);
  }

  async removePending(caster, id) {
    const current = caster.getFlag(MODULE_ID, FLAG) ?? [];
    await caster.setFlag(MODULE_ID, FLAG, current.filter(item => item.id !== id));
  }
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}
