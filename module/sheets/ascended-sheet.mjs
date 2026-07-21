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
            submitOnChange: true,
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
        
        return super._onDropItem(event, item);
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        context.actor = this.actor;
        context.system = this.actor.system;

        context.god = this.actor.items.find(i => i.type === "god");
        context.archetype = this.actor.items.find(i => i.type === "archetype");

        return context;
    }
}