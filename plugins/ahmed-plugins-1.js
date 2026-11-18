// AHMED-MD merged plugin bundle. Bundle 1/4 | 33 original source files.

/* ================= ORIGINAL PLUGIN: Kick.js ================= */
(() => {
const { cmd } = require('../command');

cmd({
    pattern: "autodelete",
    desc: "Group mein status/message delete karne ke liye",
    category: "group",
    react: "🗑️",
    filename: __filename
}, async (conn, mek, m, { reply, isGroup, isAdmin, isBotAdmin }) => {

    if (!isGroup) return reply("Yeh command sirf group mein chalegi.");
    if (!isBotAdmin) return reply("Bot ko admin banayein.");

    // Yahan delete ka logic aayega
    // await conn.sendMessage(m.chat, { delete: m.key });

    return await reply("Auto-delete active ho gaya hai!");
});
})();

/* ================= ORIGINAL PLUGIN: Mee.js ================= */
(() => {
const { cmd } = require('../command');
const config = require('../config');
const converter = require('../lib/converter');
const path = require('path');
const axios = require('axios');

const voiceClips = [
    'https://files.catbox.moe/tuueyw.mp3',
    'https://files.catbox.moe/pw4yuu.mp3',
    'https://files.catbox.moe/q56rza.mp3',
    'https://files.catbox.moe/ldrebe.mp3',
    'https://files.catbox.moe/cpjqjd.mp3',
    'https://files.catbox.moe/v5c4fd.mp3',
    'https://files.catbox.moe/naub62.mp3',
    'https://files.catbox.moe/ez7wvh.mp3',
    'https://files.catbox.moe/3ruryr.mp3',
    'https://files.catbox.moe/hk2fjw.mp3',
    'https://files.catbox.moe/hk2fjw.mp3',
    'https://files.catbox.moe/pvymqf.mp3',
    'https://files.catbox.moe/md2jm5.mp3',
    'https://files.catbox.moe/ypx92a.mp3',
    'https://files.catbox.moe/7tv2do.mp3',
    'https://files.catbox.moe/sr8k3y.mp3'
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAudioBuffer(url) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error fetching audio:', error);
        throw error;
    }
}

cmd({
    on: "body"
}, async (conn, m, store, { isGroup, botNumber2, userConfig }) => {
    try {
        const mek = m.mek || m;
        if (mek.key?.fromMe) return;

        const MENTION_REPLY = userConfig?.MENTION_REPLY || config.MENTION_REPLY || 'false';

        if (MENTION_REPLY !== 'true' || !isGroup || !botNumber2) return;

        const mentioned = m.mentionedJid || [];
        if (!mentioned.includes(botNumber2)) return;

        const chatId = m.chat;

        await conn.sendPresenceUpdate('recording', chatId);

        const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];
        const audioBuffer = await fetchAudioBuffer(randomClip);

        await delay(3000);

        let pttAudio;
        if (typeof converter.toPTT === 'function') {
            pttAudio = await converter.toPTT(audioBuffer, 'mp3');
        } else if (typeof converter === 'function') {
            pttAudio = await converter(audioBuffer, 'mp3');
        } else {
            pttAudio = audioBuffer;
        }

        await conn.sendMessage(chatId, {
            audio: pttAudio,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: m });

    } catch (e) {
        console.error('Error in mention reply:', e);
    }
});

cmd({
    pattern: "mee",
    alias: ["me"],
    desc: "Send a random voice message",
    category: "other",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply, userConfig }) => {
    try {
        const chatId = from;

        await conn.sendPresenceUpdate('recording', chatId);

        const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];
        const audioBuffer = await fetchAudioBuffer(randomClip);

        await delay(3000);

        let pttAudio;
        if (typeof converter.toPTT === 'function') {
            pttAudio = await converter.toPTT(audioBuffer, 'mp3');
        } else if (typeof converter === 'function') {
            pttAudio = await converter(audioBuffer, 'mp3');
        } else {
            pttAudio = audioBuffer;
        }

        await conn.sendMessage(chatId, {
            audio: pttAudio,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true
        }, { quoted: mek });

    } catch (e) {
        console.error('Error in mention command:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
})();

