import AscendedData from "./data/actor-ascended.mjs";
import GodData from "./data/item-god.mjs";

Hooks.once("init", () => {
    console.log("Of Gods and Men | Initializing System");

    CONFIG.Actor.dataModels.ascended = AscendedData;
    CONFIG.Item.dataModels.god = GodData
}); 