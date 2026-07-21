const { StringField, NumberField, HTMLField, SchemaField, ArrayField } = foundry.data.fields;

export default class GodData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
        const schema ={};

        schema.description = new HTMLField();

        schema.blessing = new SchemaField({
            name: new StringField({required: true, blank: true}),
            cost: new NumberField({required: true, integer: true, min: 0, initial: 0}),
            description: new HTMLField()
        });

        schema.dogma = new SchemaField({
            name: new StringField({required: true, blank: true}),
            description: new HTMLField()
        });

        schema.spells = new ArrayField(
            new SchemaField({
                name: new StringField({required: true, blank: true}),
                cost: new NumberField({required: true, integer:true, min:0, initial: 0}),
                description: new HTMLField()
            }),
            { initial: [] }
        );

        return schema;
    };
}