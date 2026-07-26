const {NumberField, SchemaField } = foundry.data.fields;

export default class NPCData extends foundry.abstract.TypeDataModel {
    static defineSchema() {

        const schema = {};

        schema.tier = new NumberField({
            required: true,
            integer: true,
            min: 0,
            max: 10,
            initial: 0
        });

        const npcAttributeField = () => new NumberField({
            required: true,
            integer: true,
            min: 0,
            max: 10,
            initial: 0
        });

        const npcResourceField = () => new SchemaField({
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


        schema.attributes = new SchemaField({
            strength: npcAttributeField(),
            resistance: npcAttributeField(),
            mind: npcAttributeField(),
            personality: npcAttributeField(),
            reflexes: npcAttributeField(),
        });

        schema.skills = new SchemaField({
            closeCombat: npcAttributeField(),
            rangedCombat: npcAttributeField(),
            presence: npcAttributeField(),
            criminality: npcAttributeField(),
            education: npcAttributeField(),
            science: npcAttributeField(),
            divinity: npcAttributeField(),
            survival: npcAttributeField(),
            craftsmanship: npcAttributeField()
        });

        schema.resources = new SchemaField({
            health: npcResourceField(),
            stamina: npcResourceField(),
            sanity: npcResourceField()
        });
 
        return schema;
    }

    prepareDerivedData() {
        const {strength, resistance, reflexes, mind, personality} = this.attributes;
        this.npcBonus = 1;
        this.resources.health.max = 1 + strength + resistance;
        this.resources.stamina.max = 1 + resistance + reflexes;
        this.resources.sanity.max = 1 + mind + personality;
    };
}