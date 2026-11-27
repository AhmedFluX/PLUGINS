const { cmd } = require('../command')
const fs = require('fs')
const path = require('path')
const { randomBytes } = require('crypto')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const ffprobeInstaller = require('@ffprobe-installer/ffprobe')
const { prepareWAMessageMedia } = require('@whiskeysockets/baileys')
const webp = require('node-webpmux')

// ===== HEROKU FIX: ffmpeg + ffprobe dono ka path set kar diya =====
ffmpeg.setFfmpegPath(ffmpegInstaller.path)
ffmpeg.setFfprobePath(ffprobeInstaller.path)

// ============ YOUR STICKER PACK NAME ============
const PACKNAME = "— ˹˱𝐀𝅦 𝐇𝅦 𝐌𝅦 𝟑𝅦 𝐃𝅦˲˺ • 率"
const AUTHOR = "AHMED-MD"
// ================================================

// CHANGED: 15 -> 40 SECONDS
const STICKER_SECONDS = 40
const saved = new Map()
const tempName = () => `asticker-${randomBytes(6).toString('hex')}`
const TEMP = path.join(__dirname, '../temp')
if (!fs.existsSync(TEMP)) fs.mkdirSync(TEMP, { recursive: true })

// Add Pack Name / Author EXIF to WebP so it shows your pack name
async function addExif(webpBuffer, packname, author) {
    try {
        const img = new webp.Image()
        await img.load(webpBuffer)
        const json = {
            "sticker-pack-id": "ahmed-md-asticker",
            "sticker-pack-name": packname,
            "sticker-pack-publisher": author,
            "sticker-pack-publisher-email": "",
            "sticker-pack-publisher-website": "",
            "android-app-store-link": "",
            "ios-app-store-link": "",
            "emojis": ["🎧"]
        }
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00])
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8')
        const exif = Buffer.concat([exifAttr, jsonBuffer])
        exif.writeUIntLE(jsonBuffer.length, 14, 4)
        img.exif = exif
        return await img.save(null)
    } catch (e) {
        console.log('EXIF FAIL, returning original webp:', e.message)
        return webpBuffer
    }
}

const toOpus = (input, output, seconds) =>
  new Promise((resolve, reject) => {
    const c = ffmpeg(input).noVideo().outputOptions([
        '-map_metadata', '-1', '-c:a', 'libopus',
        '-ac', '1', '-ar', '48000', '-b:a', '64k', '-f', 'ogg',
      ])
    if (seconds) c.duration(seconds)
    c.on('error', reject).on('end', () => resolve(fs.readFileSync(output))).save(output)
  })

const toWebp = (input, output) =>
  new Promise((resolve, reject) => {
    ffmpeg(input).outputOptions([
        '-vcodec', 'libwebp',
        '-vf', "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
        '-loop', '0', '-an', '-vsync', '0'
      ]).on('error', reject).on('end', () => resolve(fs.readFileSync(output))).save(output)
  })

const hasAudio = (p) =>
  new Promise((resolve, reject) =>
    ffmpeg.ffprobe(p, (e, meta) =>
      e ? reject(e) : resolve(meta.streams.some((s) => s.codec_type === 'audio'))
    )
  )

// Download method for AHMED-MD - m.quoted.download()
async function downloadQuoted(conn, m) {
    const q = m.quoted
    if (!q) throw new Error('No quoted')
    if (typeof q.download === 'function') return await q.download()
    if (typeof conn.downloadAndSaveMediaMessage === 'function') {
        const p = await conn.downloadAndSaveMediaMessage(q, tempName())
        const b = fs.readFileSync(p); fs.rmSync(p, { force: true }); return b
    }
    if (typeof conn.downloadMediaMessage === 'function') {
        return await conn.downloadMediaMessage(q)
    }
    throw new Error('Download method not found')
}

