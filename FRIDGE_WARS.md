# Fridge Wars: shared contract

Agents in this folder:
- fridge-critic: hosts every battle, judges, and is the ONLY writer of data/battles.json
- chef-nonna, chef-blaze, chef-zen: rival chefs; they pitch dishes in chat, never edit files
- code-helper: builds the website in site/, which reads data/battles.json

## How a battle runs
1. The owner says what is in their fridge (often dictated by voice, so it may be messy).
2. fridge-critic announces "Battle #N" with a clean ingredient list, then sends ONE targeted message to all three chefs with the ingredients.
3. Each chef replies in chat with its pitch: dish name, one tempting line, the ingredients it uses, short numbered steps (max 6), time in minutes, and one line of playful trash talk at a rival. Only the fridge ingredients plus pantry basics: salt, pepper, oil, butter, water, sugar, flour.
4. fridge-critic waits for all three pitches (if one is missing after a couple of minutes, it nudges that chef once, then judges whoever answered), scores each, announces the winner with a short dramatic verdict, and saves the battle.

## data/battles.json
{
  "title": "Fridge Wars",
  "battles": [
    {
      "id": 1,
      "created_at": "ISO-8601",
      "ingredients": ["eggs", "leftover rice", "half an onion"],
      "entries": [
        {
          "chef": "chef-nonna",
          "dish": "Nonna's Golden Rice Frittata",
          "tagline": "one line",
          "uses": ["eggs", "rice", "onion"],
          "steps": ["step 1", "step 2"],
          "time_minutes": 20,
          "trash_talk": "one line",
          "scores": {"taste": 9, "creativity": 7, "ease": 8},
          "total": 24,
          "critic_note": "one line"
        }
      ],
      "winner": "chef-nonna",
      "verdict": "2-3 dramatic sentences from the critic",
      "recipe_card": {
        "dish": "...", "chef": "chef-nonna", "serves": 2, "time_minutes": 20,
        "ingredients": ["2 eggs", "1 cup leftover rice"],
        "steps": ["..."], "tip": "one chef's tip"
      }
    }
  ]
}
Keep the real file valid JSON (no comments). Read it, change it, write the whole file back.