/* ================= ORIGINAL PLUGIN: P.js ================= */
(() => {
const { cmd } = require('../command');
const axios = require('axios');

const apiKey = process.env.GIPHY_API_KEY || '';

cmd({
    pattern: "dance",
    alias: ["dancegif"],
    desc: "Get random dance GIFs",
    category: "fun",
    react: "💃",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!apiKey) return reply("GIPHY_API_KEY is missing. Add it to your .env file.");
        let apiUrl = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=dance&limit=50`;
        let response = await axios.get(apiUrl);
        let data = response.data;

        if (!data || !data.data || data.data.length === 0) {
            return reply("❌ Error: GIF nahi mili!");
        }

        let randomIndex = Math.floor(Math.random() * data.data.length);
        let gifUrl = data.data[randomIndex].images.original.url;

        let caption = `💃 *DANCE GIF* 💃\n\n🤖 *Bot:* AHMED-MD\n👑 *Owner:* AHMED`;

        return await conn.sendMessage(from, { video: { url: gifUrl }, gifPlayback: true, caption: caption }, { quoted: mek });

    } catch (e) {
        console.error('Error in dance command:', e);
        return reply(`❌ Error: ${e.message}`);
    }
});

cmd({
    pattern: "gif",
    alias: ["giphy", "randomgif"],
    desc: "Get random trending GIFs",
    category: "fun",
    react: "🎬",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        if (!apiKey) return reply("GIPHY_API_KEY is missing. Add it to your .env file.");
        let apiUrl = `https://api.giphy.com/v1/gifs/trending?api_key=${apiKey}&limit=50`;
        let response = await axios.get(apiUrl);
        let data = response.data;

        if (!data || !data.data || data.data.length === 0) {
            return reply("❌ Error: GIF nahi mili!");
        }

        let randomIndex = Math.floor(Math.random() * data.data.length);
        let gifUrl = data.data[randomIndex].images.original.url;

        let caption = `🎬 *RANDOM GIPHY* 🎬\n\n🤖 *Bot:* AHMED-MD\n👑 *Owner:* AHMED`;

        return await conn.sendMessage(from, { video: { url: gifUrl }, gifPlayback: true, caption: caption }, { quoted: mek });

    } catch (e) {
        console.error('Error in gif command:', e);
        return reply(`❌ Error: ${e.message}`);
    }
});
})();

/* ================= ORIGINAL PLUGIN: ai-chat.js ================= */
(() => {
const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "deepseek",
    desc: "Chat with Think-Deeper AI model",
    category: "ai",
    react: "🤔",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a message for the Think AI.");

        const apiUrl = `https://api.xyro.site/ai/copilot?text=${encodeURIComponent(q)}&model=think-deeper`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.status || !data.data || !data.data.text) {
            await react("❌");
            return reply("Think AI failed to respond. Please try again later.");
        }

        await reply(`${data.data.text}`);
    } catch (e) {
        console.error("Error in Think AI command:", e);
        await react("❌");
        reply("An error occurred while communicating with the Think AI.");
    }
});

cmd({
    pattern: "gpt5",
    desc: "Chat with GPT-5 AI model",
    category: "ai",
    react: "🚀",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a message for GPT-5.");

        const apiUrl = `https://api.xyro.site/ai/copilot?text=${encodeURIComponent(q)}&model=gpt-5`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.status || !data.data || !data.data.text) {
            await react("❌");
            return reply("GPT-5 failed to respond. Please try again later.");
        }

        await reply(`${data.data.text}`);
    } catch (e) {
        console.error("Error in GPT-5 command:", e);
        await react("❌");
        reply("An error occurred while communicating with GPT-5.");
    }
});

cmd({
    pattern: "copilot",
    desc: "Chat with Copilot AI model",
    category: "ai",
    react: "👨‍💻",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a message for Copilot AI.");

        const apiUrl = `https://api.xyro.site/ai/copilot?text=${encodeURIComponent(q)}&model=default`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.status || !data.data || !data.data.text) {
            await react("❌");
            return reply("Copilot AI failed to respond. Please try again later.");
        }

        await reply(`${data.data.text}`);
    } catch (e) {
        console.error("Error in Copilot AI command:", e);
        await react("❌");
        reply("An error occurred while communicating with Copilot AI.");
    }
});

cmd({
    pattern: "ai",
    desc: "Chat with ChatGPT-4o",
    category: "ai",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a message for ChatGPT.");

        const apiUrl = `https://api.hanggts.xyz/ai/chatgpt4o?text=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.status || !data.result || !data.result.data) {
            await react("❌");
            return reply("ChatGPT failed to respond. Please try again later.");
        }

        await reply(`${data.result.data}`);
    } catch (e) {
        console.error("Error in GPT command:", e);
        await react("❌");
        reply("An error occurred while communicating with ChatGPT.");
    }
});

cmd({
    pattern: "codeai",
    desc: "Get AI assistance for coding questions",
    category: "ai",
    react: "💻",
    filename: __filename
},
async (conn, mek, m, { from, args, q, reply, react }) => {
    try {
        if (!q) return reply("Please provide a coding question or topic.");

        const codingPrompt = `You are a coding assistant. Only respond to programming questions: ${q}`;

        const apiUrl = `https://api.hanggts.xyz/ai/chatgpt4o?text=${encodeURIComponent(codingPrompt)}`;
        const { data } = await axios.get(apiUrl);

        if (!data || !data.status || !data.result || !data.result.data) {
            await react("❌");
            return reply("Code AI failed to respond. Please try again later.");
        }

        await reply(`${data.result.data}`);
    } catch (e) {
        console.error("Error in Code AI command:", e);
        await react("❌");
        reply("An error occurred while communicating with Code AI.");
    }
});
})();
