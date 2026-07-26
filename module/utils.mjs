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

        const attributeOptionsHtml = Object.entries(ATTRIBUTE_LABELS)
            .filter(([k]) => !(group === "attributes" && k === key ))
            .map(([k, label]) => `<option value="${k}">${label}</option>`)
            .join("");
        
        const skillOptionsHtml = Object.entries(SKILL_LABELS)
            .filter(([k]) => !(group === "skills" && k === key ))
            .map(([k, label]) => `<option value="${k}">${label}</option>`)
            .join(""); 

        const result = await DialogV2.prompt({
            window: {title: `Roll: ${primaryLabel}`},
            content: `
                <form>
                    <div class="form-group">
                        <label>Attribute</label>
                            <select name="secondaryAttribute">
                                <option value="">None</option>
                                ${attributeOptionsHtml}
                            </select>
                    </div>
                    <div class="form-group">
                        <label>Skill</label>
                        <select name="secondarySkill">
                            <option value="">None</option>
                            ${skillOptionsHtml}
                        </select>
                    </div>

                    <div class="form-group">
                        <label><input type="checkbox" name="advantage"> Advantage</label>
                    </div>
                    <div class="form-group">
                        <label><input type="checkbox" name="disadvantage"> Disadvantage</label>
                    </div>
                    <div class="form-group">
                        <label><input type="checkbox" name="skillCheck" checked> Skill Check</label>
                    </div>
                    <div class="form-group">
                        <label><input type="checkbox" name="attackRoll"> Attack Roll</label>
                    </div>
                </form>
            `,
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

        let flavor = `<strong>${primaryLabel}</strong>`;
        if (secondaryKey) {
            const secondaryLabel = ATTRIBUTE_LABELS[secondaryKey] ?? SKILL_LABELS[secondaryKey];
            flavor += ` + ${secondaryLabel}`
        } else {
            flavor += ` (x2)`; 
        }
        if (critical) flavor += `<br><strong style="color: #8a1f1f;">✦ CRITICAL!</strong>`;
        if (fumble) flavor += `<br><strong style="color: #8a1f1f;">✦ FUMBLE!</strong>`;
        if (result.isAttack) flavor += ` - Attack Roll`;

        let messageFlags = {};
        
        if (result.isAttack) {
            const target = game.user.targets.first();

            if (!target) {
                ui.notifications.warn("No target selected for this attack.");
            }else{
                messageFlags["of-gods-and-men"] = {
                    attackerActorId: actor.id,
                    attackerStrength: actor.system.attributes.strength,
                    attackTotal: roll.total,
                    targetActorId: target.actor.id
                };

                flavor += `
                    <div class="attack-buttons">
                        <button type="button" data-action="defend" data-defense="block"> Block </button>
                        <button type="button" data-action="defend" data-defense="dodge"> Dodge </button>
                    </div>
                `;
            }
        }

        await roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: actor}),
            flavor,
            flags: messageFlags
        });
    }