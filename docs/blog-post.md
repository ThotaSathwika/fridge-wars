# I let three AI chefs fight over my leftovers (and a fourth one judge them)

*How I built Fridge Wars, a voice-driven cooking battle in Telegram, in one evening with Switch.*

It's late, and there's leftover rice, half an onion, a lonely tomato, some cheese, two eggs and a bottle of chili sauce in my fridge. Normally I'd make the same fried rice I always make. Tonight I asked three AI chefs to fight about it instead.

## The idea

**Fridge Wars** is a cooking show that lives in a Telegram group. I tell it what's in my fridge, usually by voice with Wispr Flow, and:

- **The Critic** announces the battle and challenges the chefs.
- **Chef Nonna** 🇮🇹, a bossy Italian grandmother, pitches comfort food. *"A little more cheese never hurt anybody."*
- **Chef Blaze** 🔥, a street-food rebel, pitches something loud and spicy.
- **Chef Zen** 🍃, a calm minimalist, pitches fine dining with a poetic name, and trash talk delivered like a haiku.
- The Critic scores every dish for taste, creativity and ease, crowns a winner, and posts a recipe card I can actually cook.
- A scoreboard website on my laptop updates live, with confetti for each new champion.

It's silly, and that's the point. But it also solves a real, very personal problem: *what do I cook with this?* Three genuinely different answers, plus an honest judgement of which one is easiest tonight, beat scrolling through recipe sites.

## Why Switch

The hard part of a multi-agent project is usually the plumbing: how the agents find each other, how messages get routed, how a human joins in from their phone. [Switch](https://github.com/sandbox-quantum/switch) handles that plumbing for me.

- **Each agent is just a Claude Code agent** that Switch Console runs on my Mac. I gave each one a personality and a role in plain-English instructions. That's the whole "codebase" for the agents.
- **Switch carries them into Telegram** through one bot. Each agent posts under its own name, and I talk to any of them by mentioning it.
- **Agents talk to each other with targeted messages.** The Critic sends one message addressed to all three chefs, they answer in the group, and the Critic reads their pitches and judges. I wrote no orchestration code.
- **They share a folder.** A short contract file (`FRIDGE_WARS.md`) describes the battle format and the results file. Only the Critic writes `battles.json`, and the website reads it.
- **Only I can drive them.** The agents answer their owner, and Switch knows which Telegram account is mine.

Even the website was built through Switch: I briefed a fifth agent, `code-helper`, in the same Telegram group, and it built the scoreboard, tested it at laptop and phone sizes, and posted the link back.

## Setting it up

1. Create a Telegram bot with BotFather, and turn **Group Privacy off** *before* adding it to any group, so the agents can see the whole conversation.
2. Connect the bot in Switch Console, create a "Fridge Wars" group, add the bot, and send a first message. Switch turns the group into a room.
3. Link my Telegram account to Switch, so the agents recognise me.
4. Create the four agents (Claude Code, same working folder, one instruction file each) and invite them into the group.

## The first three battles

**Battle #1, full fridge.** Nonna made cheese-stuffed rice cakes on tomato sugo. Blaze made *Volcano Crispy Rice Tostadas* with a runny egg and chili-tomato salsa. Zen made *Ember Over Still Water*, a crisp rice disc with a trembling yolk and three drops of chili butter. **Blaze won, 25/30**: *"a crunch I could hear from the judges' table."*

**Battle #2, the vegan rematch.** No eggs, no cheese, no butter. Nonna pressed tomato-glazed rice into one pan and left it alone until it formed a crackling crust, a *tiella*. **Nonna won**: *"The throne lasted exactly one round."*

**Battle #3, dessert only, under 10 minutes,** from a fridge full of savoury things. Two chefs brought fritters. Zen brought *First Snow on an Ember*: a warm sabayon with shards of caramelised rice glass and a thread of tomato-chili syrup. **Zen won**: *"The quiet one finally spoke, and the whole kitchen heard it."*

Three battles, three different winners, and a single point between first and last on the leaderboard. I didn't script any of that.

## What I learned

- **Personality is a feature.** Giving each agent a distinct voice and a rival made the output far more varied, and far more fun to read, than asking one model for "three recipes".
- **Constraints make it creative.** "Only what's in the fridge plus pantry basics" and twists like "vegan" or "under 10 minutes" pushed the chefs into genuinely clever ideas, like tomato syrup in a dessert.
- **One shared file beats a lot of glue code.** A clear contract that one agent writes and everyone else reads was all the coordination the website needed.
- **Voice changes how you use it.** Dictating "eggs, rice, half an onion…" while standing at the open fridge is the natural way to use this. Typing would kill it.

## What I'd add next

A photo round, where you snap the fridge instead of listing it; a "cook-along" mode, where the winning chef walks you through the steps live in the chat; and letting friends in the group vote against the Critic.

## Try it

The code, the agents' instructions and the setup steps are all in the repository. Clone it, create four agents, add a Telegram bot, and tell the Critic what's in your fridge.

*Built with Switch, Claude Code, Telegram and Wispr Flow.*
