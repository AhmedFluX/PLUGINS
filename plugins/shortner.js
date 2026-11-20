const { cmd } = require('../command')

cmd({
    pattern: 'shortner',
    alias: [],
    desc: 'Shorten a given URL',
    category: 'utility',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { from, q, reply } = context

    if (!q) {
        return reply(
            '> *Example:*\n' +
            '- .shortner https://mantrikaflow.blogspot.com\n' +
            '- .shortner https://example.com'
        )
    }

    const longUrl = q.trim()

    try {
        const parsedUrl = new URL(longUrl)

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return reply('❌ Please provide a valid HTTP/HTTPS URL.')
        }

        const response = await fetch(
            `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`
        )

        if (!response.ok) {
            throw new Error('TinyURL API failed')
        }

        const shortUrl = (await response.text()).trim()

        if (!shortUrl.startsWith('https://tinyurl.com/')) {
            throw new Error('Invalid shortened URL')
        }

        await reply(`✅ *Shortened URL:*\n${shortUrl}`)

    } catch (error) {
        console.error('SHORTNER ERROR:', error)
        await reply('❌ Error: Unable to shorten the link. Try again later.')
    }
})
