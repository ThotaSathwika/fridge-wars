# 🍳 Fridge Wars

**Say what's in your fridge. Three rival AI chefs battle to cook the best dish. A critic crowns the winner, and you get a recipe card.**

Fridge Wars is a personal, playful cooking workflow built on [Switch](https://github.com/sandbox-quantum/switch). Four AI agents live in a Telegram group. You talk to them from your phone, usually by voice with Wispr Flow. They work together in front of you: the critic hosts, the chefs compete and trash-talk each other, and a live scoreboard website updates as each battle ends.

> Submitted to the Switch hackathon, **Best Personal or Creative Workflow** track.
>
> 🔴 **Live scoreboard:** https://thotasathwika.github.io/fridge-wars/ · 📝 **Blog post:** https://thotasathwika.github.io/fridge-wars/docs/blog-post.html

---

## How a battle works

```
You (Telegram, by voice)        "In my fridge: eggs, leftover rice, half an onion, cheese, tomato, chili sauce"
        │
        ▼
fridge-critic ── announces "🔥 Battle #1" and sends one targeted message to all three chefs
        │
        ├──► chef-nonna   🇮🇹 comfort food   ─┐
        ├──► chef-blaze   🔥 street food     ├─ each pitches a dish: name, steps, time, trash talk
        └──► chef-zen     🍃 fine dining     ─┘
        │
        ▼
fridge-critic ── scores taste / creativity / ease, names a winner, posts the recipe card,
                 and saves the battle to data/battles.json
        │
        ▼
Scoreboard website (site/) ── checks the file every 4 seconds: new champion, confetti, printable recipe card
```

Then keep playing: *"Rematch, but make it vegan."* · *"Dessert only, under 10 minutes."* · *"Show me the leaderboard."*

The `data/battles.json` in this repository holds three real battles from our demo run: Blaze won the first round, Nonna the vegan rematch and Zen the dessert sprint.

---

## How Switch is used

Switch is what turns four separate Claude Code processes into a cast that performs together in one chat:

| What | How Switch does it |
|---|---|
| **Agents in a chat app** | Each agent is a Claude Code agent managed by Switch Console on my Mac. Switch carries them into Telegram through one bot, and each message is labelled with the agent's name. |
| **Agent-to-agent coordination** | The critic hands work to the chefs with Switch **targeted messages**: one message addressed to all three. The chefs reply in the group, and the critic reads their pitches from the room's history. No custom orchestration code. |
| **Addressing by name** | I talk to an agent by mentioning its name in Telegram (for example `@fridge-critic`). Switch routes the message to the right agent. |
| **Who may talk to them** | Every agent is set to answer only its owner and the owner's own agents. My Telegram account is linked to my Switch user, so the agents recognise me and nobody else. |
| **Shared workspace** | All four agents run in this one folder. `FRIDGE_WARS.md` is the shared contract they read; only the critic writes `data/battles.json`. |
| **Building the website** | A fifth agent, `code-helper` (also Claude Code, run by Switch), was briefed in the same Telegram group and built `site/`. |

### The agents

| Agent | Role | Instructions |
|---|---|---|
| `fridge-critic` | Host and judge. Runs each battle, scores the dishes, writes the results | [agents/fridge-critic.md](agents/fridge-critic.md) |
| `chef-nonna` | Warm, bossy Italian grandmother. Comfort food | [agents/chef-nonna.md](agents/chef-nonna.md) |
| `chef-blaze` | Loud street-food rebel. Spicy fusion | [agents/chef-blaze.md](agents/chef-blaze.md) |
| `chef-zen` | Calm minimalist. Poetic fine dining | [agents/chef-zen.md](agents/chef-zen.md) |

All four use **Claude Code**, run on my MacBook through **Switch Console**, and work in this repository's folder.

---

## How the channel is set up (Telegram)

1. **Create a Telegram bot.** In Telegram, open BotFather, send `/newbot`, and keep the token somewhere safe.
2. **Turn Group Privacy off.** In BotFather: `/mybots` → your bot → Bot Settings → Group Privacy → Turn off. Do this *before* adding the bot to any group, so the agents can see the whole conversation and not only the messages that mention them.
3. **Connect the bot to Switch.** In Switch Console, use *Connect a messaging app* → *Telegram*, then paste the bot's token and username.
4. **Create the group.** Make a Telegram group called **Fridge Wars**, add the bot as a member, and send a first message. Switch picks the group up and creates a matching room.
5. **Link your Telegram account.** On the server's home page in Switch Console, use *Link my account…* on the Telegram connection, so the agents recognise you as their owner.
6. **Invite the agents.** In the group, send `/invite_agent @fridge-critic`, and do the same for `@chef-nonna`, `@chef-blaze` and `@chef-zen`. (Or add them to the room from Switch.)

One bot fronts every agent, so there's nothing to set up per agent on the Telegram side.

---

## How to run it

**You need:** [Switch Console](https://github.com/sandbox-quantum/switch) with a Switch server, Claude Code installed and signed in on the same computer, Telegram, Python 3 (for the local web server), and optionally Wispr Flow for voice input.

1. **Clone this repository.**
   ```sh
   git clone <this repo> fridge-wars && cd fridge-wars
   ```
2. **Create the four agents** in Switch Console (or ask your Switch buddy agent to do it). For each one:
   - **Name:** `fridge-critic`, `chef-nonna`, `chef-blaze`, `chef-zen`
   - **Provider:** Claude Code
   - **Working directory:** the `fridge-wars` folder you cloned
   - **Instructions:** paste the matching file from [`agents/`](agents/)
   - Optionally turn on *bypass permissions*, so the critic can save results without waiting for approval. Only do this if you're comfortable with it.
3. **Set up the Telegram channel** as described above, and invite the four agents into the group.
4. **Start the scoreboard:**
   ```sh
   ./run.sh
   ```
   Then open <http://localhost:8766/site/>. To start from an empty kitchen, reset the data first:
   ```sh
   printf '{\n  "title": "Fridge Wars",\n  "battles": []\n}\n' > data/battles.json
   ```
5. **Play.** In the Telegram group:
   > @fridge-critic let's battle! In my fridge I have eggs, leftover rice, half an onion, some cheese, a tomato and chili sauce.

Keep Switch Console open while you play: the agents run on your computer.

---

## The scoreboard website

Plain HTML, CSS and JavaScript (`site/`), with no build step:

- a TV-show title card, and a leaderboard of wins per chef, each chef with its own colours;
- the latest battle: ingredient tags, three chef cards with score bars, a crown on the winner, and the critic's verdict;
- a **printable recipe card** for the winning dish (*Print / Save as PDF*);
- earlier battles you can click open;
- **live updates**: it checks `data/battles.json` every 4 seconds and celebrates a new champion with confetti.

Fonts load from Google Fonts, so it looks best with an internet connection.

## Files

```
agents/           the four agents' instructions
data/battles.json every battle, written by fridge-critic (the format is in FRIDGE_WARS.md)
site/             the scoreboard website
FRIDGE_WARS.md    the shared contract every agent reads
run.sh            serves the site on port 8766
docs/             the blog post and the demo script
```

## Built with

[Switch](https://github.com/sandbox-quantum/switch) · Claude Code · Telegram · Wispr Flow

## License

MIT
