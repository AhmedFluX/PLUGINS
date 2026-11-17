
const { cmd } = require('../command');

cmd({
    pattern: "alexa",
    desc: "Search and play songs",
    category: "download",
    react: "🎧",
    filename: __filename,
    use: ".alexa song name"
}, async (conn, mek, m, { reply }) => {

    try {
        const query = (m.text || m.body || "")
            .trim()
            .split(/\s+/)
            .slice(1)
            .join(" ");

        if (!query) {
            return reply("🎵 Please provide a song name!\n\nExample: .alexa On My Love");
        }

        await reply("🔎 Searching your song...");

        const fetch = (await import('node-fetch')).default;

        const apiUrl =
            `https://api.sayan-nexuswork.workers.dev/music?query=${encodeURIComponent(query)}`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || data.status !== "success" || !data.url) {
            return reply("❌ Song not found! Please try another song.");
        }

        const title = data.title || query;
        const duration = data.duration || "Unknown";
        const viewers = data.viewers || "Unknown";
        const type = data.type || "Audio";
        const creator = data.creator || "AHMED-MD";

        const caption = `
┏━━━━━━━━━━━━━━━━━━┓
       🎧 *ALEXA MUSIC*
┗━━━━━━━━━━━━━━━━━━┛

🎵 *Title:* ${title}
⏱️ *Duration:* ${duration}
👁️ *Views:* ${viewers}
🎼 *Type:* ${type}
👑 *Creator:* ${creator}

━━━━━━━━━━━━━━━━━━
       *POWERED BY AHMED-MD*
`;

        // Send thumbnail and song details first
        if (data.thumbnail) {
            try {
                await conn.sendMessage(m.chat, {
                    image: { url: data.thumbnail },
                    caption: caption
                }, { quoted: mek });
            } catch (e) {
                await conn.sendMessage(m.chat, {
                    text: caption
                }, { quoted: mek });
            }
        } else {
            await conn.sendMessage(m.chat, {
                text: caption
            }, { quoted: mek });
        }

        // Download complete audio
        const audioResponse = await fetch(data.url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
                "Referer": "https://youtube.com/"
            }
        });

        if (!audioResponse.ok) {
            return reply("❌ Unable to download audio!");
        }

        const audioBuffer = await audioResponse.buffer();

        // Send full MP3
        await conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            fileName: `${title}-AHMED-MD.mp3`,
            ptt: false
        }, { quoted: mek });

    } catch (error) {
        console.error("ALEXA PLUGIN ERROR:", error);
        return reply("❌ Something went wrong while playing your song.");
    }
});
