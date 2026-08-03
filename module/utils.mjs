import { SKILL_LABELS, ATTRIBUTE_LABELS } from "./constants.mjs";

const {DialogV2} = foundry.applications.api;

export function buildScoreRows(labels, values){
    return Object.entries(labels).map(([key, label]) => {
        const value = values[key];
        const dots = [1, 2, 3, 4, 5].map(n => n <= value);
        return { key, label, value, dots};
    });
}

export  async function performRoll(actor, group, key) {
        const primaryLabel = group === "attributes" ? ATTRIBUTE_LABELS[key] : SKILL_LABELS[key];

        const attributeOptions = Object.entries(ATTRIBUTE_LABELS)
            .filter(([k]) => !(group === "attributes" && k === key ))
            .map(([k, label]) => ({ key: k, label}));
        
        const skillOptions = Object.entries(SKILL_LABELS)
            .filter(([k]) => !(group === "skills" && k === key ))
            .map(([k, label]) => ({ key: k, label}));

        const dialogContent = await foundry.applications.handlebars.renderTemplate(
            "systems/of-gods-and-men/templates/apps/roll-dialog.hbs",
            {attributeOptions, skillOptions}
        )
        const result = await DialogV2.prompt({
            window: {title: `Roll: ${primaryLabel}`},
            classes: ["ogm-roll-dialog"],
            content: dialogContent,

            render: (event, dialog) => {
                const skillCheckBox = dialog.element.querySelector('[name="skillCheck"]');
                const attackRollBox = dialog.element.querySelector('[name="attackRoll"]');
                const advantageBox = dialog.element.querySelector('[name="advantage"]');
                const disadvantageBox = dialog.element.querySelector('[name="disadvantage"]');
                const attributeSelect = dialog.element.querySelector('[name="secondaryAttribute"]');
                const skillSelect = dialog.element.querySelector('[name="secondarySkill"]');
                
                attributeSelect.addEventListener("change", () => {
                    if (attributeSelect.value) skillSelect.value = "";
                })
                skillSelect.addEventListener("change", () => {
                    if (skillSelect.value) attributeSelect.value = "";
                })
                skillCheckBox.addEventListener("change", () => {
                    if (skillCheckBox.checked) attackRollBox.checked = false;
                });
                attackRollBox.addEventListener("change", () => {
                    if (attackRollBox.checked) skillCheckBox.checked = false;
                });
                advantageBox.addEventListener("change", () => {
                    if (advantageBox.checked) disadvantageBox.checked = false;
                });
                disadvantageBox.addEventListener("change", () => {
                    if (disadvantageBox.checked) advantageBox.checked = false;
                });
            },
            ok: {
                label: "Roll",
                callback: (event, button) => ({
                    secondaryAttribute: button.form.elements.secondaryAttribute.value,
                    secondarySkill: button.form.elements.secondarySkill.value,
                    advantage: button.form.elements.advantage.checked,
                    disadvantage: button.form.elements.disadvantage.checked,
                    isAttack: button.form.elements.attackRoll.checked
                })
            }
        });
        
        if (!result) return;

        const primaryValue = actor.system[group][key]
        const secondaryKey = result.secondaryAttribute || result.secondarySkill;
        const secondaryGroup = result.secondaryAttribute ? "attributes" : "skills";

        let secondaryValue;
        if (secondaryKey) {
            secondaryValue = actor.system[secondaryGroup][secondaryKey]
        } else {
            secondaryValue = primaryValue;
        }
        const modifier = primaryValue + secondaryValue;

        let formula;
        if (result.disadvantage) {
            formula = `${modifier}`;
        } else if (result.advantage){
            formula = `2d12kh1 + ${modifier}`;
        } else {
            formula = `1d12 + ${modifier}`;
        }

        const roll = new Roll(formula);
        await roll.evaluate();

        let critical = false;
        let fumble = false;

        if (!result.disadvantage) {
            const dieTerm = roll.terms.find(t => Array.isArray(t.results));
            const activeResult = dieTerm.results.find(r => r.active);

            if (activeResult.result === 12) critical = true;
            if (activeResult.result === 1) fumble = true;
        }

        const secondaryLabel = secondaryKey ? (ATTRIBUTE_LABELS[secondaryKey] ?? SKILL_LABELS[secondaryKey]) : null;
        const rollHTML = await roll.render();

        let title = primaryLabel;
        title += secondaryKey ? ` + ${secondaryLabel}` : ` (x2)`;

        const templateData = {
            title,
            secondaryLabel,
            critical,
            fumble,
            isAttack: result.isAttack,
            rollHTML,
            showAttackButtons: false
        };

        let messageFlags = {};

        if (result.isAttack) {
            const target = game.user.targets.first();

            if (!target) {
                ui.notifications.warn("No target selected for this attack");
            } else {
                messageFlags["of-gods-and-men"] = {
                    attackerActorId: actor.id,
                    attackerStrength: actor.system.attributes.strength,
                    attackTotal: roll.total,
                    targetActorId: target.actor.id
                };
                templateData.showAttackButtons = true;
            }
        }

        const content = await foundry.applications.handlebars.renderTemplate(
            "systems/of-gods-and-men/templates/chat/roll-card.hbs",
            templateData
        );

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content,
            rolls: [roll],
            sound: CONFIG.sounds.dice,
            flags: messageFlags
        });
}

