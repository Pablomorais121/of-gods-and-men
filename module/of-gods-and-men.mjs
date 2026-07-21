import AscendedData from "./data/actor-ascended.mjs";

Hooks.once("init", () => {
    console.log("Of Gods and Men | Initializing System");

    CONFIG.Actor.dataModels.ascended = AscendedData;
}); 