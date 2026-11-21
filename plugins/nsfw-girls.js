const { cmd } = require('../command');

cmd({
    pattern: "boobs",
    alias: ["xboobs", "bobs"],
    desc: "Random Anime Girl Image",
    category: "fun",
    react: "🌸",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const apiUrl = "https://arslan-apis-v2-apis-v2.vercel.app/api/boobs";

        await conn.sendMessage(from, {
            image: { url: apiUrl },
            caption: "🌸 *Random X Girl*\n\n© POWERED BY AHMED-MD"
        }, { quoted: mek });

    } catch (err) {
        console.log(err);
        reply("⚠️ Image send nahi ho saki.\n\n© POWERED BY AHMED-MD");
    }
});

cmd({
    pattern: "xgirl",
    alias: ["xgirls", "ximg"],
    desc: "Random Anime Girl Image",
    category: "fun",
    react: "🌸",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const apiUrl = "https://arslan-apis-v2.vercel.app/api/girls-pack";

        await conn.sendMessage(from, {
            image: { url: apiUrl },
            caption: "🌸 *Random X Girl*\n\n© POWERED BY AHMED-MD"
        }, { quoted: mek });

    } catch (err) {
        console.log(err);
        reply("⚠️ Image send nahi ho saki.\n\n© POWERED BY AHMED-MD");
    }
});
