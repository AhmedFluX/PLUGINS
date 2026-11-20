
const { cmd } = require('../command')

let savedMessage = null

cmd({
    pattern: 'setfa',
    alias: [],
    desc: 'Save a replied message for forwarding',
    category: 'utility',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { quoted, reply } = context

    if (!quoted) {
        return reply('Reply to a message to save it for forwarding!')
    }

    savedMessage = quoted
    return reply('Message saved for forwarding.')
})

cmd({
    pattern: 'fa',
    alias: [],
    desc: 'Forward the saved message to this chat',
    category: 'utility',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { from, reply } = context

    if (!savedMessage) {
        return reply('No message has been set. Use .setfa first.')
    }

    try {
        await conn.copyNForward(from, savedMessage, true)
        return reply('Message forwarded successfully.')
    } catch (error) {
        console.error('FA ERROR:', error)
        return reply('Failed to forward the saved message.')
    }
})

cmd({
    pattern: 'seefa',
    alias: [],
    desc: 'View the saved message',
    category: 'utility',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { reply } = context

    if (!savedMessage) {
        return reply('No message has been set yet.')
    }

    const text =
        savedMessage.text ||
        savedMessage.message?.conversation ||
        savedMessage.message?.extendedTextMessage?.text ||
        'Saved message contains media or no text.'

    return reply(`*Current saved message:*\n${text}`)
})
