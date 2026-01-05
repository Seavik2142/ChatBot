const { Client, GatewayIntentBits, Events } = require("discord.js");
require("dotenv").config();

// ============ CONFIG ============
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const CHANNEL_ID = process.env.CHANNEL_ID;

// ប្រើម៉ូដែល Llama 3 (ខ្លាំង និងលឿនបំផុត)
const MODEL_NAME = "llama-3.3-70b-versatile";
const API_URL = "https://api.groq.com/openai/v1/chat/completions";
// ================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`🤖 Bot is ready! Logged in as ${c.user.tag}`);
  console.log(`🚀 Using Groq AI: ${MODEL_NAME}`);
});

async function queryGroq(prompt) {
  try {
    const response = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
            // System prompt កំណត់អត្តចរិតឱ្យ Bot
            { role: "system", content: "You are a helpful AI assistant on Discord." },
            { role: "user", content: prompt }
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`🔥 Groq API Error: ${response.status} - ${errorText}`);
        return { error: `API Error ${response.status}` };
    }
    
    const result = await response.json();
    return result; // Groq return ជា format ដូច OpenAI
  } catch (error) {
    console.error("Fetch Error:", error);
    return { error: "Connection Failed" };
  }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;
  if (!message.content.trim()) return;

  try {
    await message.channel.sendTyping();

    const result = await queryGroq(message.content);

    if (result.error) {
       return message.reply(`⚠️ ${result.error}`);
    }

    // ទាញយកចម្លើយពី Groq Structure
    let reply = result.choices?.[0]?.message?.content;

    if (!reply) {
      return message.reply("🤖 Empty response.");
    }

    if (reply.length > 2000) {
      reply = reply.substring(0, 1990) + "...(truncated)";
    }

    message.reply(reply);
  } catch (err) {
    console.error("Bot Error:", err);
    message.reply("❌ Internal Error");
  }
});

client.login(process.env.BOT_TOKEN);