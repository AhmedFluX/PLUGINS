const { cmd } = require('../command');
const axios = require('axios');
const yts = require('yt-search');

cmd({
    pattern: "play",
    alias: ["song", "ytmp3", "music"],
    desc: "YouTube se song download karke bhejta hai",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, mek, m, { from, reply, text }) => {
    try {
        const footer = "\n\n© POWERED BY AHMED-MD";

        if (!text) return await reply("*🍁 Usage:* `.play <song name / youtube link>`\n\nExample: `.play Pasoori`" + footer);

        let videoUrl = text.trim();

        // 1. Agar user ne naam diya hai to YouTube pe search karo
        if (!videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be")) {
            const search = await yts(videoUrl);
            if (!search.videos || search.videos.length === 0) {
                return await reply("❌ Song nahi mila, dobara try karo." + footer);
            }
            videoUrl = search.videos[0].url;
        }

        await reply("⏳ *Downloading song... thora wait karo*" + footer);

        // 2. API Call
        const apiUrl = `https://jawadtechyt.vercel.app/ytmp3?url=${encodeURIComponent(videoUrl)}&key=EXTRA`;
        const { data } = await axios.get(apiUrl);

        // API ka response alag alag format me aa sakta hai, sab handle kar liya
        const result = data.result || data.data || data;
        const downloadUrl = result.download_url || result.download || result.url || result.link || result.audio;
        const title = result.title || result.name || "AHMED-MD Song";
        const thumbnail = result.thumbnail || result.thumb || result.image;

        if (!downloadUrl) {
            return await reply("❌ Download link nahi mila, API down hai. Dobara try karo." + footer);
        }

        // 3. Song bhejo
        await conn.sendMessage(from, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: "© POWERED BY AHMED-MD",
                    thumbnailUrl: thumbnail,
                    mediaType: 2,
                    mediaUrl: videoUrl,
                    sourceUrl: videoUrl
                }
            }
        }, { quoted: mek });

    } catch (error) {
        console.error("play Error:", error);
        await reply(`💢 Error: ${error.message}` + "\n\n© POWERED BY AHMED-MD");
    }
}); 
