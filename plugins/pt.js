const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;
const pinterestCookie = process.env.PT_COOKIE || null;
let isProcessStopped = false;

async function pinterest(queryOrUrl) {
  const isUrl = queryOrUrl.startsWith('http');
  const endpoint = isUrl
    ? queryOrUrl
    : 'https://id.pinterest.com/search/pins/?autologin=true&q=' + encodeURIComponent(queryOrUrl);

  const { data } = await axios.get(endpoint, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      cookie: pinterestCookie || '',
    },
    timeout: 15000
  });

  const $ = cheerio.load(data);
  const result = new Set();

  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src && src.includes('pinimg.com') && /\/(236x|474x|736x)\//.test(src)) {
      const clean = src.replace(/236x|474x|564x/g, '736x');
      if (
        !clean.endsWith('.svg') &&
        !clean.includes('blank.gif') &&
        !clean.includes('data:image') &&
        !result.has(clean)
      ) {
        result.add(clean);
      }
    }
  });

  return [...result];
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

cmd({
  pattern: "pt",
  alias: ["pinterest", "pint"],
  react: "📌",
  desc: "Pinterest image & sticker downloader",
  category: "media",
  use: ".pt i 5 cute cats / .pt s 3 anime",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    let input = m.body.replace(/^\.pt\s*/i, '').replace(/^\.pinterest\s*/i, '').replace(/^\.pint\s*/i, '').trim();

    if (!input) {
      return reply(`_Pinterest Help:_\n\n• \`.pt i 5 cute cats\` → 5 images\n• \`.pt s 3 anime\` → 3 stickers\n• \`.pt stop\` → Stop${FOOTER}`);
    }

    const args = input.split(' ');
    const mode = args.shift()?.toLowerCase();

    if (mode === 'stop') {
      isProcessStopped = true;
      return reply(`_Process Stopped._${FOOTER}`);
    }

    if (!['i', 's'].includes(mode)) {
      return reply(`_Invalid mode. Use:_\n• \`.pt i <count> <query>\`\n• \`.pt s <count> <query>\`${FOOTER}`);
    }

    let count = null;
    if (!isNaN(args[0])) {
      count = parseInt(args.shift());
      if (count <= 0) count = null;
      if (count > 10) count = 10; // Spam se bachne ke liye max 10
    }

    const query = args.join(' ').trim();
    const isUrl = query.startsWith('http');

    if (!query) return reply(`_Please provide a search term or Pinterest link_${FOOTER}`);

    isProcessStopped = false;
    await reply(`Fetching from ${isUrl ? "Pinterest link" : `"${query}"`}...${FOOTER}`);

    let imageUrls;
    try {
      imageUrls = await pinterest(isUrl ? query : query);
    } catch (e) {
      console.log("PT ERROR:", e.message);
      return reply(`_Failed to fetch images. Pinterest cookie may be invalid or expired._${FOOTER}`);
    }

    if (!imageUrls.length) return reply(`_No images found._${FOOTER}`);

    const limit = count ? Math.min(count, imageUrls.length) : Math.min(5, imageUrls.length);
    await reply(`Found ${imageUrls.length} results. Sending ${limit} ${mode === 'i' ? 'images' : 'stickers'}...${FOOTER}`);

    for (let i = 0; i < limit; i++) {
      if (isProcessStopped) break;
      const url = imageUrls[i];

      try {
        if (mode === 'i') {
          // Image bhejo
          const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
          await conn.sendMessage(from, { image: Buffer.from(data), caption: `📌 ${query}${FOOTER}` }, { quoted: mek });
        } else {
          // Sticker bhejo - WhatsApp khud convert kar dega, sharp ki zaroorat nahi
          const { data } = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
          await conn.sendMessage(from, { sticker: Buffer.from(data) }, { quoted: mek });
        }
      } catch (err) {
        console.log(`Error processing ${i + 1}:`, err.message);
      }

      await sleep(1000);
    }

    if (!isProcessStopped) {
      await reply(`_${mode === 'i' ? 'Images' : 'Stickers'} Sent._${FOOTER}`);
    }

  } catch (e) {
    console.log("PT ERROR:", e);
    await reply(`🚨 Error: ${e.message}${FOOTER}`);
  }
});
