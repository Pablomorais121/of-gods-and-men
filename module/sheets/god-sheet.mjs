const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
import { SKILL_LABELS, ATTRIBUTE_LABELS } from "../constants.mjs";

export default class GodSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    
    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "item", "god", "ogm-sheet"],
        position: { width: 500, height: 600 },
        form: { submitOnChange: true },
        actions: {
            addSpell: GodSheet.#onAddSpell,
            deleteSpell: GodSheet.#onDeleteSpell,
            saveSpell: GodSheet.#onSaveSpell
        }
    };

    static PARTS = {
        body: {
            template: "systems/of-gods-and-men/templates/item/god-sheet.hbs"
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.item = this.item;
        context.system = this.item.system;

        context.attributeOptions = Object.entries(ATTRIBUTE_LABELS).map(([key, label]) => ({ key, label }));
        context.skillOptions = Object.entries(SKILL_LABELS).map(([key, label]) => ({ key, label }));
        
        return context;
    }

    static async #onAddSpell(event, target) {
        const spell = foundry.utils.deepClone(this.item.system.spells);
        spell.push({ name: "", cost: 0, description: "", effectType: "none", effectKey: "", effectValue: 0 });
        await this.item.update({ "system.spells": spell });
    }

    static async #onDeleteSpell(event, target) {
        const index = Number(target.dataset.index);
        const spells = foundry.utils.deepClone(this.item.system.spells);
        spells.splice(index, 1);
        await this.item.update({ "system.spells": spells});
    }

    static async #onSaveSpell(event, target) {
        const rows = this.element.querySelectorAll(".spell-row");
        const spells = Array.from(rows).map(row =>{
            const cost = Number(row.querySelector(".spell-cost").value);
            const name = row.querySelector(".spell-name").value;
            const description = row.querySelector(".spell-description").value;
            const effectType = row.querySelector(".spell-effect-type").value;
            const effectKey = row.querySelector(".spell-effect-key").value;
            const effectValue = Number(row.querySelector(".spell-effect-value").value);
            return { cost, name, description, effectType, effectKey, effectValue };
        });
        await this.item.update({ "system.spells": spells});
    }

}