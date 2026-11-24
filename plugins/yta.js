const { cmd } = require('../command')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const FOOTER = '© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ'

function isUrl(str) {
    try { new URL(str); return true } catch { return false }
}

async function getBuffer(url) {
    const res = await fetch(url)
    if (!res.ok) return null
    return Buffer.from(await res.arrayBuffer())
}

const AUDIO_APIS = [
  {
    name: 'Siputzx',
    url: (u) => `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(u)}`,
    extract: (j) => j.data?.url || j.data?.dl || j.result?.url
  },
  {
    name: 'Nexoracle',
    url: (u) => `https://api.nexoracle.com/downloader/ytmp3?apikey=free&url=${encodeURIComponent(u)}`,
    extract: (j) => j.result?.url || j.result?.dlink || j.result?.link
  },
  {
    name: 'Ryzendesu',
    url: (u) => `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(u)}`,
    extract: (j) => j.result?.url || j.url || j.result?.link
  },
  {
    name: 'Akuari',
    url: (u) => `https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(u)}`,
    extract: (j) => j.result?.audio || j.result?.mp3 || j.result?.link
  },
  {
    name: 'BTCH',
    url: (u) => `https://btch-downloader-api-green.vercel.app/api/download/youtube?url=${encodeURIComponent(u)}`,
    extract: (j) => j.result?.audio || j.normalized?.media?.[0]?.url || j.result?.link
  }
]

async function searchYouTube(query) {
  try {
    // 1. Siputzx Search
    const res = await fetch(`https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`)
    const json = await res.json()
    if (json.status && json.data && json.data.length > 0) {
      return { url: json.data[0].url, title: json.data[0].title }
    }
  } catch (e) { console.log('Search failed:', e.message) }

  // 2. Backup - yt-search
  try {
    const yts = require('yt-search')
    const r = await yts(query)
    if (r && r.videos && r.videos.length) {
      return { url: r.videos[0].url, title: r.videos[0].title }
    }
  } catch (e) { console.log('yt-search fail:', e.message) }

  return null
}

async function fetchAudio(ytUrl) {
  for (const api of AUDIO_APIS) {
    try {
      console.log(`[YTA] Trying ${api.name}...`)
      const res = await fetch(api.url(ytUrl))
      if (!res.ok) continue
      const json = await res.json()
      const audioUrl = api.extract(json)
      if (audioUrl && isUrl(audioUrl)) {
        console.log(`[YTA] ✅ ${api.name} worked!`)
        return {
          url: audioUrl,
          title: json.result?.title || json.title || json.data?.title || 'YouTube Audio',
          thumb: json.result?.thumbnail || json.thumbnail || json.data?.thumbnail || null
        }
      }
    } catch (e) {
      console.log(`[YTA] ❌ ${api.name} failed:`, e.message)
    }
  }
  return null
}

cmd({
    pattern: 'yta',
    desc: 'Download YouTube Audio - By Link or Name',
    category: 'general',
    react: '🎵',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        let input = q || (quoted && quoted.text)

        if (!input) {
            return reply(`*Example :*\n.yta Saiyaara\n.yta <youtube link>\n\n> ${FOOTER}`)
        }

        const statusMsg = await reply('🔍 Processing your request...')

        try {
            let ytUrl = input.trim()
            let videoTitle = 'YouTube Audio'

            // Step 1: Agar link nahi hai to search karo
            if (!isUrl(ytUrl) || (!ytUrl.includes('youtube.com') && !ytUrl.includes('youtu.be'))) {
                await reply(`🔍 Searching YouTube for "${input}"...`)
                const search = await searchYouTube(input)
                if (!search) throw new Error('Song not found. Please try a different name.')
                ytUrl = search.url
                videoTitle = search.title
            }

            await reply('⬇️ Downloading Audio... (Trying multiple sources)')

            // Step 2: Audio URL
            const audioData = await fetchAudio(ytUrl)
            if (!audioData) {
                throw new Error('All audio sources failed. YouTube API servers are down right now. Please try again after some time.')
            }

            if (audioData.title && audioData.title !== 'YouTube Audio') {
                videoTitle = audioData.title
            }

            // Step 3: Audio Buffer
            const audioBuffer = await getBuffer(audioData.url)
            if (!audioBuffer) {
                throw new Error('Audio file download failed. Please try again.')
            }

            // Step 4: Audio Send
            const caption = `🎵 *${videoTitle}*\n\n> ${FOOTER}`
            const cleanName = videoTitle.replace(/[^a-zA-Z0-9 ]/g, '') || 'AHMED-MD'

            await conn.sendMessage(from, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                fileName: `${cleanName}-AHMED.mp3`,
                caption: caption
            }, { quoted: mek })

            try { await conn.sendMessage(from, { delete: statusMsg.key }) } catch (e) {}

        } catch (err) {
            console.error('YTA Error:', err)
            await reply(`❌ *Error:* ${err.message}\n\n> ${FOOTER}`)
            try { await conn.sendMessage(from, { delete: statusMsg.key }) } catch (e) {}
        }

    } catch (e) {
        console.log('AHMED-MD YTA ERROR:', e)
        reply(`❌ Failed: ${e.message}\n\n> ${FOOTER}`)
    }
})
