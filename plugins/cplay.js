const { cmd } = require('../command');
const axios = require('axios');

const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

cmd({
  pattern: "cplay",
  alias: ["play2", "song2", "music2"],
  react: "🎶",
  desc: "Play a song from search",
  category: "music",
  use: ".cplay arike",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    let query = m.body.replace(/^\.cplay\s*/i, '').replace(/^\.play2\s*/i, '').replace(/^\.song2\s*/i, '').replace(/^\.music2\s*/i, '').trim();

    if (!query) {
      return reply(`❌ Please enter a song name.\nExample: \`.cplay arike\`${FOOTER}`);
    }

    await reply(`*🎶 Searching "${query}"...*${FOOTER}`);

    const api = `https://apis.davidcyriltech.my.id/play?query=${encodeURIComponent(query)}`;
    const res = await axios.get(api, { timeout: 30000 });
    const data = res.data;

    if (data.status && data.result && data.result.download_url) {
      const r = data.result;

      // Pehle audio bhejo
      await conn.sendMessage(from, { 
        audio: { url: r.download_url }, 
        mimetype: 'audio/mp4', 
        ptt: false 
      }, { quoted: mek });

      // Phir details bhejo
      const caption = `🎶 *${r.title || 'Unknown'}*\n📺 *Views:* ${r.views || '-'}\n⏱ *Duration:* ${r.duration || '-'}\n📅 *Published:* ${r.published || '-'}\n📎 *URL:* ${r.video_url || '-'}${FOOTER}`;

      await reply(caption);

    } else {
      await reply(`❌ No song found for *"${query}"*.${FOOTER}`);
    }

  } catch (e) {
    console.log("CPLAY ERROR:", e.message);
    await reply(`❌ An error occurred while processing your request. Dobara try karo!${FOOTER}`);
  }
});
