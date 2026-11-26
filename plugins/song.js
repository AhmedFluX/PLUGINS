const { cmd } = require('../command')
const axios = require('axios')
const yts = require('yt-search')

const isYouTube = (text) =>
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/i.test(text)

// 3 APIs - Ek fail to dusri chalegi
async function getAudioLink(videoUrl) {
    const apis = [
        // 1. Jawad - Purani wali (try with/without key)
        async () => {
            const res = await axios.get('https://jawadtechyt.vercel.app/ytmp3', {
                params: { url: videoUrl, key: 'EXTRA' },
                timeout: 60000
            })
            if (res.data?.downloadUrl) return res.data.downloadUrl
            if (res.data?.result?.download) return res.data.result.download
            if (res.data?.url) return res.data.url
            throw new Error('Jawad API no link')
        },
        // 2. Siputzx - Stable
        async () => {
            const res = await axios.get('https://api.siputzx.my.id/api/d/ytmp3', {
                params: { url: videoUrl },
                timeout: 60000
            })
            const d = res.data?.data
            if (d?.dl) return d.dl
            if (d?.download) return d.download
            throw new Error('Siputzx no link')
        },
        // 3. Vreden - Backup
        async () => {
            const res = await axios.get('https://api.vreden.my.id/api/ytmp3', {
                params: { url: videoUrl },
                timeout: 60000
            })
            const d = res.data?.result
            if (d?.download?.url) return d.download.url
            if (d?.download) return d.download
            throw new Error('Vreden no link')
        }
    ]

    let lastErr
    for (const fn of apis) {
        try {
            const link = await fn()
            if (link) return link
        } catch (e) {
            lastErr = e
            console.log('API FAILED, TRYING NEXT:', e.message)
        }
    }
    throw lastErr || new Error('All APIs failed')
}

async function musicHandler(conn, mek, m, { from, q, reply }) {
    if (!q) {
        return reply(
`╭━━〔 🎧 AHMED-MD 〕━━╮
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

        if (isYouTube(query)) {
            videoUrl = query
            const match = query.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/)
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

        if (!videoUrl) throw new Error('Could not identify the YouTube link.')

        const title = video?.title || 'Requested Song'
        const artist = video?.author?.name || 'Unknown Artist'
        const duration = video?.timestamp || 'Unknown'
        const thumbnail = video?.thumbnail

        // Reaction de do taake user ko pata chale kaam ho raha hai
        await conn.sendMessage(from, { react: { text: '🎧', key: mek.key } }).catch(()=>{})

        const downloadUrl = await getAudioLink(videoUrl)
        console.log('GOT AUDIO LINK:', downloadUrl)

        const audioResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 0,
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })

        const audio = Buffer.from(audioResponse.data)
        if (!audio.length) throw new Error('Audio is empty.')

        const caption = `╭━━〔 🎧 AHMED-MD 〕━━╮
┃
┃ 🎵 *${title}*
┃ 👤 *${artist}*
┃ ⏱️ *${duration}*
┃ 💿 *Format:* MP3
┃
╰━━━━━━━━━━━━━━━━━━━━╯

*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`

        if (thumbnail) {
            await conn.sendMessage(from, { image: { url: thumbnail }, caption }, { quoted: mek })
        } else {
            await conn.sendMessage(from, { text: caption }, { quoted: mek })
        }

        await conn.sendMessage(from, {
            audio,
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80)}.mp3`,
            ptt: false
        }, { quoted: mek })

    } catch (error) {
        console.error('MUSIC PLUGIN ERROR:', error?.response?.data || error.message)
        await reply(`❌ *Music Download Failed*\n\n${error.message || 'Please try again later.'}\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`)
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
