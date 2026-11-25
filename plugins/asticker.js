const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const FOOTER = `\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`;

// User ka saved audio yahan rahega
const savedAudio = new Map();

function execPromise(command) {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

async function downloadQuotedMedia(quotedMsg) {
  const stream = await downloadContentFromMessage(quotedMsg, quotedMsg.mimetype ? quotedMsg.mimetype.split('/')[0] : 'video');
  let buffer = Buffer.from([]);
  for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
  return buffer;
}

// ─── Quoted ko har jagah se dhoondo - YEHI FIX HAI ───
function getQuoted(mek, m) {
  // 1. Direct m.quoted
  if (m.quoted) return m.quoted;
  if (m.msg?.contextInfo?.quotedMessage) {
    let q = m.msg.contextInfo.quotedMessage;
    let type = Object.keys(q)[0];
    return { ...q[type], mimetype: q[type]?.mimetype, message: q, key: { id: m.msg.contextInfo.stanzaId, participant: m.msg.contextInfo.participant } };
  }
  // 2. mek se
  let ctx = mek.message?.extendedTextMessage?.contextInfo || mek.message?.imageMessage?.contextInfo || mek.message?.videoMessage?.contextInfo;
  if (ctx?.quotedMessage) {
    let q = ctx.quotedMessage;
    let type = Object.keys(q)[0];
    return { ...q[type], mimetype: q[type]?.mimetype, message: q, key: { id: ctx.stanzaId, participant: ctx.participant } };
  }
  // 3. m.reply_message
  if (m.reply_message) return m.reply_message;
  return null;
}

cmd({
  pattern: "asticker",
  alias: ["audiosticker", "as"],
  react: "🎵",
  desc: "Make audio sticker from video/audio + sticker",
  category: "fun",
  use: ".asticker [reply to video/audio/sticker]",
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

    let quoted = getQuoted(mek, m);
    // console.log("QUOTED FOUND:", quoted?.mimetype);

    if (!quoted) {
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
      return reply(`┌ [ 🔊 AHMED-MD ASTICKER ]\n│\n│ Reply to a video with .asticker to turn it into audio sticker.\n│ Or reply to a voice note / song with .asticker to save audio,\n│ then reply to any sticker with .asticker to add it.\n│${FOOTER}`);
    }

    let mime = quoted.mimetype || quoted.message?.videoMessage?.mimetype || quoted.message?.audioMessage?.mimetype || quoted.message?.stickerMessage?.mimetype || "";
    // console.log("MIME:", mime);

    // ─── CASE 1: VIDEO REPLY - Video se Audio Sticker banao ───
    if (mime.includes('video')) {
      await reply(`Video mil gayi! Audio nikal raha hun...${FOOTER}`);
      let videoMsg = quoted.message?.videoMessage || quoted;
      let videoBuffer = await downloadQuotedMedia(videoMsg);

      let tmpDir = '/tmp';
      let videoPath = path.join(tmpDir, `astick_${Date.now()}.mp4`);
      let audioPath = path.join(tmpDir, `astick_${Date.now()}.ogg`);
      let stickerPath = path.join(tmpDir, `astick_${Date.now()}.webp`);
      fs.writeFileSync(videoPath, videoBuffer);

      // Video se audio nikalo + video se sticker banao
      try { await execPromise(`ffmpeg -y -i "${videoPath}" -vn -c:a libopus -b:a 64k "${audioPath}"`); } catch (e) {}
      try { await execPromise(`ffmpeg -y -i "${videoPath}" -vcodec libwebp -filter:v "fps=10,scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0" -loop 0 -preset default -an -vsync 0 "${stickerPath}"`); } catch (e) {}

      if (!fs.existsSync(audioPath) || !fs.existsSync(stickerPath)) {
        return reply(`Failed to convert video! FFmpeg installed hai?${FOOTER}`);
      }

      // Audio ko save karo is user ke liye
      savedAudio.set(sender, fs.readFileSync(audioPath));

      // Sticker + Audio dono bhejo
      await conn.sendMessage(from, { sticker: fs.readFileSync(stickerPath) }, { quoted: mek });
      await conn.sendMessage(from, { audio: fs.readFileSync(audioPath), mimetype: 'audio/ogg; codecs=opus', ptt: false }, { quoted: mek });

      // Cleanup
      [videoPath, audioPath, stickerPath].forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

      await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
      return reply(`Done! Video ka sticker + audio bhej diya.${FOOTER}\n\nAb kisi bhi sticker ko reply kar ke .asticker likho, usme ye audio lag jayega.`);
    }

    // ─── CASE 2: AUDIO / VOICE NOTE REPLY - Audio save karo ───
    if (mime.includes('audio')) {
      let audioMsg = quoted.message?.audioMessage || quoted;
      let audioBuffer = await downloadQuotedMedia(audioMsg);
      savedAudio.set(sender, audioBuffer);
      await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
      return reply(`Audio save ho gaya! ✅\n\nAb kisi bhi sticker ko reply kar ke .asticker likho, usme ye audio lag jayega.${FOOTER}`);
    }

    // ─── CASE 3: STICKER REPLY - Saved audio sticker me lagao ───
    if (mime.includes('sticker') || quoted.message?.stickerMessage) {
      if (!savedAudio.has(sender)) {
        return reply(`Pehle kisi video / audio ko reply kar ke .asticker likho taake audio save ho,\nphir sticker ko reply kar ke .asticker likho.${FOOTER}`);
      }
      let stickerMsg = quoted.message?.stickerMessage || quoted;
      let stickerBuffer = await downloadQuotedMedia(stickerMsg);
      let audioBuffer = savedAudio.get(sender);

      let stickerPath = path.join('/tmp', `s_${Date.now()}.webp`);
      let audioPath = path.join('/tmp', `a_${Date.now()}.ogg`);
      let outPath = path.join('/tmp', `out_${Date.now()}.webp`);
      fs.writeFileSync(stickerPath, stickerBuffer);
      fs.writeFileSync(audioPath, audioBuffer);

      // Sticker + Audio combine
      try {
        await execPromise(`ffmpeg -y -i "${stickerPath}" -i "${audioPath}" -c:v copy -c:a libopus -shortest "${outPath}"`);
      } catch (e) {
        // Agar combine na ho to sticker hi bhej do + audio alag se
        await conn.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });
        await conn.sendMessage(from, { audio: audioBuffer, mimetype: 'audio/ogg; codecs=opus' }, { quoted: mek });
        return reply(`Sticker bhej diya, audio alag se bhej diya (combine nahi hua).${FOOTER}`);
      }

      let finalSticker = fs.existsSync(outPath) ? fs.readFileSync(outPath) : stickerBuffer;
      await conn.sendMessage(from, { sticker: finalSticker }, { quoted: mek });
      await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
      return reply(`Audio Sticker ban gaya! ✅${FOOTER}`);
    }

    return reply(`Is type ko support nahi karta!\nReply karo: Video / Audio / Sticker ko${FOOTER}`);

  } catch (e) {
    console.log("ASTICKER ERROR:", e);
    await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
    await reply(`Error: ${e.message}${FOOTER}`);
  }
});
