import { SKILL_LABELS } from "../constants.mjs";
const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;


export default class ArchetypeSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    
    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "item", "archetype", "ogm-sheet"],
        position: { width: 500, height: 600},
        form: { submitOnChange: true },
        actions: {
            addPriority: ArchetypeSheet.#onAddPriority,
            deletePriority: ArchetypeSheet.#onDeletePriority,
            savePriority: ArchetypeSheet.#onSavePriority
        }
    };

    static PARTS = {
        body: {
            template: "systems/of-gods-and-men/templates/item/archetype-sheet.hbs"
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.item = this.item;
        context.system = this.item.system;

        context.skillChoices = Object.entries(SKILL_LABELS).map(([key, label]) => ({key, label}));

        return context;
    }

    static async #onAddPriority(event, target) {
        const priorities = foundry.utils.deepClone(this.item.system.priorities);
        priorities.push({points: 1, options: []});
        await this.item.update({ "system.priorities": priorities });
    }

    static async #onDeletePriority(event, target) {
        const index = Number(target.dataset.index);
        const priorities = foundry.utils.deepClone(this.item.system.priorities);
        priorities.splice(index, 1);
        await this.item.update({ "system.priorities": priorities});
    }

    static async #onSavePriority(event, target) {
        const rows = this.element.querySelectorAll(".priority-row");
        const priorities = Array.from(rows).map(row =>{
            const points = Number(row.querySelector(".priority-points").value);
            const optionText = row.querySelector(".priority-options").value;
            const options = Array.from(row.querySelector(".priority-options").selectedOptions).map(o => o.value);
            return { points, options };
        });
        await this.item.update({ "system.priorities": priorities});
    }
}