
const { cmd } = require('../command')

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

cmd({
    pattern: 'readmore',
    alias: [],
    desc: 'Add Readmore to text',
    category: 'misc',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { from, q, reply } = context

    if (!q) {
        return reply('Example: .readmore Hi readmore hello')
    }

    const readmoreText = q.replace(/readmore/gi, readMore)

    try {
        await conn.sendMessage(
            from,
            { text: readmoreText },
            { quoted: mek }
        )
    } catch (error) {
        console.error('READMORE ERROR:', error)
        return reply('❌ Error.')
    }
})
