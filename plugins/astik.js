
const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')
const ffmpeg = require('fluent-ffmpeg')
const WebP = require('node-webpmux')

const { cmd } = require('../command')
const {
  proto,
  prepareWAMessageMedia
} = require('@whiskeysockets/baileys')

// SETTINGS
const PACKNAME = '— ˹˱𝐀𝅦 𝐇𝅦 𝐌𝅦 𝟑𝅦 𝐃𝅦˲˺ • 率'
const AUTHOR = 'AHMED'
const STICKER_SECONDS = 35

const TEMP_DIR = path.join(os.tmpdir(), 'ahmed-md-astik')

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

const saved = new Map()

const tempName = (ext = '') =>
  path.join(
    TEMP_DIR,
    `astik-${crypto.randomBytes(6).toString('hex')}${ext}`
  )

// AUDIO STICKER PROTO PATCH
const addAudioStickerFields = (proto) => {
  const { Message } = proto

  if ('audioStickerMessage' in Message.prototype) return

  const encodeMessage = Message.encode

  Message.encode = function encode(m, w) {
    w = encodeMessage.call(this, m, w)

    if (m.audioStickerMessage != null) {
      Message.FutureProofMessage
        .encode(m.audioStickerMessage, w.uint32(1074).fork())
        .ldelim()
    }

    return w
  }

  const encodeSticker = Message.StickerMessage.encode

  Message.StickerMessage.encode = function encode(m, w) {
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

// ADD REAL WHATSAPP STICKER METADATA
const addPackMetadata = async (buffer) => {
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    throw new Error('Invalid sticker buffer')
  }

  const input = tempName('.webp')
  const output = tempName('-metadata.webp')

  try {
    fs.writeFileSync(input, buffer)

    const img = new WebP.Image()
    await img.load(input)

    const metadata = {
      'sticker-pack-id': 'com.ahmedmd.stickers',
      'sticker-pack-name': PACKNAME,
      'sticker-pack-publisher': AUTHOR,
      emojis: ['']
    }

    const jsonBuffer = Buffer.from(
      JSON.stringify(metadata),
      'utf8'
    )

    const exifHeader = Buffer.from([
      0x49, 0x49, 0x2a, 0x00,
      0x08, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x16, 0x00,
      0x00, 0x00
    ])

    const exif = Buffer.concat([
      exifHeader,
      jsonBuffer
    ])

    exif.writeUIntLE(jsonBuffer.length, 14, 4)

    img.exif = exif

    await img.save(output)

    const result = fs.readFileSync(output)

    if (!result.length) {
      throw new Error('Metadata output is empty')
    }

    return result
  } finally {
    fs.rmSync(input, { force: true })
    fs.rmSync(output, { force: true })
  }
}

// CONVERT VIDEO TO ANIMATED WEBP
const videoToWebp = async (input, output) => {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .noAudio()
      .videoCodec('libwebp')
      .outputOptions([
        '-vf',
        'fps=15,scale=512:512:force_original_aspect_ratio=decrease:flags=lanczos,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
        '-loop', '0',
        '-an',
        '-vsync', '0',
        '-q:v', '50',
        '-preset', 'default',
        '-f', 'webp'
      ])
      .on('error', (err) => {
        reject(new Error(`Video conversion failed: ${err.message}`))
      })
      .on('end', () => {
        try {
          const result = fs.readFileSync(output)

          if (!result.length) {
            return reject(new Error('Video conversion returned empty data'))
          }

          resolve(result)
        } catch (err) {
          reject(err)
        }
      })
      .save(output)
  })
}

// CONVERT AUDIO TO OPUS
const toOpus = async (input, output, seconds) => {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(input)
      .noVideo()
      .outputOptions([
        '-map 0:a:0',
        '-map_metadata -1',
        '-c:a libopus',
        '-ac 1',
        '-ar 48000',
        '-b:a 64k',
        '-f ogg'
      ])

    if (seconds) command.duration(seconds)

    command
      .on('error', (err) => {
        reject(new Error(`Audio conversion failed: ${err.message}`))
      })
      .on('end', () => {
        try {
          const audio = fs.readFileSync(output)

          if (!audio.length) {
            return reject(new Error('Audio output is empty'))
          }

          resolve(audio)
        } catch (err) {
          reject(err)
        }
      })
      .save(output)
  })
}

