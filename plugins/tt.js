const { cmd } = require('../command')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const FOOTER = '© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ'

function isUrl(str) {
    try { new URL(str); return true } catch { return false }
}

cmd({
    pattern: 'tt',
    desc: 'TikTok Downloader - No Watermark HD',
    category: 'general',
    react: '🎵',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        let url = q || (quoted && quoted.text)

        if (!url || !isUrl(url) || !url.includes('tiktok.com')) {
            return reply(
`╭━━━━━•❥•━━━━━╮
   🎵 𝖳𝖨𝖪𝖳𝖮𝖪 𝖣𝖫 🎵
╰━━━━━•❥•━━━━━╯

*Example :*
.tt <tiktok link>

> ${FOOTER}`
            )
        }

        const statusMsg = await reply('⏳ Downloading TikTok video...')

        try {
            // TikWM API (No watermark HD video)
            const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`
            const res = await fetch(apiUrl)
            const json = await res.json()

            if (json.code !== 0 || !json.data) {
                throw new Error('Failed to fetch video. Link might be invalid or private.')
            }

            const videoUrl = json.data.play || json.data.hdplay || json.data.wmplay
            const title = json.data.title || 'TikTok Video'
            const author = json.data.author?.nickname || 'Unknown'
            const music = json.data.music_info?.title || 'Original Audio'

            const caption = `🎵 *${title}*\n\n👤 *Author:* ${author}\n🎧 *Music:* ${music}\n\n> ${FOOTER}`

            await conn.sendMessage(from, { video: { url: videoUrl }, caption, mimetype: 'video/mp4' }, { quoted: mek })

            try { await conn.sendMessage(from, { delete: statusMsg.key }) } catch (e) {}

        } catch (err) {
            console.error('TikTok DL Error:', err)
            await reply(`❌ *Download failed!*\n\n*Reason:* ${err.message}\n\n> ${FOOTER}`)
            try { await conn.sendMessage(from, { delete: statusMsg.key }) } catch (e) {}
        }

    } catch (e) {
        console.log('AHMED-MD TT ERROR:', e)
        reply(`❌ Failed: ${e.message}\n\n> ${FOOTER}`)
    }
})
