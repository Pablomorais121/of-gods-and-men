import { SKILL_LABELS, ATTRIBUTE_LABELS } from "../constants.mjs";
import { buildScoreRows, performRoll } from "../utils.mjs";

const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class NPCSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "actor", "npc", "ogm-sheet"],
        position: { width: 500, height: 600 },
        form: { submitOnChange: true },
        actions:{
            setScore: NPCSheet.#onSetScore,
            openRoll: NPCSheet.#onOpenRoll
        }
    };

    static PARTS = {
        body: {
            template: "systems/of-gods-and-men/templates/actor/npc-sheet.hbs"
        }
    };


    async _prepareContext(options) {
        const context = await super._prepareContext(options);

        context.actor = this.actor;
        context.system = this.actor.system;
        context.attributeRows = buildScoreRows(ATTRIBUTE_LABELS, this.actor.system.attributes);
        context.skillRows = buildScoreRows(SKILL_LABELS, this.actor.system.skills);

        context.resourceBars = ["health", "stamina", "sanity"].map(key => {
            const resource = this.actor.system.resources[key];
            const pct = resource.max > 0 ? Math.round((resource.value / resource.max) * 100) : 0;
            return { key, value: resource.value, max:resource.max, pct};
        });

        return context;
    }

    static async #onSetScore(event, target) {
        const group = target.dataset.group;
        const key = target.dataset.key;
        const clickedValue = Number(target.dataset.value);

        const currentValue = this.actor.system[group][key];
        const newValue = clickedValue === currentValue ? clickedValue -1 : clickedValue;

        await this.actor.update({ [`system.${group}.${key}`] : newValue});
    }

    static async #onOpenRoll(event, target) {
        const group = target.dataset.group;
        const key = target.dataset.key;
        await performRoll(this.actor, group, key);
    }

    get title(){
        return this.actor.name;
    }

}