import AscendedData from "./data/actor-ascended.mjs";
import GodData from "./data/item-god.mjs";
import ArchetypeData from "./data/item-archetype.mjs";
import AscendedSheet from "./sheets/ascended-sheet.mjs";
import GodSheet from "./sheets/god-sheet.mjs";
import ArchetypeSheet from "./sheets/archetype-sheet.mjs";

Hooks.once("init", () => {
    console.log("Of Gods and Men | Initializing System");

    CONFIG.Actor.dataModels.ascended = AscendedData;
    CONFIG.Item.dataModels.god = GodData;
    CONFIG.Item.dataModels.archetype = ArchetypeData;

    const {Actors, Items} = foundry.documents.collections;

    Handlebars.registerHelper("includes", (arr, value) => arr.includes(value));


    Actors.registerSheet("of-gods-and-men", AscendedSheet, {
        types: ["ascended"],
        makeDefault: true,
        label: "Ascended Sheet"
    });

    Items.registerSheet("of-gods-and-men", GodSheet, {
        types: ["god"],
        makeDefault: true,
        label: "God Sheet"
    });

    Items.registerSheet("of-gods-and-men", ArchetypeSheet, {
        types: ["archetype"],
        makeDefault: true,
        label: "Archetype Sheet"
    });

}); 