cmd({
    pattern: 'asticker',
    desc: 'Make audio sticker with AHMED-MD pack name - 40 sec',
    category: 'sticker',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const quoted = m.quoted
        if (!quoted) return reply(`*Reply to:*\n\n1. Video + *.asticker* -> Video + Audio Sticker (40 Sec)\n2. Song / Voice + *.asticker* -> Save Audio (40 Sec)\n3. Sticker + *.asticker* -> Add Audio to Sticker`)

        const sendAudioSticker = async (stickerBuf, audioMessage) => {
            // Add your pack name before sending
            const stickerWithExif = await addExif(stickerBuf, PACKNAME, AUTHOR)
            const { stickerMessage } = await prepareWAMessageMedia({ sticker: stickerWithExif, isAnimated: true }, { upload: conn.waUploadToServer })
            const msg = {
                messageContextInfo: { messageSecret: randomBytes(32) },
                audioStickerMessage: { message: { stickerMessage: { ...stickerMessage, audioMessage } } }
            }
            await conn.relayMessage(from, msg, {})
        }

        // CASE 3: Reply to STICKER -> Add saved audio
        if (quoted.type === 'stickerMessage' || quoted.mtype === 'stickerMessage' || quoted.sticker) {
            const audioMessage = saved.get(from)
            if (!audioMessage) return reply('❌ First reply to a song/voice with *.asticker* to save audio, then reply to a sticker.')
            const stickerBuf = await downloadQuoted(conn, m)
            await sendAudioSticker(stickerBuf, audioMessage)
            return
        }

        // CASE 2: Reply to AUDIO / VOICE -> Save Audio (40 Sec)
        if (quoted.type === 'audioMessage' || quoted.audio || quoted.mtype === 'audioMessage' || quoted.ptt) {
            const audioBuf = await downloadQuoted(conn, m)
            const inPath = path.join(TEMP, tempName() + '.mp3')
            const outPath = path.join(TEMP, tempName() + '.ogg')
            fs.writeFileSync(inPath, audioBuf)
            const opus = await toOpus(inPath, outPath, STICKER_SECONDS)
            const { audioMessage } = await prepareWAMessageMedia({ audio: opus, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { upload: conn.waUploadToServer })
            saved.set(from, audioMessage)
            fs.rmSync(inPath, { force: true }); fs.rmSync(outPath, { force: true })
            return reply('✅ *Audio Saved! (40 Sec)*\nNow reply to any sticker with *.asticker*')
        }

        // CASE 1: Reply to VIDEO -> Video + Audio Sticker (40 Sec)
        if (quoted.type === 'videoMessage' || quoted.video || quoted.mtype === 'videoMessage') {
            await reply('⏳ *Making Audio Sticker... (40 Sec)*')
            const videoBuf = await downloadQuoted(conn, m)
            const inPath = path.join(TEMP, tempName() + '.mp4')
            fs.writeFileSync(inPath, videoBuf)
            if (!(await hasAudio(inPath))) return reply('❌ This video has no audio.')
            const opusPath = path.join(TEMP, tempName() + '.ogg')
            const opus = await toOpus(inPath, opusPath, STICKER_SECONDS)
            const webpPath = path.join(TEMP, tempName() + '.webp')
            const webpBuf = await toWebp(inPath, webpPath)
            try {
                const { audioMessage } = await prepareWAMessageMedia({ audio: opus, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { upload: conn.waUploadToServer })
                await sendAudioSticker(webpBuf, audioMessage)
            } catch (e) {
                console.log('AudioSticker fail:', e.message)
                const withExif = await addExif(webpBuf, PACKNAME, AUTHOR)
                await conn.sendMessage(from, { sticker: withExif }, { quoted: mek })
                await reply('⚠️ Audio part failed, sent normal sticker.')
            }
            fs.rmSync(inPath, { force: true }); fs.rmSync(opusPath, { force: true }); fs.rmSync(webpPath, { force: true })
            return
        }

        return reply('❌ Only reply to Video / Audio / Sticker with *.asticker*')
    } catch (e) {
        console.log('ASTICKER ERROR:', e)
        reply(`❌ Error: ${e.message}`)
    }
})
