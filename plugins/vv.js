
const { cmd } = require('../command')

const FOOTER = '*© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ*'

cmd({
    pattern: 'antivv',
    alias: ['viewonce'],
    desc: 'View and forward a replied view-once message',
    category: 'whatsapp',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { from, reply } = context

    try {
        if (!m.quoted) {
            return reply(
                `*Reply to a view-once image or video.*\n\n${FOOTER}`
            )
        }

        const quotedMsg = await m.getQuotedObj()

        if (!quotedMsg) {
            return reply(`❌ Quoted message not found.\n\n${FOOTER}`)
        }

        const type = quotedMsg.mtype

        if (![
            'viewOnceMessage',
            'viewOnceMessageV2',
            'imageMessage',
            'videoMessage',
            'audioMessage'
        ].includes(type)) {
            return reply(`❌ Please reply to a view-once media message.\n\n${FOOTER}`)
        }

        await conn.copyNForward(
            from,
            quotedMsg,
            true,
            { readViewOnce: true }
        )

        return reply(FOOTER)

    } catch (error) {
        console.error('VV ERROR:', error)
        return reply(`❌ Could not process this message.\n\n${FOOTER}`)
    }
})
