const config = require('../config');
const { cmd } = require('../command');

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

cmd({
    pattern: "ping",
    alias: ["speed", "pong"],
    use: '.ping',
    desc: "Check bot's response time.",
    category: "main",
    react: "⚡",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const start = Date.now();

        await conn.sendMessage(from, {
            react: { text: '⚡', key: mek.key }
        });

        // ─── FULL SPEED BAR LOADING ───
        const sent = await conn.sendMessage(from, { text: `Ping!\n[▱▱▱▱▱▱▱▱▱▱] 0%` }, { quoted: mek });
        const key = sent.key;

        const frames = [
            `Ping!\n[▰▰▱▱▱▱▱▱▱▱] 20%`,
            `Ping!\n[▰▰▰▰▱▱▱▱▱▱] 40%`,
            `Ping!\n[▰▰▰▰▰▰▱▱▱▱] 60%`,
            `Ping!\n[▰▰▰▰▰▰▰▰▱▱] 80%`,
            `Pong!\n[▰▰▰▰▰▰▰▰▰▰] 100%`
        ];

        for (const f of frames) {
            await conn.sendMessage(from, { text: f, edit: key });
            await sleep(120);
        }

        const ping = Date.now() - start;

        // ─── LEVANTER FINAL ───
        const text = `- 𝐀𝐇𝐌𝐄𝐃-𝐌𝐃 -\nPong! Response time: ${ping} ms`;

        await conn.sendMessage(from, {
            text,
            edit: key,
            contextInfo: {
                mentionedJid: [sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363429311414073@newsletter',
                    newsletterName: "AHMED-MD",
                    serverMessageId: 143
                }
            }
        });

    } catch (e) {
        reply(`An error occurred: ${e.message}`);
    }
});
