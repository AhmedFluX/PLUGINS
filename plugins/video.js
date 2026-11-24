const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

cmd({
    pattern: 'video',
    alias: ['vid', 'playvideo'],
    desc: 'Download YouTube Video',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {

    try {
        const text = q?.trim()

        if (!text) {
            return reply(
`╭━━〔 🎬 AHMED-MD 〕━━╮
┃
┃ ✦ .video Video Name
┃ ✦ .video YouTube Link
┃ ✦ .vid Video Name
┃
╰━━━━━━━━━━━━━━━━━━━━╯

*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`
            )
        }

        // YouTube Search
        const search = await yts(text)

        if (!search.videos || !search.videos.length) {
            return reply('❌ No video found. Try another name.')
        }

        const vid = search.videos[0]

        // Video API - NO LIMIT
        const api = `https://arslan-apis-v2.vercel.app/download/ytmp4?url=${encodeURIComponent(vid.url)}`

        const res = await axios.get(api, {
            timeout: 0,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        })

        if (
            !res.data ||
            !res.data.status ||
            !res.data.result ||
            !res.data.result.download ||
            !res.data.result.download.url
        ) {
            return reply('❌ Video API failed. Try again.')
        }

        const videoUrl = res.data.result.download.url
        const title = res.data.result.metadata?.title || vid.title
        const artist = vid.author?.name || 'Unknown'
        const duration = vid.timestamp || 'Unknown'
        const thumbnail = vid.thumbnail

        // YE WALA OUTPUT - THUMBNAIL KE SATH (Song wali tarah)
        const caption = `╭━━〔 🎬 AHMED-MD 〕━━╮
┃
┃ 🎬 *${title}*
┃ 👤 *${artist}*
┃ ⏱️ *${duration}*
┃ 💿 *Format:* MP4
┃
╰━━━━━━━━━━━━━━━━━━━━╯

*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`

        if (thumbnail) {
            await conn.sendMessage(from, {
                image: { url: thumbnail },
                caption
            }, { quoted: mek })
        } else {
            await conn.sendMessage(from, {
                text: caption
            }, { quoted: mek })
        }

        // USKE NEECHE DIRECT VIDEO
        await conn.sendMessage(from, {
            video: { url: videoUrl },
            mimetype: 'video/mp4',
            fileName: `${title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80)}.mp4`,
            caption: `🎬 *${title}*\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`
        }, { quoted: mek })

    } catch (err) {
        console.log('AHMED-MD VIDEO ERROR:', err)
        reply(`❌ *Video Download Failed*\n\n${err.message || 'Please try again later.'}\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`)
    }
})