// UPLOAD AUDIO
const uploadVoice = async (conn, input, seconds) => {
  const output = tempName('.ogg')

  try {
    const audio = await toOpus(input, output, seconds)

    const prepared = await prepareWAMessageMedia(
      {
        audio,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      },
      {
        upload: conn.waUploadToServer
      }
    )

    if (!prepared?.audioMessage) {
      throw new Error('Audio upload failed')
    }

    return prepared.audioMessage
  } finally {
    fs.rmSync(output, { force: true })
  }
}

// UPLOAD STICKER WITH PACK NAME
const uploadSticker = async (conn, buffer) => {
  const sticker = await addPackMetadata(buffer)

  const prepared = await prepareWAMessageMedia(
    { sticker },
    {
      upload: conn.waUploadToServer
    }
  )

  if (!prepared?.stickerMessage) {
    throw new Error('Sticker upload failed')
  }

  return prepared.stickerMessage
}

// SEND AUDIO STICKER
const sendAudioSticker = async (
  conn,
  from,
  stickerMessage,
  audioMessage
) => {
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
    {}
  )
}

// MAIN COMMAND
cmd(
  {
    pattern: 'astik',
    alias: ['asticker'],
    desc: 'Create audio stickers',
    category: 'sticker'
  },
  async (conn, mek, m, { from, reply }) => {
    const quoted = m.quoted

    try {
      await conn.sendMessage(from, {
        react: {
          text: '🔖',
          key: mek.key
        }
      })

      if (!quoted) {
        return reply(
          'Reply to a video with .astik to create an audio sticker.\n\n' +
          'Reply to an audio or voice note with .astik to save its audio.\n' +
          'Then reply to a sticker with .astik to add the saved audio.'
        )
      }

      addAudioStickerFields(proto)

      const key = `${from}:${m.sender}`
      const type = quoted.mtype || ''

      // REPLY TO STICKER
      if (type === 'stickerMessage') {
        const audioMessage = saved.get(key)

        if (!audioMessage) {
          return reply(
            'No saved audio found.\nFirst reply to a voice note or song with .astik.'
          )
        }

        const media = await quoted.download()

        if (!Buffer.isBuffer(media) || !media.length) {
          throw new Error('Could not download sticker')
        }

        const stickerMessage = await uploadSticker(conn, media)

        return await sendAudioSticker(
          conn,
          from,
          stickerMessage,
          audioMessage
        )
      }

      // REPLY TO AUDIO / VOICE
      if (type === 'audioMessage' || type === 'pttMessage') {
        const input = tempName()

        try {
          const media = await quoted.download()

          if (!Buffer.isBuffer(media) || !media.length) {
            throw new Error('Could not download audio')
          }

          fs.writeFileSync(input, media)

          saved.set(
            key,
            await uploadVoice(conn, input)
          )

          return reply(
            'Audio saved successfully!\nNow reply to any sticker with .astik.'
          )
        } finally {
          fs.rmSync(input, { force: true })
        }
      }

      // REPLY TO VIDEO
      if (type === 'videoMessage') {
        const input = tempName()
        const webpOutput = tempName('.webp')

        try {
          const media = await quoted.download()

          if (!Buffer.isBuffer(media) || !media.length) {
            throw new Error('Could not download video')
          }

          fs.writeFileSync(input, media)

          // Extract video audio
          const audioMessage = await uploadVoice(
            conn,
            input,
            STICKER_SECONDS
          )

          // Convert video to animated WebP
          const webp = await videoToWebp(
            input,
            webpOutput
          )

          // Add AHMED-MD pack metadata
          const stickerMessage = await uploadSticker(
            conn,
            webp
          )

          return await sendAudioSticker(
            conn,
            from,
            stickerMessage,
            audioMessage
          )
        } finally {
          fs.rmSync(input, { force: true })
          fs.rmSync(webpOutput, { force: true })
        }
      }

      return reply(
        'Reply to a video, audio, voice note or sticker.'
      )

    } catch (err) {
      console.error('ASTIK ERROR:', err)

      return reply(
        `❌ *ASTIK ERROR*\n\n${err.message || 'Unknown error'}`
      )
    }
  }
)
