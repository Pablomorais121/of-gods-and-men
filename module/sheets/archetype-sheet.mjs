import { SKILL_LABELS } from "../constants.mjs";
const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
import { PlayEditMixin } from "../sheet-mixins.mjs";


export default class ArchetypeSheet extends PlayEditMixin(HandlebarsApplicationMixin(ItemSheetV2)) {
    
    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "item", "archetype", "ogm-sheet"],
        position: { width: 500, height: 600},
        form: { submitOnChange: true },
        actions: {
            addPriority: ArchetypeSheet.#onAddPriority,
            deletePriority: ArchetypeSheet.#onDeletePriority,
            setPriorityPoints: ArchetypeSheet.#onSetPriorityPoints,
            toggleMode: ArchetypeSheet._onToggleMode
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

        context.priorityRows = this.item.system.priorities.map((p, index) => ({
            index,
            points: p.points,
            options: p.options,
            dots: [1, 2, 3].map(n => n <= p.points),
            optionsLabel: p.options.length ? p.options.map(key => SKILL_LABELS[key]).join(", ") : "Any Skill"
        }));
        context.skillChoices = Object.entries(SKILL_LABELS).map(([key, label]) => ({ key, label }));
        
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

    static async #onSetPriorityPoints(event, target) {
        const index = Number(target.dataset.index);
        const clickedValue = Number(target.dataset.value);

        const priorities = foundry.utils.deepClone(this.item.system.priorities);
        const currentValue = priorities[index].points;
        priorities[index].points = clickedValue === currentValue ? clickedValue - 1: clickedValue
        await this.item.update({ "system.priorities": priorities});
    }

    _onRender(context, options) {
        super._onRender(context, options);
        if (!context.editable) return;

        this.element.querySelectorAll(".priority-skills").forEach(container => {
            container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener("change", () => this.#saveOptionsForRow(container));
            })
        });
    }
    
    async #saveOptionsForRow(container) {
        const index = Number(container.dataset.index);
        const checked = Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);

        const priorities = foundry.utils.deepClone(this.item.system.priorities);
        priorities[index].options = checked;

        await this.item.update({ "system.priorities" : priorities});
    }

}