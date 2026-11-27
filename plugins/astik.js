
const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const ffmpeg = require('fluent-ffmpeg')

const {
    proto,
    prepareWAMessageMedia
} = require('@whiskeysockets/baileys')

const { cmd } = require('../command')
const StickerMaker = require('../lib/sticker-maker')

// FFmpeg and FFprobe paths
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffprobePath = require('@ffprobe-installer/ffprobe').path

ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobePath)

const STICKER_SECONDS = 15
const TEMP_DIR = path.join(os.tmpdir(), 'ahmed-md-astik')

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
}

const saved = new Map()

const USAGE =
    '╭━━〔 🎧 AHMED-MD ASTIK 〕━━╮\n' +
    '┃\n' +
    '┃ Reply to a video with .astik\n' +
    '┃ to create an audio sticker.\n' +
    '┃\n' +
    '┃ Reply to a voice note or song\n' +
    '┃ with .astik to save its audio.\n' +
    '┃\n' +
    '┃ Then reply to any sticker with\n' +
    '┃ .astik to add the saved audio.\n' +
    '┃\n' +
    '╰━━━━━━━━━━━━━━━━━━━━╯'

const tempName = () =>
    `astik-${crypto.randomBytes(6).toString('hex')}`

// Extend Baileys message encoding
const addAudioStickerFields = () => {
    const { Message } = proto

    if ('audioStickerMessage' in Message.prototype) return

    const encodeMessage = Message.encode

    Message.encode = function (m, w) {
        w = encodeMessage.call(this, m, w)

        if (m.audioStickerMessage != null) {
            Message.FutureProofMessage
                .encode(
                    m.audioStickerMessage,
                    w.uint32(1074).fork()
                )
                .ldelim()
        }

        return w
    }

    const encodeSticker = Message.StickerMessage.encode

    Message.StickerMessage.encode = function (m, w) {
        w = encodeSticker.call(this, m, w)

        if (m.audioMessage != null) {
            Message.AudioMessage
                .encode(m.audioMessage, w.uint32(210).fork())
                .ldelim()
        }

        return w
    }

    Message.prototype.audioStickerMessage = null
    Message.StickerMessage.prototype.audioMessage = null
}

// Check whether media contains audio
const hasAudio = (file) =>
    new Promise((resolve, reject) => {
        ffmpeg.ffprobe(file, (error, metadata) => {
            if (error) return reject(error)

            resolve(
                metadata.streams.some(
                    stream => stream.codec_type === 'audio'
                )
            )
        })
    })

// Convert audio/video to Opus
const toOpus = (input, output, seconds) =>
    new Promise((resolve, reject) => {
        const command = ffmpeg(input)
            .noVideo()
            .outputOptions([
                '-map_metadata', '-1',
                '-c:a', 'libopus',
                '-ac', '1',
                '-ar', '48000',
                '-b:a', '64k',
                '-f', 'ogg'
            ])

        if (seconds) {
            command.duration(seconds)
        }

        command
            .on('error', error => {
                reject(new Error(`FFmpeg: ${error.message}`))
            })
            .on('end', () => {
                try {
                    resolve(fs.readFileSync(output))
                } catch (error) {
                    reject(error)
                }
            })
            .save(output)
    })

// Download quoted media
const downloadMedia = async (conn, quoted) => {
    if (typeof quoted.download === 'function') {
        return await quoted.download()
    }

    if (typeof conn.downloadMediaMessage === 'function') {
        return await conn.downloadMediaMessage(quoted)
    }

    throw new Error('Media download function not available.')
}

// Upload audio as WhatsApp voice note
const uploadVoice = async (conn, file, seconds) => {
    const output = path.join(TEMP_DIR, `${tempName()}.ogg`)

    try {
        const audio = await toOpus(file, output, seconds)

        const { audioMessage } = await prepareWAMessageMedia(
            {
                audio,
                mimetype: 'audio/ogg; codecs=opus',
                ptt: true
            },
            {
                upload: conn.waUploadToServer
            }
        )

        return audioMessage
    } finally {
        fs.rmSync(output, { force: true })
    }
}

// Send combined audio sticker
const sendAudioSticker = async (
    conn,
    from,
    stickerMessage,
    audioMessage
) => {
    addAudioStickerFields()

    return conn.relayMessage(
        from,
        {
            messageContextInfo: {
                messageSecret: crypto.randomBytes(32)
            },
            audioStickerMessage: {
                message: {
                    stickerMessage: {
                        ...stickerMessage,
                        audioMessage
                    }
                }
            }
        },
        {
            messageId: crypto.randomBytes(10).toString('hex')
        }
    )
}

cmd({
    pattern: 'astik',
    alias: [],
    desc: 'Create audio stickers and add audio to stickers',
    category: 'sticker',
    filename: __filename
}, async (conn, mek, m, context) => {

    const { from, sender, reply } = context
    const quoted = m.quoted

    if (!quoted || !quoted.mtype) {
        return reply(USAGE)
    }

    const type = quoted.mtype
    const saveKey = `${from}:${sender}`

    let file

    try {
        // Add saved audio to a sticker
        if (type === 'stickerMessage') {
            const audioMessage = saved.get(saveKey)

            if (!audioMessage) {
                return reply(
                    '❌ *No Saved Audio Found!*\n\n' +
                    'First reply to a voice note or song with .astik.'
                )
            }

            const stickerMessage =
                quoted.msg ||
                quoted.message?.stickerMessage ||
                quoted

            const {
                contextInfo,
                ...cleanSticker
            } = stickerMessage

            await sendAudioSticker(
                conn,
                from,
                cleanSticker,
                audioMessage
            )

            return
        }

        // Save audio from a voice note or song
        if (type === 'audioMessage') {
            file = path.join(TEMP_DIR, tempName())

            const audio = await downloadMedia(conn, quoted)
            fs.writeFileSync(file, audio)

            const audioMessage = await uploadVoice(
                conn,
                file
            )

            saved.set(saveKey, audioMessage)

            return reply(
                '✅ *Audio Saved Successfully!*\n\n' +
                'Now reply to any sticker with .astik to add the audio.'
            )
        }

        // Create audio sticker from a video
        if (type === 'videoMessage') {
            file = path.join(TEMP_DIR, `${tempName()}.mp4`)

            const video = await downloadMedia(conn, quoted)
            fs.writeFileSync(file, video)

            if (!(await hasAudio(file))) {
                return reply('❌ This video does not contain audio.')
            }

            const audioMessage = await uploadVoice(
                conn,
                file,
                STICKER_SECONDS
            )

            const webp = await StickerMaker.videoToWebp(video)

            const { stickerMessage } = await prepareWAMessageMedia(
                {
                    sticker: webp,
                    isAnimated: true
                },
                {
                    upload: conn.waUploadToServer
                }
            )

            await sendAudioSticker(
                conn,
                from,
                stickerMessage,
                audioMessage
            )

            return
        }

        return reply(USAGE)

    } catch (error) {
        console.error('ASTIK ERROR:', error)

        return reply(
            `❌ *ASTIK ERROR*\n\n${error.message || 'Something went wrong.'}`
        )

    } finally {
        if (file) {
            fs.rmSync(file, { force: true })
        }
    }
})
