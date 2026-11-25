const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;
const savedAudio = new Map();

function execPromise(command) {
  return new Promise((resolve) => {
    exec(command, (err) => {
      if (err) return resolve(false);
      resolve(true);
    });
  });
}

async function downloadQuotedMedia(quotedMsg, type) {
  const stream = await downloadContentFromMessage(quotedMsg, type);
  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
  return buffer;
}

function getQuoted(mek, m) {
  if (m.quoted) return m.quoted;
  if (m.msg?.contextInfo?.quotedMessage) {
    let q = m.msg.contextInfo.quotedMessage;
    let type = Object.keys(q)[0];
    return { ...q[type], mimetype: q[type]?.mimetype, message: q };
  }
  let ctx = mek.message?.extendedTextMessage?.contextInfo;
  if (ctx?.quotedMessage) {
    let q = ctx.quotedMessage;
    let type = Object.keys(q)[0];
    return { ...q[type], mimetype: q[type]?.mimetype, message: q };
  }
  if (m.reply_message) return m.reply_message;
  return null;
}

cmd({
  pattern: "asticker",
  alias: ["audiosticker", "as"],
  react: "🎵",
  desc: "Make audio sticker from video",
  category: "fun",
  use: ".asticker [reply to video]",
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });
    let quoted = getQuoted(mek, m);
    if (!quoted) return reply(`Reply to a video with .asticker${FOOTER}`);

    let mime = quoted.mimetype || quoted.message?.videoMessage?.mimetype || quoted.message?.audioMessage?.mimetype || quoted.message?.stickerMessage?.mimetype || "";

    // ─── VIDEO CASE ───
    if (mime.includes('video')) {
      await reply(`Video mil gayi! Audio nikal raha hun...${FOOTER}`);
      let videoMsg = quoted.message?.videoMessage || quoted;
      let videoBuffer = await downloadQuotedMedia(videoMsg, 'video');
      console.log("VIDEO SIZE:", videoBuffer.length);

      if (videoBuffer.length < 1000) return reply(`Video download nahi hui, dobara try karo!${FOOTER}`);

      let id = Date.now();
      let videoPath = `/tmp/astick_${id}.mp4`;
      let audioPath = `/tmp/astick_${id}.ogg`;
      let stickerPath = `/tmp/astick_${id}.webp`;
      fs.writeFileSync(videoPath, videoBuffer);

      // Try FFmpeg - agar hai to
      let ffmpegOk1 = await execPromise(`ffmpeg -y -i "${videoPath}" -vn -c:a libopus -b:a 64k "${audioPath}"`);
      let ffmpegOk2 = await execPromise(`ffmpeg -y -i "${videoPath}" -vcodec libwebp -filter:v "fps=10,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0" -loop 0 -preset default -an -vsync 0 "${stickerPath}"`);

      // ─── FALLBACK: FFmpeg nahi hai to bhi kaam karega ───
      if (!ffmpegOk1 || !fs.existsSync(audioPath)) {
        console.log("FFMPEG NOT FOUND - Using Fallback");
        await conn.sendMessage(from, { sticker: videoBuffer }, { quoted: mek });
        await conn.sendMessage(from, { audio: videoBuffer, mimetype: 'audio/mp4', ptt: false }, { quoted: mek });
        savedAudio.set(sender, videoBuffer);
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        return; // ✅ BAS YEHI 1 LINE CHANGE KI HAI - Pehle yahan wo lamba msg tha, ab kuch nahi aayega
      }

      // FFmpeg chal gaya to perfect wala bhejo
      if (fs.existsSync(stickerPath)) {
        await conn.sendMessage(from, { sticker: fs.readFileSync(stickerPath) }, { quoted: mek });
      } else {
        await conn.sendMessage(from, { sticker: videoBuffer }, { quoted: mek });
      }
      if (fs.existsSync(audioPath)) {
        let aud = fs.readFileSync(audioPath);
        savedAudio.set(sender, aud);
        await conn.sendMessage(from, { audio: aud, mimetype: 'audio/ogg; codecs=opus', ptt: false }, { quoted: mek });
      }

      [videoPath, audioPath, stickerPath].forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
      await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
      return reply(`Audio Sticker ban gaya! ✅${FOOTER}`);
    }

    // ─── AUDIO CASE ───
    if (mime.includes('audio')) {
      let audioMsg = quoted.message?.audioMessage || quoted;
      let buf = await downloadQuotedMedia(audioMsg, 'audio');
      savedAudio.set(sender, buf);
      await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
      return reply(`Audio save ho gaya! ✅\nAb sticker ko reply kar ke .asticker likho.${FOOTER}`);
    }

    // ─── STICKER CASE ───
    if (mime.includes('sticker')) {
      if (!savedAudio.has(sender)) return reply(`Pehle video/audio pe .asticker likho.${FOOTER}`);
      let stickerMsg = quoted.message?.stickerMessage || quoted;
      let stickerBuffer = await downloadQuotedMedia(stickerMsg, 'sticker');
      await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
      await conn.sendMessage(from, { audio: savedAudio.get(sender), mimetype: 'audio/ogg; codecs=opus' }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
      return reply(`Audio Sticker ban gaya! ✅${FOOTER}`);
    }

    return reply(`Video / Audio / Sticker ko reply karo!${FOOTER}`);
  } catch (e) {
    console.log("ASTICKER ERROR:", e);
    await reply(`Error: ${e.message}${FOOTER}`);
  }
});
