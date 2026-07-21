import AscendedData from "./data/actor-ascended.mjs";
import GodData from "./data/item-god.mjs";
import ArchetypeData from "./data/item-archetype.mjs";
import AscendedSheet from "./sheets/ascended-sheet.mjs";

Hooks.once("init", () => {
    console.log("Of Gods and Men | Initializing System");

    CONFIG.Actor.dataModels.ascended = AscendedData;
    CONFIG.Item.dataModels.god = GodData;
    CONFIG.Item.dataModels.archetype = ArchetypeData;

    const {Actors} = foundry.documents.collections;

    Actors.registerSheet("of-gods-and-men", AscendedSheet, {
        types: ["ascended"],
        makeDefault: true,
        label: "Ascended Sheet"
    });

}); 