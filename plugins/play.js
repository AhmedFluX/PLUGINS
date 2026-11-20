
const { cmd } = require('../command')
const axios = require('axios')

const POWERED_BY = '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'

cmd({
    pattern: 'play',
    alias: ['music'],
    desc: 'Search and download music',
    category: 'download',
    react: '🎵',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(`Please provide a song name.\nExample: .play Believer\n\n${POWERED_BY}`)
        }

        await reply('⏳ Searching your song...')

        const apiUrl = `https://api.sayan-nexuswork.workers.dev/music?query=${encodeURIComponent(q)}`
        const { data } = await axios.get(apiUrl, { timeout: 60000 })

        if (!data) {
            return reply(`❌ No response from music API.\n\n${POWERED_BY}`)
        }

        const result = data.result || data.data || data

        const audioUrl =
            result.downloadUrl ||
            result.download_url ||
            result.audio ||
            result.url ||
            result.download?.url ||
            result.audioUrl

        const title = result.title || result.name || q
        const thumbnail = result.thumbnail || result.image || ''

        if (!audioUrl) {
            console.log('PLAY API RESPONSE:', data)
            return reply(`❌ Audio link not found in API response.\n\n${POWERED_BY}`)
        }

        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            ptt: false,
            contextInfo: {
                externalAdReply: {
                    title: title,
                    body: 'POWERED BY AHMED-MD',
                    thumbnailUrl: thumbnail || undefined,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: mek })

    } catch (error) {
        console.error('PLAY ERROR:', error)
        return reply(`❌ Music download failed: ${error.message}\n\n${POWERED_BY}`)
    }
})
