
const { cmd } = require('../command')

const possibleReplies = [
    'send', 'snd', 'sent', 'snt', 'ayak',
    'sd', 'st', 'ayakko', 'cent', 'cnt', 'cend'
]

cmd({
    on: 'body',
    filename: __filename
}, async (conn, message, store, { from, body, isGroup }) => {
    try {
        if (isGroup || !body) return

        const text = body.trim().toLowerCase()
        if (!possibleReplies.includes(text)) return

        const quoted = message.quoted
        if (!quoted) return

        const statusJid = quoted.key?.remoteJid ||
            quoted.remoteJid

        if (statusJid !== 'status@broadcast') return

        await conn.copyNForward(from, quoted, true)

    } catch (error) {
        console.error('ASTATUS ERROR:', error)
    }
})
