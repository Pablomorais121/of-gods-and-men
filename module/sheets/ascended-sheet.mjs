const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class AscendedSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    
    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "actor", "ascended"],
        position: {
            width: 600,
            height: 700
        }
    };

    static PARTS = {
        body: {
            template: "systems/of-gods-and-men/templates/actor/ascended-sheet.hbs"
        }
    };

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.actor = this.actor;
        context.system = this.actor.system;
        return context;
    }
}