const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");

const P = require("pino");
const runAgent = require("./agents/gemini-agent");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
  });

  sock.ev.on("creds.update", saveCreds);

  // Connection Status
  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ WhatsApp Connected!");
      console.log(
        "Logged in as:",
        sock.user?.name || sock.user?.id
      );
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      console.log("❌ Connection Closed");

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        startBot();
      }
    }
  });

  // AI Agent Auto Reply
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages[0];

      if (!msg.message) return;

      // Ignore messages sent by yourself
      if (msg.key.fromMe) return;

      const sender = msg.key.remoteJid;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text;

      if (!text) return;

      console.log(`📩 Message from ${sender}`);
      console.log(`💬 ${text}`);

      const aiReply = await runAgent(text);

      await sock.sendMessage(sender, {
        text: aiReply,
      });

      console.log("✅ Replied:", aiReply);
    } catch (error) {
      console.error("❌ Auto Reply Error:", error);
    }
  });
}

startBot();