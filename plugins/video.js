
const axios = require('axios');
const yts = require('yt-search');
const { cmd } = require('../command');
const { fakevCard } = require('../lib/fakevCard');

cmd({
  pattern: 'video',
  alias: ['vid', 'playvideo'],
  desc: 'Download YouTube Video (Fast)',
  category: 'download',
  react: '🎬',
  filename: __filename
}, async (conn, mek, m, { q, reply }) => {

  try {
    const text = q?.trim();

    if (!text) {
      return reply('❌ Example:\n.video pasoori');
    }

    // YouTube Search
    const search = await yts(text);

    if (!search.videos || !search.videos.length) {
      return reply('❌ No video found');
    }

    const vid = search.videos[0];

    // Preview
    const caption = `
— AHMED-MD —
┃🎬 VIDEO FOUND
┃📌 Title: ${vid.title}
┃⏱️ Duration: ${vid.timestamp}
┃⚡ Sending video...
╰━━━━━━━━━━━━━━⊷
`;

    await conn.sendMessage(m.chat, {
      image: { url: vid.thumbnail },
      caption
    }, { quoted: fakevCard });

    // Video API
    const api =
      `https://arslan-apis-v2.vercel.app/download/ytmp4?url=${encodeURIComponent(vid.url)}`;

    const res = await axios.get(api, {
      timeout: 60000
    });

    if (
      !res.data ||
      !res.data.status ||
      !res.data.result ||
      !res.data.result.download ||
      !res.data.result.download.url
    ) {
      return reply('❌ Video API failed');
    }

    const videoUrl = res.data.result.download.url;
    const title = res.data.result.metadata?.title || vid.title;

    // Send Video
    await conn.sendMessage(m.chat, {
      video: { url: videoUrl },
      mimetype: 'video/mp4',
      caption: `🎬 *${title}*\n\n> © POWERED BY AHMED-MD`
    }, { quoted: fakevCard });

  } catch (err) {
    console.log('AHMED-MD VIDEO ERROR:', err);
    reply('❌ Video error');
  }

});
