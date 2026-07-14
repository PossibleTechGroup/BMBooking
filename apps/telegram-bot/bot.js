const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://bmbookingtelegrambot.possibletechplc.com";

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is required");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  const firstName = ctx.from?.first_name || "there";

  await ctx.reply(
    `Hello, <b>${firstName}</b>!

Welcome to <b>BM-Booking</b> — your trusted medical appointment companion.

Get access to the <b>best doctors</b> and <b>top-tier medical equipment</b> — all at your fingertips.

- Book appointments in seconds
- Find specialists near you
- Manage your health records
- Fast & reliable service — <b>you've got it right</b>!

Tap the button below to open our Mini App.`,
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        Markup.button.webApp("Open BM-Booking Mini App", WEBAPP_URL),
      ]),
    }
  );
});

bot.command("open", async (ctx) => {
  await ctx.reply(
    "Tap the button below to open BM-Booking Mini App:",
    Markup.inlineKeyboard([
      Markup.button.webApp("Open BM-Booking", WEBAPP_URL),
    ])
  );
});

bot.hears(/.*/, async (ctx) => {
  await ctx.reply(
    "Tap the button below to get started with BM-Booking:",
    Markup.keyboard([
      Markup.button.webApp("Open BM-Booking", WEBAPP_URL),
    ]).resize().persistent()
  );
});

const setBotInfo = async () => {
  try {
    await bot.telegram.setMyDescription(
      "BM-Booking connects you with the best doctors and top-quality medical equipment. " +
      "Book appointments, find specialists, and manage your healthcare — all in one place. " +
      "You've got it right!"
    );
    await bot.telegram.setMyShortDescription(
      "Best doctors & equipment — book appointments instantly."
    );
    console.log("Bot info (description) updated successfully");
  } catch (err) {
    console.warn("Could not set bot description (may need bot token permissions):", err.message);
  }
};

console.log(`Starting BM-Booking bot...`);
console.log(`WebApp URL: ${WEBAPP_URL}`);

setBotInfo().then(() => {
  bot.launch();
  console.log("Bot is running!");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
