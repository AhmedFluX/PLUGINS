const { cmd } = require('../command');
const axios = require('axios');

const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

cmd({
  pattern: "naruto",
  alias: ["narutoedit", "narutostatus"],
  react: "🍥",
  desc: "Naruto WhatsApp Status Generator",
  category: "anime",
  use: ".naruto",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    await reply(`*🍥 Fetching a Naruto pic...*${FOOTER}`);

    const apiUrl = 'https://raw.githubusercontent.com/mask-sir/api.mask-ser/main/Naruto.json';
    const res = await axios.get(apiUrl, { timeout: 15000 });
    const result = res.data?.result || res.data;

    if (!result || !result.length) {
      return reply(`❌ No Naruto pics found, try again!${FOOTER}`);
    }

    // Pick a random image
    const randomImage = result[Math.floor(Math.random() * result.length)];
    let caption = `*Nαɾυƚσ υȥυɱαƙι*${FOOTER}`;

    await conn.sendMessage(from, { image: { url: randomImage }, caption: caption }, { quoted: mek });

  } catch (e) {
    console.log("NARUTO ERROR:", e.message);
    await reply(`❌ Something went wrong, try again!${FOOTER}`);
  }
});
