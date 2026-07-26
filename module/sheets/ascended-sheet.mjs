import { SKILL_LABELS, ATTRIBUTE_LABELS } from "../constants.mjs";

const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

function buildScoreRows(labels, values){
    return Object.entries(labels).map(([key, label]) => {
        const value = values[key];
        const dots = [1, 2, 3, 4, 5].map(n => n <= value);
        return { key, label, value, dots};
    });
}
export default class AscendedSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "actor", "ascended", "ogm-sheet"],
        position: { width: 650, height: 750 },
        form: { submitOnChange: true },
        actions: {
            setScore: AscendedSheet.#onSetScore
        }
    };

    static PARTS = {
        tabs: {template: "templates/generic/tab-navigation.hbs"},
        attributes: {template: "systems/of-gods-and-men/templates/actor/ascended/attributes.hbs"},
        inventory: {template: "systems/of-gods-and-men/templates/actor/ascended/inventory.hbs"},
        godArchetype: {template: "systems/of-gods-and-men/templates/actor/ascended/god-archetype.hbs"},
        spells: {template: "systems/of-gods-and-men/templates/actor/ascended/spells.hbs"}
    };

    static TABS = {
        primary: {
            tabs: [
                { id:"attributes", label: "Attributes"},
                { id: "inventory", label: "Inventory"},
                { id: "godArchetype", label: "God & Archetype" },
                { id: "spells", label: "Spells" }
            ],
            initial: "attributes"
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
        context.attributeRows = buildScoreRows(ATTRIBUTE_LABELS, this.actor.system.attributes);
        context.skillRows = buildScoreRows(SKILL_LABELS, this.actor.system.skills);
        context.god = this.actor.items.find(i => i.type === "god");
        context.archetype = this.actor.items.find(i => i.type === "archetype");

        context.tabs = this._prepareTabs("primary");

        return context;
    }

    _prepareTabs(group) {
        return this.constructor.TABS[group].tabs.reduce((tabs, t) => {
            const isActive = (this.tabGroups[group] ?? this.constructor.TABS[group].initial) === t.id;
            tabs[t.id] = {...t, group, active: isActive, cssClass: isActive ? "active" : ""};
            return tabs;
        }, {});
    }

    async _preparePartContext(partId, context) {
        context = await super._preparePartContext(partId, context);
        if (context.tabs?.[partId]) {
            context.tab = context.tabs[partId];
        }
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

    static async #onSetScore(event, target) {
        const group = target.dataset.group;
        const key = target.dataset.key;
        const clickedValue = Number(target.dataset.value);

        const currentValue = this.actor.system[group][key];
        const newValue = clickedValue === currentValue ? clickedValue -1 : clickedValue;

        await this.actor.update({ [`system.${group}.${key}`] : newValue});
    }

    get title(){
        return this.actor.name;
    }
}