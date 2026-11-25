'use strict';

const axios = require('axios');
const cheerio = require('cheerio');
const { cmd } = require('../command'); // Ahmed-MD ke repo ka cmd path

const BASE_URL = 'https://sfmcompile.club';
const FOOTER = '© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ';

const http = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  },
});

function cleanFileName(value) {
  return (
    String(value || 'sfm-video')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
      .trim()
      .slice(0, 90) || 'sfm-video'
  );
}

function getMimeType(source, declaredType) {
  if (declaredType && declaredType.startsWith('video/')) return declaredType;

  const pathname = new URL(source).pathname.toLowerCase();
  if (pathname.endsWith('.webm')) return 'video/webm';
  if (pathname.endsWith('.mov')) return 'video/quicktime';
  return 'video/mp4';
}

async function getRandomVideos() {
  const page = Math.floor(Math.random() * 1153) + 1;
  const pageUrl = `${BASE_URL}/page/${page}/`;
  const { data } = await http.get(pageUrl);
  const $ = cheerio.load(data);
  const results = [];

  $('#primary article').each((_, article) => {
    const item = $(article);
    const title =
      item.find('header h2 a').text().trim() ||
      item.find('header h2').text().trim() ||
      'Untitled video';

    const link = item.find('header h2 a').attr('href') || pageUrl;
    const category = item
      .find('.entry-before-title')
      .text()
      .replace(/^in\s+/i, '')
      .trim() || 'Unknown';

    const sourceEl = item.find('video source').first();
    const videoUrl =
      sourceEl.attr('src') ||
      item.find('video').first().attr('src') ||
      item.find('a[href$=".mp4"]').first().attr('href');

    // Image URLs ko video samajh kar send nahi karte.
    if (!videoUrl || !/^https?:\/\//i.test(videoUrl)) return;

    const sharesText = item.find('.entry-shares').text().replace(/\D/g, '');
    const viewsText = item.find('.entry-views').text().replace(/\D/g, '');

    results.push({
      title,
      link,
      category,
      shares: Number(sharesText) || 0,
      views: Number(viewsText) || 0,
      url: videoUrl,
      mimeType: getMimeType(videoUrl, sourceEl.attr('type')),
    });
  });

  if (!results.length) {
    throw new Error('Is page par koi video nahi mila. Dobara try karein.');
  }

  return results;
}

cmd(
  {
    pattern: 'sfm',
    alias: ['sfmvideo'],
    desc: 'Random SFM video bheje',
    category: 'media',
    filename: __filename,
  },
  async (message) => {
    try {
      const videos = (await getRandomVideos()).slice(0, 3);

      for (const video of videos) {
        try {
          const response = await http.get(video.url, {
            responseType: 'arraybuffer',
            timeout: 60000,
            maxContentLength: 100 * 1024 * 1024,
          });

          const buffer = Buffer.from(response.data);
          const caption =
            `🎬 *Title:* ${video.title}\n` +
            `📂 *Category:* ${video.category}\n` +
            `👀 *Views:* ${video.views}\n` +
            `🔁 *Shares:* ${video.shares}\n` +
            `🔗 *Link:* ${video.link}\n\n` +
            FOOTER;

          await message.sendMessage(
            message.chat,
            buffer,
            'video',
            {
              caption,
              mimetype: video.mimeType,
              fileName: `${cleanFileName(video.title)}.mp4`,
            }
          );
        } catch (err) {
          console.error('SFM media error:', err.message);
          await message.sendMessage(
            message.chat,
            `❌ Video load nahi hua: ${video.title}\n\n${FOOTER}`,
            'text'
          );
        }
      }
    } catch (err) {
      console.error('SFM command error:', err.message);
      await message.sendMessage(
        message.chat,
        `❌ ${err.message}\n\n${FOOTER}`,
        'text'
      );
    }
  }
);
