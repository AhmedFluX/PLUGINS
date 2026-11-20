const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

const FOOTER = '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'

cmd({
    pattern: 'song',
    alias: [],
    desc: 'Download song from YouTube',
    category: 'download',
    fromMe: true,
    filename: __filename
}, async (conn, mek, m, context) => {
    const { from, q, reply } = context

    if (!q) {
        return reply(`*Example:* .song Shape of You\n\n${FOOTER}`)
    }

    try {
        await reply('🔎 Searching song...')

        const search = await yts(q)
        const video = search.videos?.[0]

        if (!video) {
            return reply(`❌ Song not found.\n\n${FOOTER}`)
        }

        const api = await axios.get(
            `https://api.sayan-nexuswork.workers.dev/music?query=${encodeURIComponent(video.url)}`,
            { timeout: 60000 }
        )

        const result = api.data?.result || api.data
        const audioUrl =
            result?.downloadUrl ||
            result?.download_url ||
            result?.audio ||
            result?.url ||
            result?.audioUrl ||
            result?.download?.url

        if (!audioUrl) {
            return reply(`❌ Audio download link not found.\n\n${FOOTER}`)
        }

        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${video.title}.mp3`,
            ptt: false
        }, { quoted: mek })

        await reply(FOOTER)

    } catch (error) {
        console.error('SONG ERROR:', error)
        return reply(`❌ Song download failed.\n\n${FOOTER}`)
    }
})
