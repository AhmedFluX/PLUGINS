
const { cmd } = require('../command');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));
const yts = require('yt-search');
const axios = require('axios');
const { fakevCard } = require('../lib/fakevCard');

// ===============================
// 🎵 SONG / MP3 DOWNLOADER
// ===============================

cmd({
  pattern: 'song',
  alias: ['ytmp3', 'play', 'mp3', 'gana', 'music', 'audio'],
  react: '🎵',
  desc: 'YouTube search & MP3 play',
  category: 'download',
  filename: __filename
}, async (conn, mek, m, { q, reply }) => {
  try {
    const query = q?.trim();

    if (!query) {
      return reply('❌ Please Provide Me A Song Query or Link');
    }

    await conn.sendMessage(m.chat, {
      react: { text: '⏳', key: mek.key }
    });

    // YouTube Search
    const search = await yts(query);

    if (!search.videos || !search.videos.length) {
      return reply('❌ No Result Found');
    }

    const video = search.videos[0];

    // MP3 API
    const apiUrl =
      `https://arslan-apis-v2.vercel.app/download/ytmp4?url=${encodeURIComponent(video.url)}`;

    const res = await axios.get(apiUrl, { timeout: 60000 });

    if (
      !res.data ||
      !res.data.status ||
      !res.data.result ||
      !res.data.result.download ||
      !res.data.result.download.url
    ) {
      return reply('❌ Audio Not Generated');
    }

    const dlUrl = res.data.result.download.url;
    const meta = res.data.result.metadata || {};
    const quality = res.data.result.download.quality || '128kbps';

    await conn.sendMessage(m.chat, {
      audio: { url: dlUrl },
      mimetype: 'audio/mpeg',
      ptt: false,
      fileName: `${meta.title || 'song'}.mp3`,
      caption:
        `🎵 *${meta.title || 'Unknown Title'}*\n` +
        `🎚️ Quality: ${quality}\n\n` +
        `> © POWERED BY AHMED-MD`,
      contextInfo: {
        externalAdReply: {
          title: meta.title
            ? meta.title.substring(0, 40)
            : 'YouTube Song',
          body: '▶︎ •၊၊||၊|။||||။‌‌‌‌‌၊|• AHMED-MD',
          thumbnailUrl: video.thumbnail,
          sourceUrl: video.url,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: fakevCard });

    await conn.sendMessage(m.chat, {
      react: { text: '✅', key: mek.key }
    });

  } catch (err) {
    console.error('PLAY ERROR:', err);
    reply('❌ Error Found Please Try Later');

    await conn.sendMessage(m.chat, {
      react: { text: '❌', key: mek.key }
    });
  }
});


// ===============================
// 🎬 YOUTUBE VIDEO DOWNLOADER
// ===============================

cmd({
  pattern: 'video1',
  alias: ['vid', 'ytv'],
  desc: 'Download YouTube Video',
  category: 'download',
  react: '🪄',
  filename: __filename
}, async (conn, mek, m, { q, reply }) => {
  try {
    if (!q) {
      return reply(
        'Please provide a YouTube link or search query.\n\nExample: .video1 Pasoori'
      );
    }

    let videoUrl;

    if (
      q.includes('youtube.com') ||
      q.includes('youtu.be')
    ) {
      videoUrl = q.trim();
    } else {
      const search = await yts(q);

      if (
        !search ||
        !search.videos ||
        search.videos.length === 0
      ) {
        return reply('No results found.');
      }

      videoUrl = search.videos[0].url;
    }

    const apiUrl =
      'https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=' +
      encodeURIComponent(videoUrl);

    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error('Video API request failed');
    }

    const data = await response.json();

    if (!data.status || !data.result?.media) {
      return reply('Failed to fetch video.');
    }

    const {
      video_url_hd,
      video_url_sd
    } = data.result.media;

    const downloadUrl =
      video_url_hd &&
      video_url_hd !== 'No HD video URL available'
        ? video_url_hd
        : video_url_sd;

    if (!downloadUrl || downloadUrl.includes('No')) {
      return reply('No downloadable video found.');
    }

    await conn.sendMessage(m.chat, {
      video: { url: downloadUrl },
      caption: '*AHMED-MD*'
    }, {
      quoted: fakevCard
    });

  } catch (err) {
    console.error('VIDEO ERROR:', err);
    reply('Error while fetching video.');
  }
});
