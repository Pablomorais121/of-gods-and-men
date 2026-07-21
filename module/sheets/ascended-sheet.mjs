import { SKILL_LABELS } from "../constants.mjs";

const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class AscendedSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "actor", "ascended"],
        position: {
            width: 600,
            height: 700
        },
        form: {
            submitOnChange: true
        }
    };

    static PARTS = {
        body: {
            template: "systems/of-gods-and-men/templates/actor/ascended-sheet.hbs"
        }
    };

    async _onDropItem(event, item){
        if (item.type === "god" || item.type === "archetype") {
            const existing = this.actor.items.find(i => i.type === item.type);
            if (existing) {
                await existing.delete();
            }
        }

        const created = await super._onDropItem(event, item);

        if (item.type === "archetype" && created){
            await this._promoptArchtypeChoices(created);
        }
        
        return created;
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.actor = this.actor;
        context.system = this.actor.system;

        context.god = this.actor.items.find(i => i.type === "god");
        context.archetype = this.actor.items.find(i => i.type === "archetype");

        return context;
    }

    async _promoptArchtypeChoices(archetypeItem) {
        const priorities = archetypeItem.system.priorities;
        if (!priorities.length) return;

        const allSkills = Object.keys(SKILL_LABELS);

        const rows = priorities.map((priority, index) => {
            const options = priority.options.length ? priority.options : allSkills;
            const optionsHtml = options
                .map(key => `<option value="${key}">${SKILL_LABELS[key]}</option>`)
                .join("");

            return `
            <div class="form-group">
                <label> Level ${priority.points}</label>
                <select name="priority-${index}">${optionsHtml}</select>
            </div>
            `;
        }).join("");
        
        const chosen = await foundry.applications.api.DialogV2.prompt({
            window: {title: `${archetypeItem.name} - Choose Skills`},
            content: `<form>${rows}</form>`,
            ok: {
                label: "Confirm",
                callback: (event, button) => {
                    const result = {};
                    priorities.forEach((priority, index) => {
                        const skillKey = button.form.elements[`priority-${index}`].value;
                        result[skillKey] = priority.points;
                    });
                    return result;
                }
            }
        });

        if (!chosen) return;

        const updateData = {};
        for (const [skillKey, points] of Object.entries(chosen)) {
            updateData[`system.skills.${skillKey}`] = points;
        }

        await this.actor.update(updateData);
        
    }
}