const { cmd } = require('../command')
const { textMaker } = require('../lib')

cmd({
    pattern: 'birthday',
    alias: [],
    desc: 'Create happy birthday image',
    category: 'textmaker',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { from, q, reply } = context

    try {
        if (!q)
            return reply('Give me text')

        const effect_url =
            'https://en.ephoto360.com/write-name-on-red-rose-birthday-cake-images-462.html'

        const { status, url } = await textMaker(effect_url, q)

        if (url) {
            await conn.sendMessage(
                from,
                {
                    image: { url },
                    caption: '*𝐇𝐀𝐏𝐏𝐘 𝐁𝐈𝐑𝐓𝐇𝐃𝐀𝐘*'
                },
                { quoted: mek }
            )
        } else {
            return reply('Unable to create birthday image. Please try again.')
        }

    } catch (error) {
        console.error('BIRTHDAY ERROR:', error)
        return reply('Something went wrong while creating birthday image.')
    }
})
