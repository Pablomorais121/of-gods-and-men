const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export default class GodSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
    
    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "item", "god"],
        position: {
            width: 500,
            height: 600
        },
        form: {
            submitOnChange: true,
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
        return context;
    }
}