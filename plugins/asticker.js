const { cmd } = require('../command');
const fs = require('fs');
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

    if (mime.includes('video')) {
      let videoMsg = quoted.message?.videoMessage || quoted;
      let videoBuffer = await downloadQuotedMedia(videoMsg, 'video');
      if (videoBuffer.length < 1000) return reply(`Video download nahi hui, dobara try karo!${FOOTER}`);

      let id = Date.now();
      let videoPath = `/tmp/astick_${id}.mp4`;
      let audioPath = `/tmp/astick_${id}.ogg`;
      let stickerPath = `/tmp/astick_${id}.webp`;
      fs.writeFileSync(videoPath, videoBuffer);

      let ffmpegOk1 = await execPromise(`ffmpeg -y -i "${videoPath}" -vn -c:a libopus -b:a 64k "${audioPath}"`);
      let ffmpegOk2 = await execPromise(`ffmpeg -y -i "${videoPath}" -vcodec libwebp -filter:v "fps=10,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0" -loop 0 -preset default -an -vsync 0 "${stickerPath}"`);

      // ─── FALLBACK - KOI MESSAGE NAHI BHEJEGA ───
      if (!ffmpegOk1 || !fs.existsSync(audioPath)) {
        await conn.sendMessage(from, { sticker: videoBuffer }, { quoted: mek });
        await conn.sendMessage(from, { audio: videoBuffer, mimetype: 'audio/mp4', ptt: false }, { quoted: mek });
        savedAudio.set(sender, videoBuffer);
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
        return; // <-- Bas yahan return, koi reply nahi
      }

      if (fs.existsSync(stickerPath)) {
        await conn.sendMessage(from, { sticker: fs.readFileSync(stickerPath) }, { quoted: mek });
      } else {
        await conn.sendMessage(from, { sticker: videoBuffer }, { quoted: mek });
      }
      if (fs.existsSync(audioPath)) {
        let aud = fs.read
