const { cmd } = require('../command')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const FOOTER = '© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ'

function isUrl(str) {
    try { new URL(str); return true } catch { return false }
}

cmd({
    pattern: 'ig',
    desc: 'Instagram Downloader - Reel / Photo / Carousel',
    category: 'general',
    react: '📸',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        let url = q || (quoted && quoted.text)

        if (!url || !isUrl(url) || !url.includes('instagram.com')) {
            return reply(
`╭━━━━━•❥•━━━━━╮
   📸 𝖨𝖭𝖲𝖳𝖠𝖦𝖱𝖠𝖬 𝖣𝖫 📸
╰━━━━━•❥•━━━━━╯

*Example :*
.ig <instagram link>

> ${FOOTER}`
            )
        }

        const statusMsg = await reply('⏳ Downloading Instagram media...')

        try {
            const apiUrl = `https://btch-downloader-api-green.vercel.app/api/download/instagram?url=${encodeURIComponent(url)}`
            const res = await fetch(apiUrl)
            const json = await res.json()

            if (!json.success || !json.normalized || !json.normalized.media) {
                throw new Error(json.error?.message || 'Failed to fetch media. Account might be private.')
            }

            const medias = json.normalized.media

            for (let item of medias) {
                const mediaUrl = item.url
                const caption = `> ${FOOTER}`

                // Photo hai ya Video - type se pata chalega
                const isVideo = item.type === 'video' || mediaUrl.includes('.mp4') || mediaUrl.includes('video')

                if (isVideo) {
                    await conn.sendMessage(from, { video: { url: mediaUrl }, caption, mimetype: 'video/mp4' }, { quoted: mek })
                } else {
                    await conn.sendMessage(from, { image: { url: mediaUrl }, caption }, { quoted: mek })
                }

                // Thoda delay taake WhatsApp block na kare
                await new Promise(r => setTimeout(r, 1500))
            }

            try { await conn.sendMessage(from, { delete: statusMsg.key }) } catch (e) {}

        } catch (err) {
            console.error('IG DL Error:', err)
            await reply(`❌ *Download failed!*\n\n*Reason:* ${err.message}\n\n> ${FOOTER}`)
            try { await conn.sendMessage(from, { delete: statusMsg.key }) } catch (e) {}
        }

    } catch (e) {
        console.log('AHMED-MD IG ERROR:', e)
        reply(`❌ Failed: ${e.message}\n\n> ${FOOTER}`)
    }
})
