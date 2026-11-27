
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

const addAudioStickerFields = () => {
    const { Message } = proto

    if ('audioStickerMessage' in Message.prototype) return

    const encodeMessage = Message.encode

    Message.encode = function (m, w) {
        w = encodeMessage.call(this, m, w)

        if (m.audioStickerMessage != null) {
            Message.FutureProofMessage
                .encode(m.audioStickerMessage, w.uint32(1074).fork())
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

        if (seconds) command.duration(seconds)

        command
            .on('error', error =>
                reject(new Error(`FFmpeg: ${error.message}`))
            )
            .on('end', () => {
                resolve(fs.readFileSync(output))
            })
            .save(output)
    })

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

            const {
                contextInfo,
                mtype,
                id,
                chat,
                sender: quotedSender,
                fromMe,
                text,
                mentionedJid,
                ...stickerMessage
            } = quoted

            await sendAudioSticker(
                conn,
                from,
                stickerMessage,
                audioMessage
            )

            return
        }

        // Save audio from voice note or song
        if (type === 'audioMessage') {
            const file = path.join(TEMP_DIR, tempName())

            try {
                const audio = await conn.downloadMediaMessage(quoted)

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
            } finally {
                fs.rmSync(file, { force: true })
            }
        }

        // Create audio sticker from video
        if (type === 'videoMessage') {
            const file = path.join(TEMP_DIR, `${tempName()}.mp4`)

            try {
                const video = await conn.downloadMediaMessage(quoted)

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
            } finally {
                fs.rmSync(file, { force: true })
            }
        }

        return reply(USAGE)

    } catch (error) {
        console.error('ASTIK ERROR:', error)

        return reply(
            `❌ *ASTIK ERROR*\n\n${error.message || 'Something went wrong.'}`
        )
    }
})
