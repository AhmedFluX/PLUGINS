const fs = require('fs')
const { join } = require('path')
const { randomBytes } = require('crypto')
const ffmpeg = require('fluent-ffmpeg')
const { cmd } = require('../command')

// AHMED-MD me Baileys yahan se aata hai
let proto, prepareWAMessageMedia
try {
    const baileys = require('@whiskeysockets/baileys')
    proto = baileys.proto
    prepareWAMessageMedia = baileys.prepareWAMessageMedia
} catch (e) { console.log('Baileys load fail:', e.message) }

const STICKER_SECONDS = 15

const USAGE = `╭━━〔 🔊 AHMED-MD ASTICKER 〕━━╮
┃
┃ Reply to a video with .asticker to turn it into audio sticker.
┃ Or reply to a voice note / song with .asticker to save audio,
┃ then reply to any sticker with .asticker to add it.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`

const saved = new Map()

const addAudioStickerFields = () => {
    if (!proto) return
    const { Message } = proto
    if ('audioStickerMessage' in Message.prototype) return

    const encodeMessage = Message.encode
    Message.encode = function encode(m, w) {
        w = encodeMessage.call(this, m, w)
        if (m.audioStickerMessage != null)
            Message.FutureProofMessage.encode(m.audioStickerMessage, w.uint32(1074).fork()).ldelim()
        return w
    }

    const encodeSticker = Message.StickerMessage.encode
    Message.StickerMessage.encode = function encode(m, w) {
        w = encodeSticker.call(this, m, w)
        if (m.audioMessage != null)
            Message.AudioMessage.encode(m.audioMessage, w.uint32(210).fork()).ldelim()
        return w
    }

    Message.prototype.audioStickerMessage = null
    Message.StickerMessage.prototype.audioMessage = null
}

const tempName = () => `asticker-${randomBytes(6).toString('hex')}`
const TEMP_DIR = './temp'

const hasAudio = (path) =>
    new Promise((resolve, reject) =>
        ffmpeg.ffprobe(path, (e, meta) =>
            e ? reject(e) : resolve(meta.streams.some((s) => s.codec_type === 'audio'))
        )
    )

const toOpus = (input, output, seconds) =>
    new Promise((resolve, reject) => {
        const cmdF = ffmpeg(input).noVideo().outputOptions(['-map_metadata', '-1', '-c:a', 'libopus', '-ac', '1', '-ar', '48000', '-b:a', '64k', '-f', 'ogg'])
        if (seconds) cmdF.duration(seconds)
        cmdF.on('error', (e) => reject(new Error(`ffmpeg: ${e.message}`)))
            .on('end', () => resolve(fs.readFileSync(output)))
            .save(output)
    })

const uploadVoice = async (conn, prepareFn, path, seconds) => {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
    const output = join(TEMP_DIR, `${tempName()}.ogg`)
    try {
        const audio = await toOpus(path, output, seconds)
        const { audioMessage } = await prepareFn(
            { audio, mimetype: 'audio/ogg; codecs=opus', ptt: true },
            { upload: conn.waUploadToServer }
        )
        return audioMessage
    } finally {
        fs.rmSync(output, { force: true })
    }
}

const sendAudioSticker = async (conn, from, quoted, stickerMessage, audioMessage) => {
    return await conn.sendMessage(from, {
        audioStickerMessage: {
            message: {
                stickerMessage: {
                    ...stickerMessage,
                    audioMessage,
                },
            },
        },
    }, { quoted })
}

cmd({
    pattern: 'asticker',
    desc: 'Audio sticker from video, or add saved audio to sticker',
    category: 'general',
    react: '🔊',
    filename: __filename
}, async (conn, mek, m, { from, reply, quoted }) => {
    try {
        if (!quoted) return reply(USAGE)

        // quoted ka type check
        const qMsg = quoted.message || {}
        const isVideo = !!qMsg.videoMessage
        const isAudio = !!qMsg.audioMessage
        const isSticker = !!qMsg.stickerMessage

        if (!isVideo && !isAudio && !isSticker) return reply(USAGE)

        addAudioStickerFields()
        if (!proto) return reply('❌ Baileys proto nahi mila.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')

        if (isSticker) {
            const audioMessage = saved.get(m.sender)
            if (!audioMessage) return reply('❌ No saved audio. Pehle voice note / song pe reply kar ke .asticker likho.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
            const { contextInfo, ...stickerMessage } = qMsg.stickerMessage
            await sendAudioSticker(conn, from, mek, stickerMessage, audioMessage)
            return
        }

        if (isAudio) {
            const audioMsg = qMsg.audioMessage
            if (audioMsg.ptt) {
                const { contextInfo, ...clean } = audioMsg
                saved.set(m.sender, clean)
            } else {
                // download via conn
                const buffer = await conn.downloadMediaMessage(quoted)
                if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
                const path = join(TEMP_DIR, tempName())
                fs.writeFileSync(path, buffer)
                try {
                    saved.set(m.sender, await uploadVoice(conn, prepareWAMessageMedia, path))
                } finally { fs.rmSync(path, { force: true }) }
            }
            return reply('✅ Audio saved. Ab kisi sticker pe reply kar ke .asticker likho.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        // Video case
        if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })
        const buffer = await conn.downloadMediaMessage(quoted)
        const path = join(TEMP_DIR, tempName() + '.mp4')
        fs.writeFileSync(path, buffer)
        try {
            if (!(await hasAudio(path))) return reply('❌ Is video me audio nahi hai.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
            const audioMessage = await uploadVoice(conn, prepareWAMessageMedia, path, STICKER_SECONDS)

            // video -> webp sticker (AHMED-MD ke sticker function jaisa)
            // Agar tere bot me sticker helper hai to ye line use kar, warna ffmpeg se convert hoga
            const webpPath = join(TEMP_DIR, tempName() + '.webp')
            await new Promise((resolve, reject) => {
                ffmpeg(path).outputOptions(['-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse', '-loop', '0']).on('error', reject).on('end', resolve).save(webpPath)
            })
            const webp = fs.readFileSync(webpPath)
            fs.rmSync(webpPath, { force: true })

            const { stickerMessage } = await prepareWAMessageMedia(
                { sticker: webp, isAnimated: true },
                { upload: conn.waUploadToServer }
            )
            await sendAudioSticker(conn, from, mek, stickerMessage, audioMessage)
        } finally {
            fs.rmSync(path, { force: true })
        }

    } catch (e) {
        console.log('AHMED-MD ASTICKER ERROR:', e)
        reply(`❌ Failed: ${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
}) 
