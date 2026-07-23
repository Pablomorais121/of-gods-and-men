import AscendedData from "./data/actor-ascended.mjs";
import GodData from "./data/item-god.mjs";
import ArchetypeData from "./data/item-archetype.mjs";
import NPCData from "./data/actor-npc.mjs";


import AscendedSheet from "./sheets/ascended-sheet.mjs";
import GodSheet from "./sheets/god-sheet.mjs";
import ArchetypeSheet from "./sheets/archetype-sheet.mjs";
import NPCSheet from "./sheets/npc-sheet.mjs";

Hooks.once("init", () => {
    console.log("Of Gods and Men | Initializing System");

    CONFIG.Actor.dataModels.ascended = AscendedData;
    CONFIG.Actor.dataModels.npc = NPCData;

    CONFIG.Item.dataModels.god = GodData;
    CONFIG.Item.dataModels.archetype = ArchetypeData;
    

    const {Actors, Items} = foundry.documents.collections;

    Handlebars.registerHelper("includes", (arr, value) => arr.includes(value));
    Handlebars.registerHelper ("add", (a, b) => a + b);

    Actors.registerSheet("of-gods-and-men", AscendedSheet, {
        types: ["ascended"],
        makeDefault: true,
        label: "Ascended Sheet"
    });

    Actors.registerSheet("of-gods-and-men", NPCSheet, {
        types: ["npc"],
        makeDefault: true,
        label: "NPC Sheet"
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

Hooks.on("preUpdateActor", (actor, changes, options, userID) => {
    if (actor.type !== "npc") return;

    const oldTier = actor.system.tier;
    const newTier = changes.system?.tier;
    if (newTier !== undefined && newTier !== oldTier){

        const attrs = foundry.utils.mergeObject(actor.system.attributes, changes.system?.attributes ?? {}, {inplace: false});
        const skills = foundry.utils.mergeObject(actor.system.skills, changes.system?.skills ?? {}, {inplace: false});

        changes.system.attributes ??= {};
        changes.system.skills ??= {};

        for(const key of Object.keys(attrs)) {
            if (attrs[key] !== newTier) changes.system.attributes[key] = newTier;
        }

        for(const key of Object.keys(skills)) {
            if (skills[key] !== newTier) changes.system.skills[key] = newTier;
        }
    } 

    const finalAttrs = changes.system.attributes;
    const healthMax = 1 + finalAttrs.strength + finalAttrs.resistance;
    const staminaMax = 1 + finalAttrs.resistance + finalAttrs.reflexes;
    const sanityMax = 1 + finalAttrs.mind + finalAttrs.personality;

    changes.system.resources ??= {};
    changes.system.resources.health = { value: healthMax };
    changes.system.resources.stamina = { value: staminaMax };
    changes.system.resources.sanity = { value: sanityMax };

    return;
});