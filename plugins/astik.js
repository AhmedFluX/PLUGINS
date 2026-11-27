
const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const ffmpeg = require('fluent-ffmpeg')
const WebP = require('node-webpmux')

const {
    proto,
    prepareWAMessageMedia
} = require('@whiskeysockets/baileys')

const { cmd } = require('../command')
const StickerMaker = require('../lib/sticker-maker')

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
ffmpeg.setFfmpegPath(ffmpegPath)

const STICKER_SECONDS = 35

const PACK_NAME = '— ˹˱𝐀𝅦 𝐇𝅦 𝐌𝅦 𝟑𝅦 𝐃𝅦˲˺ • 率'

const TEMP_DIR = path.join(os.tmpdir(), 'ahmed-md-astik')

fs.mkdirSync(TEMP_DIR, { recursive: true })

// Saved audio storage
const saved = new Map()

const USAGE =
    '╭━━〔 🎧 AHMED-MD ASTIK 〕━━╮\n' +
    '┃\n' +
    '┃ Reply to a video with .astik\n' +
    '┃ to create an audio sticker.\n' +
    '┃\n' +
    '┃ Reply to a voice note/song\n' +
    '┃ with .astik to save its audio.\n' +
    '┃\n' +
    '┃ Reply to any sticker with\n' +
    '┃ .astik to add saved audio.\n' +
    '┃\n' +
    '╰━━━━━━━━━━━━━━━━━━━━╯'

const tempName = () =>
    `astik-${crypto.randomBytes(6).toString('hex')}`


// Add only sticker pack metadata.
// Original WebP frames and animation are preserved.
async function addPackMetadata(buffer) {
    const image = new WebP.Image()

    await image.load(buffer)

    const isAnimated = Boolean(image.hasAnim)

    const metadata = Buffer.from(
        JSON.stringify({
            'sticker-pack-id': 'astik',
            'sticker-pack-name': PACK_NAME,
            'sticker-pack-publisher': '',
            emojis: []
        }),
        'utf8'
    )

    const header = Buffer.from([
        0x49, 0x49, 0x2A, 0x00,
        0x08, 0x00, 0x00, 0x00,
        0x01, 0x00, 0x41, 0x57,
        0x07, 0x00
    ])

    const length = Buffer.alloc(4)
    length.writeUIntLE(metadata.length, 0)

    const exif = Buffer.concat([
        header,
        length,
        metadata
    ])

    // Replace EXIF only, not image frames.
    const output = await image.save(null, {
        exif
    })

    return {
        buffer: output,
        isAnimated
    }
}


// Convert audio/video into Opus
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
}


// Upload audio as WhatsApp voice message
async function uploadVoice(conn, file, seconds) {
    const output = path.join(
        TEMP_DIR,
        `${tempName()}.ogg`
    )

    try {
        const audio = await toOpus(
            file,
            output,
            seconds
        )

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


// Upload sticker without resizing or converting frames
async function uploadSticker(conn, originalBuffer) {
    const {
        buffer,
        isAnimated
    } = await addPackMetadata(originalBuffer)

    const { stickerMessage } = await prepareWAMessageMedia(
        {
            sticker: buffer,
            isAnimated
        },
        {
            upload: conn.waUploadToServer
        }
    )

    return stickerMessage
}


// Custom Baileys audio sticker message
function addAudioStickerFields() {
    const { Message } = proto

    if ('audioStickerMessage' in Message.prototype) {
        return
    }

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
                .encode(
                    m.audioMessage,
                    w.uint32(210).fork()
                )
                .ldelim()
        }

        return w
    }

    Message.prototype.audioStickerMessage = null
    Message.StickerMessage.prototype.audioMessage = null
}


// Send audio sticker
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


// Main command
cmd({
    pattern: 'astik',
    alias: [],
    desc: 'Create audio stickers and attach audio to stickers',
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

        // 1. Add saved audio to an existing sticker
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

            file = path.join(
                TEMP_DIR,
                `${tempName()}.webp`
            )

            const originalSticker = await quoted.download()

            if (!originalSticker || !originalSticker.length) {
                throw new Error('Could not download the original sticker.')
            }

            fs.writeFileSync(file, originalSticker)

            // Only EXIF changes. Original animation stays intact.
            const stickerMessage = await uploadSticker(
                conn,
                originalSticker
            )

            await sendAudioSticker(
                conn,
                from,
                stickerMessage,
                audioMessage
            )

            return
        }


        // 2. Save audio from voice note or song
        if (type === 'audioMessage') {
            file = path.join(
                TEMP_DIR,
                tempName()
            )

            const audio = await quoted.download()

            if (!audio || !audio.length) {
                throw new Error('Could not download the audio.')
            }

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


        // 3. Create audio sticker from video
        if (type === 'videoMessage') {
            file = path.join(
                TEMP_DIR,
                `${tempName()}.mp4`
            )

            const video = await quoted.download()

            if (!video || !video.length) {
                throw new Error('Could not download the video.')
            }

            fs.writeFileSync(file, video)

            // Original working video conversion
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
