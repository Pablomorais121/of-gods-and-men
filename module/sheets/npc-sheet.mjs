import { SKILL_LABELS } from "../constants.mjs";

const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class NPCSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "actor", "npc", "ogm-sheet"],
        position: { width: 500, height: 600 },
        form: { submitOnChange: true }
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
        return context;
    }

}