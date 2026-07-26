const {NumberField, StringField, SchemaField, HTMLField } = foundry.data.fields;

export default class AscendedData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const attributeField = (max = 5) => new NumberField({
            required: true,
            integer: true,
            min: 0,
            max: max,
            initial: 0
        });

        const resourceField = () => new SchemaField({
            value: new NumberField({
                required: true,
                integer: true,
                min:0,
                initial: 1
            }),
            max: new NumberField({
                required: true,
                integer: true,
                min:0,
                initial: 1
            }),
        });

        const schema = {};

        schema.attributes = new SchemaField({
            strength: attributeField(),
            resistance: attributeField(),
            mind: attributeField(),
            personality: attributeField(),
            reflexes: attributeField(),
        });

        schema.skills = new SchemaField({
            closeCombat: attributeField(),
            rangedCombat: attributeField(),
            presence: attributeField(),
            criminality: attributeField(),
            education: attributeField(),
            science: attributeField(),
            divinity: attributeField(),
            survival: attributeField(),
            craftsmanship: attributeField()
        });

        schema.resources = new SchemaField({
            health: resourceField(),
            stamina: resourceField(),
            sanity: resourceField()
        });

        schema.experience = new NumberField({
            required: true,
            integer: true,
            min: 0,
            initial: 0
        });

        schema.divineHelpPoints = new NumberField({
            required: true,
            integer: true,
            min: 0,
            initial:0
        });

        schema.dogmaBreaks = attributeField(3);
            
        return schema;
    }

     prepareDerivedData() {
            const attrs = this.attributes;
            this.npcBonus = 0;
            this.resources.health.max = 1 + attrs.strength + attrs.resistance;
            this.resources.stamina.max = 1 + attrs.resistance + attrs.reflexes;
            this.resources.sanity.max = 1 + attrs.mind + attrs.personality;
        };
}