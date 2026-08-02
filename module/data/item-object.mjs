const { StringField, NumberField, HTMLField, BooleanField } = foundry.data.fields;

export default class ObjectData extends foundry.abstract.TypeDataModel {

    static defineSchema() {
        const schema ={};

        schema.description = new HTMLField();
        schema.hasEffect = new BooleanField({ required: true, initial: false });

        schema.effectType = new StringField({ required: true, initial: "none", choices:["none", "single", "allSkills", "allAttributes"]});
        schema.effectKey = new StringField({ required: true, blank: true});
        schema.effectValue = new NumberField({required: true, integer: true, initial: 0});

        return schema;
    };
}