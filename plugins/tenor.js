const { cmd } = require('../command');
const axios = require('axios');

const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

cmd({
  pattern: "tenor",
  alias: ["tenorsticker", "tgif"],
  react: "🎞️",
  desc: "Sticker from Tenor",
  category: "sticker",
  use: ".tenor cat dancing / .tenor cat dancing, 3",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    let input = m.body.replace(/^\.tenor\s*/i, '').replace(/^\.tenorsticker\s*/i, '').replace(/^\.tgif\s*/i, '').trim();

    if (!input) {
      return reply(`> *Example:*\n- \`.tenor cat dancing\`\n- \`.tenor cat dancing, 3\`${FOOTER}`);
    }

    let [q, limit] = input.split(',');
    q = q.trim();
    limit = limit && !isNaN(limit.trim()) ? parseInt(limit.trim()) : 1;
    if (limit > 10) limit = 10; // Spam se bachne ke liye max 10
    if (limit < 1) limit = 1;

    if (!q) return reply(`❌ Search kya karna hai wo to likho!\nExample: \`.tenor cat dancing\`${FOOTER}`);

    await reply(`*🎞️ Searching Tenor for "${q}"...*${FOOTER}`);

    const res = await axios.get(`https://g.tenor
