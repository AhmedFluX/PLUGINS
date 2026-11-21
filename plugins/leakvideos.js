const { cmd } = require('../command');

//================= LEAK VIDEO  =================

cmd({
    pattern: "leakvideo",
    alias: ["leakvideo", "leak"],
    desc: "Send random leak video",
    category: "18+",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { reply, from }) => {
    try {
        await reply("⏳ Fetching sad video...\n\n© POWERED BY AHMED-MD");

        const videoUrl = "https://arslan-apis-v2.vercel.app/leakvideos";

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: "🎬 Random Leak Video\n\n© POWERED BY AHMED-MD",
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: mek });

    } catch (err) {
        console.log(err);
        reply("❌ Video load nahi hui.\n\n© POWERED BY AHMED-MD");
    }
});

//================= LEAK VIDEO  =================

cmd({
    pattern: "leakvideo1",
    alias: ["leak1"],
    desc: "Send random leakvideo video 2",
    category: "18+",
    react: "🔥",
    filename: __filename
}, async (conn, mek, m, { reply, from }) => {
    try {
        await reply("⏳ Fetching sad video...\n\n© POWERED BY AHMED-MD");

        const videoUrl = "https://arslan-apis-v2.vercel.app/leakvideos2";

        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: "video/mp4",
            caption: "🔥 Random LeakVideo 2\n\n© POWERED BY AHMED-MD",
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: mek });

    } catch (err) {
        console.log(err);
        reply("❌ Video load nahi hui.\n\n© POWERED BY AHMED-MD");
    }
}); 
