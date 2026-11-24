const { cmd } = require('../command')
const axios = require('axios')

cmd({
    pattern: 'stik',
    desc: 'Tenor Animated Stickers',
    category: 'fun',
    react: '🎭',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const input = (q || '').trim()

        if (!input) {
            return reply(
`╭━━〔 🎭 AHMED-MD STICKER SEARCH 〕━━╮
┃
┃ ✦ Usage: .stik Keyword
┃
┃ Examples:
┃ ➤ .stik cat dancing
┃ ➤ .stik funny meme
┃ ➤ .stik love, 3
┃ ➤ .stik anime, 5
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
            )
        }

        const parts = input.split(',')
        const query = parts[0].trim()
        const requested = Number((parts[1] || '').trim())
        const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, 5) : 1

        if (!query) return reply('❌ Keyword likho pehle.')

        const url = `https://g.tenor.com/v1/search?q=${encodeURIComponent(query)}&key=LIVDSRZULELA&limit=${limit}`

        const { data } = await axios.get(url, { timeout: 30000 })
        const results = data?.results || []

        if (!results.length) {
            return reply('😕 Koi sticker nahi mila.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        await reply(`🎭 *Sticker Search*\n🔎 *Keyword:* ${query}\n⏳ Bhej raha hoon...\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)

        let sent = 0

        for (const item of results) {
            try {
                // Tenor me pehle gif, phir mp4 try karo
                const videoUrl = item.media?.[0]?.mp4?.url || item.media?.[0]?.gif?.url
                if (!videoUrl) continue

                await conn.sendMessage(from, { sticker: { url: videoUrl } }, { quoted: mek })
                sent++
            } catch (e) {
                console.log('AHMED-MD STIK SKIP:', e.message)
            }
        }

        if (!sent) return reply('❌ Sticker convert nahi hua.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')

        await reply(`✅ Stickers Sent: ${sent}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)

    } catch (e) {
        console.log('AHMED-MD STIK ERROR:', e.message)
        reply(`❌ *Search Failed*\n\nBaad me try karo.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
}) 
