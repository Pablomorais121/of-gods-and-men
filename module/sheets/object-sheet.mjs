import { PlayEditMixin } from "../sheet-mixins.mjs";

const { HandlebarsApplicationMixin} = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
import { SKILL_LABELS, ATTRIBUTE_LABELS } from "../constants.mjs";

export default class ObjectSheet extends PlayEditMixin(HandlebarsApplicationMixin(ItemSheetV2)) {
    
    static DEFAULT_OPTIONS ={
        classes: ["of-gods-and-men", "sheet", "item", "object", "ogm-sheet"],
        position: { width: 500, height: 600 },
        form: { submitOnChange: true },
        actions: {
            toggleMode: ObjectSheet._onToggleMode,
        }
    };

    static PARTS = {
        body: {
            template: "systems/of-gods-and-men/templates/item/object-sheet.hbs"
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

}