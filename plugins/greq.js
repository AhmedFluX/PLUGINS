const { cmd } = require('../command')

// Group Join Requests - List
cmd({
    pattern: 'greq',
    desc: 'List group join requests',
    category: 'group',
    react: '📋',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isAdmins, isBotAdmins }) => {
    try {
        if (!isGroup) return reply('❌ Yeh command sirf group mein chalegi.')
        if (!isAdmins) return reply('❌ Sirf group admin ye command use kar sakta hai.')
        if (!isBotAdmins) return reply('❌ Pehle bot ko admin banayein.')

        const result = await conn.groupRequestParticipantsList(from)

        if (!result || !result.length) {
            return reply(
`╭━━〔 📋 AHMED-MD GROUP REQUESTS 〕━━╮
┃
┃ ❌ No Pending Requests
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
            )
        }

        const list = result.map((u, i) => `┃ ${i + 1}. +${u.jid.split('@')[0]}`).join('\n')

        await reply(
`╭━━〔 📋 AHMED-MD GROUP REQUESTS 〕━━╮
┃
${list}
┃
┃ Total: ${result.length}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
        )

    } catch (e) {
        console.log('AHMED-MD GREQ ERROR:', e)
        reply(`❌ *Failed*\n\n${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
})

// Approve All
cmd({
    pattern: 'gacc',
    desc: 'Approve all group join requests',
    category: 'group',
    react: '✅',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isAdmins, isBotAdmins }) => {
    try {
        if (!isGroup) return reply('❌ Yeh command sirf group mein chalegi.')
        if (!isAdmins) return reply('❌ Sirf group admin ye command use kar sakta hai.')
        if (!isBotAdmins) return reply('❌ Pehle bot ko admin banayein.')

        const result = await conn.groupRequestParticipantsList(from)

        if (!result || !result.length) {
            return reply('❌ No Pending Requests.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        await conn.groupRequestParticipantsUpdate(from, result.map(u => u.jid), 'approve')

        await reply(
`╭━━〔 ✅ AHMED-MD 〕━━╮
┃
┃ ✅ Requests Approved
┃ Total: ${result.length}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
        )

    } catch (e) {
        console.log('AHMED-MD GACC ERROR:', e)
        reply(`❌ *Approve Failed*\n\n${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
})

// Reject All
cmd({
    pattern: 'grj',
    desc: 'Reject all group join requests',
    category: 'group',
    react: '❌',
    filename: __filename
}, async (conn, mek, m, { from, reply, isGroup, isAdmins, isBotAdmins }) => {
    try {
        if (!isGroup) return reply('❌ Yeh command sirf group mein chalegi.')
        if (!isAdmins) return reply('❌ Sirf group admin ye command use kar sakta hai.')
        if (!isBotAdmins) return reply('❌ Pehle bot ko admin banayein.')

        const result = await conn.groupRequestParticipantsList(from)

        if (!result || !result.length) {
            return reply('❌ No Pending Requests.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        await conn.groupRequestParticipantsUpdate(from, result.map(u => u.jid), 'reject')

        await reply(
`╭━━〔 ❌ AHMED-MD 〕━━╮
┃
┃ ❌ Requests Rejected
┃ Total: ${result.length}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
        )

    } catch (e) {
        console.log('AHMED-MD GRJ ERROR:', e)
        reply(`❌ *Reject Failed*\n\n${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
}) 
