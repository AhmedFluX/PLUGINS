const { cmd } = require('../command');
const fetch = (...args) =>
  import('node-fetch').then(({ default: fetch }) => fetch(...args));

const smallCaps = {
  a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ',
  f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
  k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ',
  p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 'ꜱ', t: 'ᴛ',
  u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ',
  z: 'ᴢ'
};

function toStyled(text) {
  return String(text).split(' ').map(word => {
    if (!word) return word;

    const first = word[0].toUpperCase();
    const rest = word.slice(1).toLowerCase()
      .split('')
      .map(c => smallCaps[c] || c)
      .join('');

    return first + rest;
  }).join(' ');
}

const editMessage = async (conn, mek, newText) => {
  try {
    await conn.sendMessage(mek.key.remoteJid, {
      text: newText,
      edit: mek.key
    });
  } catch (err) {
    console.log('AHMED-MD Edit Error:', err);
  }
};

cmd(
  {
    pattern: 'play',
    alias: ['song'],
    desc: 'Download and Play Music',
    category: 'download',
    filename: __filename
  },
  async (conn, mek, m, context) => {
    const { q, reply } = context;

    const query = q || (
      m.quoted && m.quoted.text
    );

    if (!query) {
      return reply(
        toStyled('Enter The Song Name Ex: Play Saiyaara Song')
      );
    }

    const statusMsg = await conn.sendMessage(
      m.chat,
      { text: toStyled(`🔍 Searching ៚ ${query} ...`) },
      { quoted: mek }
    );

    const apiUrl =
      `https://api.sayan-nexuswork.workers.dev/music?query=${encodeURIComponent(query.trim())}`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error('Music API request failed');
      }

      const data = await response.json();

      if (data.status === 'success' && data.url) {

        await editMessage(
          conn,
          statusMsg,
          toStyled(`⬇️ Downloading ៚ ${data.title} ...`)
        );

        const audioResponse = await fetch(data.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.youtube.com'
          }
        });

        if (!audioResponse.ok) {
          throw new Error('Audio download failed');
        }

        const arrayBuffer = await audioResponse.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);

        await editMessage(
          conn,
          statusMsg,
          toStyled(`🎧 Playing ៚ ${data.title} ...`)
        );

        await conn.sendMessage(
          m.chat,
          {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${data.title || 'AHMED-MD'}.mp3`,
            ptt: false
          },
          { quoted: mek }
        );

      } else {
        await editMessage(
          conn,
          statusMsg,
          toStyled('🛠️ Music Not Found Or Server Is Busy!')
        );
      }

    } catch (error) {
      console.error('AHMED-MD PLAY ERROR:', error);

      await editMessage(
        conn,
        statusMsg,
        toStyled('There Is A Problem With The Server Right Now!')
      );
    }
  }
);
