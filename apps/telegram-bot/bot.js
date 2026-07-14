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

  // Set the persistent menu button for this chat
  try {
    await bot.telegram.setChatMenuButton(ctx.chat.id, {
      type: "web_app",
      text: "Open BM-Booking",
      web_app: { url: WEBAPP_URL },
    });
  } catch (err) {
    console.warn("setChatMenuButton failed:", err.message);
  }

  await ctx.reply(
    `Hello, <b>${firstName}</b>!\n\nWelcome to <b>BM-Booking</b> — your trusted medical appointment companion.\n\nGet access to the <b>best doctors</b> and <b>top-tier medical equipment</b> — all at your fingertips.\n\n- Book appointments in seconds\n- Find specialists near you\n- Manage your health records\n- Fast & reliable service!\n\nTap the button below to open our Mini App.`,
    {
      parse_mode: "HTML",
      ...Markup.inlineKeyboard([
        [Markup.button.webApp("Open BM-Booking", WEBAPP_URL)],
      ]),
    }
  );
});

bot.command("open", async (ctx) => {
  try {
    await bot.telegram.setChatMenuButton(ctx.chat.id, {
      type: "web_app",
      text: "Open BM-Booking",
      web_app: { url: WEBAPP_URL },
    });
  } catch (err) {
    console.warn("setChatMenuButton failed:", err.message);
  }

  await ctx.reply(
    "Tap the button below to open BM-Booking Mini App:",
    Markup.inlineKeyboard([
      [Markup.button.webApp("Open BM-Booking", WEBAPP_URL)],
    ])
  );
});

bot.hears(/.*/, async (ctx) => {
  try {
    await bot.telegram.setChatMenuButton(ctx.chat.id, {
      type: "web_app",
      text: "Open BM-Booking",
      web_app: { url: WEBAPP_URL },
    });
  } catch (err) {
    console.warn("setChatMenuButton failed:", err.message);
  }

  await ctx.reply(
    "Tap the button below to get started with BM-Booking:",
    Markup.keyboard([
      [Markup.button.webApp("Open BM-Booking", WEBAPP_URL)],
    ]).resize().persistent()
  );
});

const setBotInfo = async () => {
  try {
    await bot.telegram.setMyDescription(
      "BM-Booking connects you with the best doctors and top-quality medical equipment. " +
      "Book appointments, find specialists, and manage your healthcare — all in one place."
    );
    await bot.telegram.setMyShortDescription(
      "Best doctors & equipment — book appointments instantly."
    );
    console.log("Bot info (description) updated successfully");
  } catch (err) {
    console.warn("Could not set bot description:", err.message);
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
