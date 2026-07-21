const { StringField, NumberField, HTMLField, SchemaField, ArrayField } = foundry.data.fields;

export default class ArchetypeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const schema = {};

    schema.description = new HTMLField();


    //NOTE: option.length === 0 means the player chooses freely from any skill
    schema.priorities = new ArrayField(
      new SchemaField({
        points: new NumberField({ required: true, integer: true, min: 0, initial: 1 }),
        options: new ArrayField(new StringField({ required: true, blank: false }))
      }),
      { initial: [] }
    );

    return schema;
  }
}