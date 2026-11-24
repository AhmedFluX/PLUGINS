const { cmd } = require('../command')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

const FOOTER = '© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ'

async function getJson(url) {
    const res = await fetch(url)
    return await res.json()
}

cmd({
    pattern: 'lyrics',
    desc: 'Fetch lyrics of a song',
    category: 'general',
    react: '🎤',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, quoted }) => {
    try {
        let input = q || (quoted && quoted.text)

        if (!input) {
            return reply(
`🎤 *LYRICS*

*Example:*
.lyrics Pasoori
.lyrics Tum Se Hi

> ${FOOTER}`
            )
        }

        const status = await reply('🔍 Searching lyrics...')

        try {
            const suggestions = await getJson(`https://api.lyrics.ovh/suggest/${encodeURIComponent(input)}`)

            if (!suggestions.data || !suggestions.data.length) {
                throw new Error('Song not found. Naam sahi likh ke dobara try karein.')
            }

            const [song] = suggestions.data
            const lyricsData = await getJson(`https://api.lyrics.ovh/v1/${encodeURIComponent(song.artist.name)}/${encodeURIComponent(song.title)}`)

            if (!lyricsData.lyrics) {
                throw new Error('Is song ke lyrics nahi mile.')
            }

            const formattedLyrics = lyricsData.lyrics.replace(/\n{4,}/g, '\n\n\n').replace(/\n{2}/g, '\n')

            const output = `🎤 *${song.title}*\n👤 *Artist:* ${song.artist.name}\n\n${formattedLyrics}\n\n> ${FOOTER}`

            await reply(output)
            try { await conn.sendMessage(from, { delete: status.key }) } catch {}

        } catch (err) {
            await reply(`❌ *Error:* ${err.message}\n\n> ${FOOTER}`)
            try { await conn.sendMessage(from, { delete: status.key }) } catch {}
        }

    } catch (e) {
        console.log('AHMED-MD LYRICS ERROR:', e)
        reply(`❌ Failed: ${e.message}\n\n> ${FOOTER}`)
    }
})
