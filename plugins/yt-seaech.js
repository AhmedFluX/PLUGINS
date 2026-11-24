const { cmd } = require('../command')
const yts = require('yt-search')

cmd({
    pattern: 'yts',
    alias: ['ytsearch'],
    desc: 'Search and get details from YouTube.',
    category: 'search',
    react: '🔎',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) {
            return reply(
`╭━━〔 🔎 AHMED-MD YTS 〕━━╮
┃
┃ ✦ .yts Song / Video Name
┃
╰━━━━━━━━━━━━━━━━━━━━╯

*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`
            )
        }

        const search = await yts(q)
        const results = search.all.slice(0, 10)

        if (!results.length) {
            return reply('❌ No results found. Try another name.')
        }

        let mesaj = `╭━━〔 🔎 AHMED-MD YTS 〕━━╮
┃
┃ 🔍 *Results for:* ${q}
┃
`

        results.forEach((video, i) => {
            mesaj += `┃
┃ *${i + 1}. ${video.title}*
┃ 🔗 ${video.url}
┃ ⏱️ ${video.timestamp} | 👀 ${video.views} views
`
        })

        mesaj += `┃
╰━━━━━━━━━━━━━━━━━━━━╯

*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`

        await conn.sendMessage(from, { text: mesaj }, { quoted: mek })

    } catch (e) {
        console.log('AHMED-MD YTS ERROR:', e)
        reply(`❌ *Search Failed*\n\n${e.message || 'Please try again later.'}\n\n*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*`)
    }
})
