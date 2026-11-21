
const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

const API = 'https://jawadtechyt.vercel.app/ytmp3'
const API_KEY = 'EXTRA'
const MAX_SIZE = 20 * 1024 * 1024

const isYouTube = (text) =>
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/i.test(text)

async function musicHandler(conn, mek, m, { from, q, reply }) {
    if (!q) {
        return reply(
`╭━━〔 🎧 𝐀𝐇𝐌𝐄𝐃-𝐌𝐃 𝐌𝐔𝐒𝐈𝐂 〕━━╮
┃
┃ ✦ .song Song Name
┃ ✦ .song YouTube Link
┃ ✦ .play Song Name / Link
┃ ✦ .music Song Name / Link
┃
╰━━━━━━━━━━━━━━━━━━━━╯

*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`
        )
    }

    try {
        const query = q.trim()
        let video
        let videoUrl

        const status = await conn.sendMessage(from, {
            text: `╭━━〔 🎧 𝐀𝐇𝐌𝐄𝐃-𝐌𝐃 〕━━╮
┃
┃ 🔎 Searching song...
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: mek })

        // Search by YouTube link or song name
        if (isYouTube(query)) {
            videoUrl = query

            const match = query.match(
                /(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/
            )

            if (match) {
                video = await yts({ videoId: match[1] }).catch(() => null)
            }
        } else {
            const search = await yts(query)
            if (!search.videos || !search.videos.length) {
                throw new Error('No song found. Try another name.')
            }

            video = search.videos[0]
            videoUrl = video.url
        }

        if (!videoUrl) {
            throw new Error('Could not identify the YouTube link.')
        }

        const title = video?.title || 'Requested Song'
        const artist = video?.author?.name || 'Unknown Artist'
        const duration = video?.timestamp || 'Unknown'
        const thumbnail = video?.thumbnail

        await conn.sendMessage(from, {
            text: `╭━━〔 🎵 𝐒𝐎𝐍𝐆 𝐅𝐎𝐔𝐍𝐃 〕━━╮
┃
┃ 🎶 *Title:* ${title}
┃ 👤 *Artist:* ${artist}
┃ ⏱️ *Duration:* ${duration}
┃
┃ ⏳ Downloading MP3...
┃
╰━━━━━━━━━━━━━━━━━━━━╯`,
            edit: status.key
        })

        // Call your API
        const apiResponse = await axios.get(API, {
            params: {
                url: videoUrl,
                key: API_KEY
            },
            timeout: 60000
        })

        const data = apiResponse.data

        if (!data || data.success !== true || !data.downloadUrl) {
            throw new Error('Music API did not return an audio link.')
        }

        // Download MP3 from API's downloadUrl
        const audioResponse = await axios.get(data.downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 90000,
            maxContentLength: MAX_SIZE,
            maxBodyLength: MAX_SIZE
        })

        const audio = Buffer.from(audioResponse.data)

        if (!audio.length || audio.length > MAX_SIZE) {
            throw new Error('Audio is empty or larger than 20 MB.')
        }

        // Send song information
        const caption = `╭━━〔 🎧 𝐀𝐇𝐌𝐄𝐃-𝐌𝐃 〕━━╮
┃
┃ 🎵 *${title}*
┃ 👤 *${artist}*
┃ ⏱️ *${duration}*
┃ 💿 *Format:* MP3
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

        // Send audio
        await conn.sendMessage(from, {
            audio,
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80)}.mp3`,
            ptt: false
        }, { quoted: mek })

    } catch (error) {
        console.error('MUSIC PLUGIN ERROR:', error)

        await reply(
            `❌ *Music Download Failed*\n\n${error.message || 'Please try again later.'}\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`
        )
    }
}

for (const pattern of ['song', 'play', 'music']) {
    cmd({
        pattern,
        alias: [],
        desc: 'Search and download music',
        category: 'download',
        filename: __filename
    }, musicHandler)
}
