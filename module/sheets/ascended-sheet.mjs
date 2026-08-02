import { SKILL_LABELS, ATTRIBUTE_LABELS } from "../constants.mjs";
import { buildEffectChanges, buildScoreRows, performRoll, postEffectMessage } from "../utils.mjs";

const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;


export default class AscendedSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "actor", "ascended", "ogm-sheet"],
        position: { width: 650, height: 750 },
        form: { submitOnChange: true },
        actions: {
            setScore: AscendedSheet.#onSetScore,
            setDogmaBreaks: AscendedSheet.#onSetDogmaBreaks,
            openRoll: AscendedSheet.#onOpenRoll,
            toggleBlessing: AscendedSheet.#onToggleBlessing,
            toggleSpell: AscendedSheet.#onToggleSpell,
            toggleEquip: AscendedSheet.#onToggleEquip,
            deleteObject: AscendedSheet.#onDeleteObject,
            adjustQuantity: AscendedSheet.#onAdjustQuantity,
            openItem: AscendedSheet.#onOpenItem
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

    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.actor = this.actor;
        context.system = this.actor.system;
        
        context.attributeRows = buildScoreRows(ATTRIBUTE_LABELS, this.actor.system.attributes);
        context.skillRows = buildScoreRows(SKILL_LABELS, this.actor.system.skills);
        context.dogmaDots = [1, 2, 3].map(n => n <= this.actor.system.dogmaBreaks);

        context.god = this.actor.items.find(i => i.type === "god");
        context.archetype = this.actor.items.find(i => i.type === "archetype");

        context.resourceBars = ["health", "stamina", "sanity"].map(key => {
            const resource = this.actor.system.resources[key];
            const pct = resource.max > 0 ? Math.round((resource.value / resource.max) * 100) : 0;
            return { key, value: resource.value, max:resource.max, pct};
        });

        context.blessingIsActive = this.actor.effects.some(e => e.getFlag("of-gods-and-men", "blessingEffect"));
        context.activeSpellEffect = this.actor.effects.find(e => e.getFlag("of-gods-and-men", "spellEffect"));
        context.activeSpellIndex = context.activeSpellEffect ? context.activeSpellEffect.getFlag("of-gods-and-men", "spellIndex") : null;

        context.inventoryItems = this.actor.items
        .filter(i => i.type === "object")
        .map(item => ({
            item,
            isEquipped: this.actor.effects.some(e => e.getFlag("of-gods-and-men", "objectItemId") === item.id)
        }));

        context.tabs = this._prepareTabs("primary");

        return context;
    }

    async _onDropItem(event, item){
        if (item.type === "god" || item.type === "archetype") {
            const existing = this.actor.items.find(i => i.type === item.type);
            if (existing) {
                await existing.delete();
            }
        }

        if (item.type === "object") {
            const existing = this.actor.items.find(i =>
                i.type === "object" && i.getFlag("of-gods-and-men", "sourceItemId") === item.uuid
            );
            if (existing) {
                await existing.update({ "system.quantity": existing.system.quantity + 1 });
                return existing;
            }
        }
  

        const created = await super._onDropItem(event, item);

        if (item.type === "object" && created) {
            await created.setFlag("of-gods-and-men", "sourceItemId", item.uuid);
        }

        if (item.type === "archetype" && created) {
            await this._promoptArchtypeChoices(created);
        }
        
        return created;
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
            classes: ["ogm-roll-dialog"],
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

    static async #onSetDogmaBreaks(event, target) {
        const clickedValue = Number(target.dataset.value);
        const currentValue = this.actor.system.dogmaBreaks;
        const newValue = clickedValue === currentValue ? clickedValue -1 : clickedValue;

        await this.actor.update({"system.dogmaBreaks": newValue });
    }

    static async #onOpenRoll(event, target) {
        const group = target.dataset.group;
        const key = target.dataset.key;
        await performRoll(this.actor, group, key);
    }

    static async #onToggleBlessing(event, target) {
        const god = this.actor.items.find(i => i.type === "god");
        if(!god){
            ui.notifications.warn("No God Assigned.");
            return;
        }
        
        const existing = this.actor.effects.find(e => e.getFlag("of-gods-and-men", "blessingEffect"));
        
        if (existing) {
            await existing.delete();
            await postEffectMessage(this.actor, {action: "deactivate", name: god.system.blessing.name});
            return;
        }

        const cost = god.system.blessing.cost;
        const currentStamina = this.actor.system.resources.stamina.value;

        if (currentStamina < cost){
            ui.notifications.warn("Not enough Stamina to activate this blessing.");
            return;
        }

        if (cost > 0){
            await this.actor.update({ "system.resources.stamina.value": currentStamina - cost});
        }

        await this.actor.createEmbeddedDocuments("ActiveEffect", [{
            name: god.system.blessing.name || "Blessing",
            img: god.img,
            origin: god.uuid,
            changes: buildEffectChanges(god.system.blessing.effectType, god.system.blessing.effectKey, god.system.blessing.effectValue),
            flags: {
                "of-gods-and-men": {blessingEffect: true}
            }
        }]);

        await postEffectMessage (
            this.actor, 
            { 
                action: "activate", 
                name: god.system.blessing.name, 
                cost, 
                costResource: "Stamina", 
                effectKey: god.system.blessing.effectKey,
                effectValue: god.system.blessing.effectValue
            });
    }

    static async #onToggleSpell(event, target) {
        const god = this.actor.items.find(i => i.type === "god");
        if (!god) return;

        const index = Number(target.dataset.index);
        const spell = god.system.spells[index];

        const existing = this.actor.effects.find(e => e.getFlag("of-gods-and-men", "spellEffect"));

        if(existing) {
            const wasThisSpell = existing.getFlag("of-gods-and-men", "spellIndex") === index;
            await existing.delete();
            await postEffectMessage(this.actor, {action: "deactivate", name: spell.name });
            if (wasThisSpell) return;
        }

        const currentSanity = this.actor.system.resources.sanity.value;
        if (currentSanity < spell.cost){
            ui.notifications.warn("Not enough Sanity to cast this Spell");
            return;
        }

        if (spell.cost > 0) {
            await this.actor.update({"system.resources.sanity.value": currentSanity - spell.cost});
        }

        await this.actor.createEmbeddedDocuments("ActiveEffect", [{
            name: spell.name || "Spell",
            img: god.img,
            origin: god.uuid,
             changes: buildEffectChanges(spell.effectType, spell.effectKey, spell.effectValue),
            flags: {
                "of-gods-and-men": { spellEffect: true, spellIndex: index}
            }
        }]);

        await postEffectMessage (
            this.actor, 
            { 
                action: "activate", 
                name: spell.name, 
                cost: spell.cost, 
                costResource: "Sanity", 
                effectKey: spell.effectKey,
                effectValue: spell.effectValue
            });
    }

    static async #onToggleEquip(event, target) {
        const itemId = target.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item) return;

        const existing = this.actor.effects.find(e => e.getFlag("of-gods-and-men", "objectItemId") === itemId);

        if (existing) {
            await existing.delete();
            await postEffectMessage(this.actor, { action: "deactivate", name: item.name });
            return;
        }

        await this.actor.createEmbeddedDocuments("ActiveEffect", [{
            name: item.name,
            img: item.img,
            origin: item.uuid,
            changes: buildEffectChanges(item.system.effectType, item.system.effectKey, item.system.effectValue, item.system.hasEffect),
            flags: {
            "of-gods-and-men": { objectItemId: itemId }
            }
        }]);

        await postEffectMessage(this.actor, {
            action: "activate",
            name: item.name,
            cost: 0,
            costResource: "",
            effectKey: item.system.effectKey,
            effectValue: item.system.effectValue
        });
    }

    static async #onDeleteObject(event, target) {
    const itemId = target.dataset.itemId;
    const existing = this.actor.effects.find(e => e.getFlag("of-gods-and-men", "objectItemId") === itemId);
    if (existing) await existing.delete();

    const item = this.actor.items.get(itemId);
    if (item) await item.delete();
    }

    static async #onAdjustQuantity(event, target) {
        const itemId = target.dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (!item || item.type !== "object") return;
        
        const delta = Number(target.dataset.delta);
        const newQuantity = Math.max(1, item.system.quantity + delta);
        await item.update({"system.quantity": newQuantity});
    }

    static async #onOpenItem(event, target) {
        const item = this.actor.items.get(target.dataset.itemId);
        if (item) item.sheet.render(true);
    }
    
    get title(){
        return this.actor.name;
    }
}