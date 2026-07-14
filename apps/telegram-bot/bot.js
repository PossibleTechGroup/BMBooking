const { Telegraf } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || "https://bmbookingtelegrambot.possibletechplc.com";

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN is required");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  await ctx.reply(
    "Welcome to BM-Booking 👋\n\nBook appointments with doctors, hospitals, and medical services easily.",
    {
      reply_markup: {
        keyboard: [
          [
            {
              text: "🚀 Open BM-Booking",
              web_app: {
                url: WEBAPP_URL,
              },
            },
          ],
        ],
        resize_keyboard: true,
        is_persistent: true,
      },
    }
  );
});

bot.command("open", async (ctx) => {
  await ctx.reply("Tap the button below to open BM-Booking:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Open BM-Booking",
            web_app: {
              url: WEBAPP_URL,
            },
          },
        ],
      ],
    },
  });
});

bot.hears(/.*/, async (ctx) => {
  await ctx.reply("Tap the button below to open BM-Booking:", {
    reply_markup: {
      keyboard: [
        [
          {
            text: "🚀 Open BM-Booking",
            web_app: {
              url: WEBAPP_URL,
            },
          },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    },
  });
});

console.log(`Starting BM-Booking bot...`);
console.log(`WebApp URL: ${WEBAPP_URL}`);

bot.launch();
console.log("Bot is running!");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
