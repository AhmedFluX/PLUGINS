const { cmd } = require('../command');
const axios = require('axios');

const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

cmd({
  pattern: "emix",
  alias: ["mixemoji", "emojimix"],
  react: "😀",
  desc: "Mix two emojis",
  category: "sticker",
  use: ".emix 🙂😂",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    let input = m.body.replace(/^\.emix\s*/i, '').replace(/^\.mixemoji\s*/i, '').replace(/^\.emojimix\s*/i, '').trim();

    if (!input) {
      return reply(`❌ *Example:* \`.emix 🙂😂\`\n\nTry karo:\n.emix 😂❤️\n.emix 🥺😍\n.emix 🔥😈${FOOTER}`);
    }

    // Emojis nikal lo - space ho ya na ho, dono chalenge
    let emojis = input.replace(/\s/g, '');
    if (emojis.length < 2) {
      return reply(`❌ 2 emojis likho!\nExample: \`.emix 🙂😂\`${FOOTER}`);
    }

    await reply(`*😀 Mixing ${emojis}...*${FOOTER}`);

    const res = await axios.get(`https://levanter.onrender.com/emix?q=${encodeURIComponent(emojis)}`, { timeout: 15000 });
    const result = res.data?.result;

    if (!result) {
      return reply(`❌ *_Not supported_*\n\nYe dono emojis mix nahi ho sakte. Dusre try karo!\nExample: \`.emix 😂❤️\`${FOOTER}`);
    }

    // Image download kar ke sticker bhejo
    const { data } = await axios.get(result, { responseType: 'arraybuffer', timeout: 15000 });
    await conn.sendMessage(from, { sticker: Buffer.from(data) }, { quoted: mek });

  } catch (e) {
    console.log("EMIX ERROR:", e.message);
    // API down ho to dusri API try karo
    try {
      let input = m.body.replace(/^\.emix\s*/i, '').trim();
      // Fallback nahi mila to error
      await reply(`❌ *Emix API down hai, thodi der baad try karo!*${FOOTER}`);
    } catch {
      await reply(`❌ *Emix API down hai, thodi der baad try karo!*${FOOTER}`);
    }
  }
});
