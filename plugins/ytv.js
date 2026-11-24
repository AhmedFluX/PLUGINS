const { cmd } = require('../command')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const FOOTER = '© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ'

function isUrl(str) {
    try { new URL(str); return true } catch { return false }
}

// ─── YouTube Search by Name ───
async function searchYouTube(query) {
    // 1. Try yt-search package (AHMED-MD me aksar pehle se hota hai)
    try {
        const yts = require('yt-search')
        const r = await yts(query)
        if (r && r.videos && r.videos.length) {
            return { url: r.videos[0].url, title: r.videos[0].title }
        }
    } catch (e) { console.log('yt-search fail:', e.message) }

    // 2. Backup - Invidious API
    try {
        const res = await fetch(`https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(query)}&type=video`)
        const json = await res.json()
        if (Array.isArray(json) && json.length) {
            const v = json[0]
            return { url: `https://youtu.be/${v.videoId}`, title: v.title }
        }
    } catch (e) { console.log('invidious search fail:', e.message) }

    return null
}

async function tryAPI(url, apiUrl, extractor) {
    try {
        const res = await fetch(apiUrl)
        if (!res.ok) return null
        const json = await res.json()
        const videoUrl = extractor(json)
        if (videoUrl && isUrl(videoUrl)) {
            return { url: videoUrl, title: json.title || json.result?.title || 'YouTube Video' }
        }
    } catch (e) {
        console.log(`API failed: ${apiUrl}`, e.message)
    }
    return null
}

cmd({
    pattern: 'ytv',
    desc: 'YouTube Video Downloader - By Link or Name',
    category: 'general',
    react: '📺',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        let input = q || (quoted && quoted.text)

        if (!input) {
            return reply(
`╭━━━━━•❥•━━━━━╮
   📺 𝖸𝖮𝖴𝖳𝖴𝖡𝖤 𝖵𝖨𝖣𝖤𝖮 📺
╰━━━━━•❥•━━━━━╯

*Example :*
.ytv <youtube link>
.ytv Pasoori
.ytv Arijit Singh Tum Se Hi

> ${FOOTER}`
            )
        }

        let url = input
        let searchTitle = ''

        // ✅ Agar link nahi hai, to naam se search karo
        if (!isUrl(input) || (!input.includes('youtube.com') && !input.includes('youtu.be'))) {
            const searching = await reply(`🔎 *Searching:* ${input}...`)
            const found = await searchYouTube(input)
            try { await conn.sendMessage(from, { delete: searching.key }) } catch {}
            if (!found) return reply(`❌ Koi video nahi mila: *${input}*\n\n> ${FOOTER}`)
            url = found.url
            searchTitle = found.title
        }

        const statusMsg = await reply('⏳ Downloading YouTube video... (Trying multiple sources)')

        try {
            let result = null

            result = await tryAPI(
                url,
                `https://btch-downloader-api-green.vercel.app/api/download/youtube?url=${encodeURIComponent(url)}`,
                (json) => json.result?.link || json.result?.mp4 || json.result?.url || json.normalized?.media?.[0]?.url
            )

            if (!result) {
                result = await tryAPI(
                    url,
                    `https://api.nexoracle.com/downloader/ytmp4?apikey=free&url=${encodeURIComponent(url)}`,
                    (json) => json.result?.url || json.result?.link
                )
            }

            if (!result) {
                throw new Error('All download sources failed. Video age-restricted / private ho sakta hai ya API down hai.')
            }

            const caption = `📺 *${result.title || searchTitle || 'YouTube Video'}*\n\n> ${FOOTER}`

            await conn.sendMessage(from, { video: { url: result.url }, caption, mimetype: 'video/mp4' }, { quoted: mek })
            try { await conn.sendMessage(from, { delete: statusMsg.key }) } catch (e) {}

        } catch (err) {
            console.error('YT Video Error:', err)
            await reply(`❌ *Download failed!*\n\n*Reason:* ${err.message}\n\n> ${FOOTER}`)
            try { await conn.sendMessage(from, { delete: statusMsg.key }) } catch (e) {}
        }

    } catch (e) {
        console.log('AHMED-MD YTV ERROR:', e)
        reply(`❌ Failed: ${e.message}\n\n> ${FOOTER}`)
    }
})
