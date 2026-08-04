# Of Gods and Men

*The gods compete. Mortals pay.*

A tabletop roleplaying game where mortals become the chosen champions of the gods, built as a system for [Foundry Virtual Tabletop](https://foundryvtt.com).

## Requirements

- Foundry Virtual Tabletop **v14** or later.
- Currently developed and tested against build 14.359.

## Installation

This system is not yet published to the official Foundry package repository. To install it manually:

1. Download or clone this repository.
2. Copy (or symlink) the project folder into your Foundry `Data/systems/` directory, so the final path looks like `Data/systems/of-gods-and-men/`.
3. Restart Foundry (or refresh the Setup screen) — "Of Gods and Men" should now appear as an installable system when creating a new world.

## Features

- **Two Actor types**: `Ascended` (player characters) and `NPC` (with a Tier system that sets a floor on attributes/skills).
- **Attribute & Skill system**: 5 Attributes and 9 Skills (0–5), displayed as clickable dot trackers.
- **Roll system**: `1d12 + Attribute + Skill`, with support for Advantage/Disadvantage, automatic Critical (12) / Fumble (1) detection, and a dedicated Attack Roll flow.
- **Combat**: Attack rolls let the attacker target a token; the target can respond with a themed chat card offering **Block** or **Dodge**, resolving success/failure and applying damage automatically.
- **Initiative**: deterministic, based on Reflexes (Endurance as an implicit tiebreak via automatic re-rolls between tied player characters; NPCs win ties against PCs).
- **Gods & Archetypes**: Item types with Blessings, Dogma, and Spells. Archetypes support priority-based skill assignment with a guided choice dialog on drag & drop.
- **Active Effects**: Blessings, Spells, and equippable Objects can grant a flexible bonus (None / Single Attribute or Skill / All Skills / All Attributes), toggled on and off from the character sheet.
- **Inventory**: equippable Objects with automatic stacking (dragging the same item multiple times increases its quantity instead of duplicating rows).
- **Play/Edit Mode**: Item sheets (God, Archetype, Object) default to a read-only "Play" view; only the GM can unlock "Edit" mode to change their contents.
- **Custom themed UI**: a parchment-and-ink visual identity applied consistently across character sheets, item sheets, roll dialogs, and chat cards.

## Project status

This is version **1.0**, playtested with a small group. 

Future versions will be focused the following:

- Bundled compendiums, not currently implemented due to the current state of **Of Gods and Men** manual not being completed.
- XP shop. Currently, you must spend your XP manually, future versions will include a xp shop.
- Bug fixes.
- Visual improvements.
- Implementation of Dice so Nice module.
- Overall gameplay improvements.

## License

Released under the [MIT License](./LICENSE).

## Credits

Created by **Pablo Morais Alvarez**.
