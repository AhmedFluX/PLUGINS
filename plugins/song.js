
const { cmd } = require('../command')

const MAX_SIZE = 20 * 1024 * 1024

async function musicHandler(conn, mek, m, context) {
    const { from, q, reply } = context

    if (!q) {
        return reply(
            '╭━━〔 🎧 MUSIC DOWNLOADER 〕━━╮\n' +
            '┃\n' +
            '┃ ✦ Example:\n' +
            '┃ .song https://your-authorized-audio-url.mp3\n' +
            '┃ .play https://your-authorized-audio-url.mp3\n' +
            '┃ .music https://your-authorized-audio-url.mp3\n' +
            '┃\n' +
            '╰━━━━━━━━━━━━━━━━━━━━╯\n\n' +
            '*Send an audio URL you own or have permission to use.*'
        )
    }

    try {
        const url = new URL(q.trim())

        if (!['http:', 'https:'].includes(url.protocol)) {
            return reply('❌ Invalid audio URL.')
        }

        await reply('╭━━〔 🎧 AHMЕD-MD MUSIC 〕━━╮\n┃\n┃ ⏳ Processing audio...\n╰━━━━━━━━━━━━━━━━━━━━╯')

        const response = await fetch(url.href, {
            signal: AbortSignal.timeout(30000)
        })

        if (!response.ok) {
            throw new Error('Audio server returned an error.')
        }

        const type = response.headers.get('content-type') || ''

        if (!type.startsWith('audio/')) {
            throw new Error('URL does not contain a direct audio file.')
        }

        const length = Number(response.headers.get('content-length') || 0)

        if (length > MAX_SIZE) {
            throw new Error('Audio file is larger than 20 MB.')
        }

        const buffer = Buffer.from(await response.arrayBuffer())

        if (!buffer.length || buffer.length > MAX_SIZE) {
            throw new Error('Invalid or oversized audio file.')
        }

        const mimetype = type.split(';')[0] || 'audio/mpeg'

        await conn.sendMessage(from, {
            text:
                '╭━━〔 🎵 NOW PLAYING 〕━━╮\n' +
                '┃\n' +
                '┃ ✦ Audio ready\n' +
                '┃ ✦ Format: ' + mimetype + '\n' +
                '┃ ✦ Size: ' + (buffer.length / 1024 / 1024).toFixed(2) + ' MB\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━━━━━━━╯\n\n' +
                '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'
        }, { quoted: mek })

        await conn.sendMessage(from, {
            audio: buffer,
            mimetype,
            ptt: false,
            fileName: 'AHMED-MD-MUSIC.mp3'
        }, { quoted: mek })

    } catch (error) {
        console.error('MUSIC ERROR:', error)
        return reply('❌ Unable to process this audio URL. Please check the link and try again.')
    }
}

for (const pattern of ['song', 'play', 'music']) {
    cmd({
        pattern,
        alias: [],
        desc: 'Send an authorized audio file',
        category: 'download',
        filename: __filename
    }, musicHandler)
}
