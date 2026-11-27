
const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const ffmpeg = require('fluent-ffmpeg')

const {
    proto,
    prepareWAMessageMedia
} = require('@whiskeysockets/baileys')

const { Sticker, StickerTypes } = require('wa-sticker-formatter')
const { cmd } = require('../command')
const StickerMaker = require('../lib/sticker-maker')

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
ffmpeg.setFfmpegPath(ffmpegPath)

const STICKER_SECONDS = 15
const PACK_NAME = '— ˹˱𝐀𝅦 𝐇𝅦 𝐌𝅦 𝟑𝅦 𝐃𝅦˲˺ • 率'
const PACK_AUTHOR = 'AHMED-MD'

const TEMP_DIR = path.join(os.tmpdir(), 'ahmed-md-astik')

fs.mkdirSync(TEMP_DIR, { recursive: true })

const saved = new Map()

const USAGE =
    '╭━━〔 🎧 AHMED-MD ASTIK 〕━━╮\n' +
    '┃\n' +
    '┃ Reply to a video with .astik\n' +
    '┃ to create an audio sticker.\n' +
    '┃\n' +
    '┃ Reply to a voice note/song with\n' +
    '┃ .astik to save its audio.\n' +
    '┃\n' +
    '┃ Reply to any sticker with .astik\n' +
    '┃ to add the saved audio.\n' +
    '┃\n' +
    '╰━━━━━━━━━━━━━━━━━━━━╯'

const tempName = () =>
    `astik-${crypto.randomBytes(6).toString('hex')}`

function addAudioStickerFields() {
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

function toOpus(input, output, seconds) {
    return new Promise((resolve, reject) => {
        const command = ffmpeg(input)
            .noVideo()
            .outputOptions([
                '-map', '0:a:0',
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
                try {
                    resolve(fs.readFileSync(output))
                } catch (error) {
                    reject(error)
                }
            })
            .save(output)
    })
}

async function uploadVoice(conn, file, seconds) {
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

async function makePackedSticker(buffer) {
    const sticker = new Sticker(buffer, {
        pack: PACK_NAME,
        author: PACK_AUTHOR,
        type: StickerTypes.DEFAULT
    })

    return await sticker.toBuffer()
}

async function uploadSticker(conn, buffer) {
    const packed = await makePackedSticker(buffer)

    const result = await prepareWAMessageMedia(
        {
            sticker: packed,
            isAnimated: false
        },
        {
            upload: conn.waUploadToServer
        }
    )

    return result.stickerMessage
}

async function sendAudioSticker(
    conn,
    from,
    stickerMessage,
    audioMessage
) {
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
        if (
            type === 'stickerMessage' ||
            quoted.mimetype === 'image/webp'
        ) {
            const audioMessage = saved.get(saveKey)

            if (!audioMessage) {
                return reply(
                    '❌ *No Saved Audio Found!*\n\n' +
                    'First reply to a voice note or song with .astik.'
                )
            }

            file = path.join(TEMP_DIR, `${tempName()}.webp`)

            const stickerBuffer = await quoted.download()
            fs.writeFileSync(file, stickerBuffer)

            const stickerMessage = await uploadSticker(
                conn,
                stickerBuffer
            )

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
            file = path.join(TEMP_DIR, tempName())

            const audio = await quoted.download()
            fs.writeFileSync(file, audio)

            const audioMessage = await uploadVoice(conn, file)

            saved.set(saveKey, audioMessage)

            return reply(
                '✅ *Audio Saved Successfully!*\n\n' +
                'Now reply to any sticker with .astik to add the audio.'
            )
        }

        // Create audio sticker from video
        if (type === 'videoMessage') {
            file = path.join(TEMP_DIR, `${tempName()}.mp4`)

            const video = await quoted.download()
            fs.writeFileSync(file, video)

            const audioMessage = await uploadVoice(
                conn,
                file,
                STICKER_SECONDS
            )

            const webp = await StickerMaker.videoToWebp(video)

            const stickerMessage = await uploadSticker(
                conn,
                webp
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