export async function onDefendClick(message, button) {
    const data = message.flags["of-gods-and-men"];
    if (!data) return;

    const defenseType = button.dataset.defense;
    const targetActor = game.actors.get(data.targetActorId);

    if(!targetActor) {
        ui.notifications.error("target actor not found.");
        return;
    }

    const defenseAttribute = defenseType === "block" ? "strength" : "reflexes";
    const defenseValue = targetActor.system.attributes[defenseAttribute];

    const defenseRoll = new Roll(`1d12 + ${defenseValue}`);
    await defenseRoll.evaluate();

    let critical = false;
    let fumble = false;

    const dieTerm = defenseRoll.terms.find(t => Array.isArray(t.results));
    if (dieTerm) {
        const activeResult = dieTerm.results.find(r => r.active);
        if (activeResult.result === 12) critical = true;
        if (activeResult.result === 1) fumble = true;
    }

    const success = defenseRoll.total >= data.attackTotal;
    const damage = success ? 0 : data.attackerStrength + 1;

    const rollHTML = await defenseRoll.render();

    const templateData = {
        title: `${targetActor.name} ${defenseType === "block" ? "Blocks" : "Dodges"}`,
        critical,
        fumble,
        isAttack: false,
        rollHTML,
        showAttackButtons: false,
        outcome: success ? "Success!" : `Failed! Takes ${damage} damage.`,
        outcomeClass: success ? "outcome-success" : "outcome-fail"
    };

    const content = await foundry.applications.handlebars.renderTemplate(
        "systems/of-gods-and-men/templates/chat/roll-card.hbs",
        templateData
    );

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: targetActor }),
        content,
        rolls: [defenseRoll]
    });

    if (!success) {
        const newHealth = Math.max(0, targetActor.system.resources.health.value - damage);
        await targetActor.update({ "system.resources.health.value": newHealth });
    }
    await message.update({ "flags.of-gods-and-men.resolved": true});

    button.closest(".attack-buttons").remove();

}

export async function resolvePcTies(combat) {
    const pcCombatants = combat.combatants.filter(c => c.actor?.type === "ascended" && c.initiative !== null);

    const groups = {};
    for (const c of pcCombatants) {
        groups[c.initiative] ??= [];
        groups[c.initiative].push(c);
    }
    for (const tied of Object.values(groups)) {
        if (tied.length < 2) continue;
        await breakTie(tied);
    }
}

async function breakTie(combatants) {
    let rolls;
    let allDistinct;

    do {
        rolls = await Promise.all(combatants.map(() => new Roll("1d12").evaluate()));
        const values = rolls.map(r => r.total);
        allDistinct = new Set(values).size === values.length;
    } while (!allDistinct);

    const updates = combatants.map((c, i) => ({
        _id: c.id,
        initiative: c.initiative + rolls[i].total / 100
    }));

    await combatants[0].combat.updateEmbeddedDocuments("Combatant", updates, { ogmTieBreak: true});
}

function labelForEffectKey(effectKey) {
    if (!effectKey) return null;
    const [group, key] = effectKey.split(".");
    const labels = group === "attributes" ? ATTRIBUTE_LABELS : SKILL_LABELS;
    return labels?.[key] ?? effectKey;
}

export async function postEffectMessage(actor, { action, name, cost, costResource, effectKey, effectValue }) {
    const title = action === "activate"
        ? `${actor.name} activates ${name}`
        : `${actor.name} deactivates ${name}`;

    let description = "";
    if (action === "activate") {
        if (cost > 0) description += `<p>Cost: ${cost} ${costResource}</p>`
        if (effectKey) {
            const label = labelForEffectKey(effectKey);
            description += `<p>Effect: ${label} ${effectValue >= 0 ? "+" : ""}${effectValue}</p>`;
        }
    }

    const content = await foundry.applications.handlebars.renderTemplate(
        "systems/of-gods-and-men/templates/chat/effect-card.hbs",
        { title, description }
    );

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor }),
        content
    });
}

export function buildEffectChanges(effectType, effectKey, effectValue, hasEffect = true) {
    if( !hasEffect) return [];

    if (effectType === "single" && effectKey) {
        return [{ key: `system.${effectKey}`, mode: 2, value: effectValue, priority: 20 }];
    }
    if (effectType === "allSkills") {
        return Object.keys(SKILL_LABELS).map(key => ({
            key: `system.skills.${key}`, mode: 2, value: effectValue, priority: 20
        }));
    }
    if (effectType === "allAttributes") {
        return Object.keys(ATTRIBUTE_LABELS).map(key => ({
            key: `system.attributes.${key}`, mode: 2, value: effectValue, priority: 20
        }));
    }
    return [];
}