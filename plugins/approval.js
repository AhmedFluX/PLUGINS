const { cmd } = require('../command')

cmd({
    pattern: 'approval',
    desc: 'Approve pending join requests',
    category: 'group',
    react: '✅',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isGroup, isAdmins, isBotAdmins }) => {
    try {
        if (!isGroup) return reply('❌ Yeh command sirf group me chalegi.')
        if (!isAdmins) return reply('❌ Sirf group admin ye command use kar sakta hai.')
        if (!isBotAdmins) return reply('❌ Pehle bot ko admin banayein.')

        const input = (q || '').trim().toLowerCase()

        const requests = await conn.groupRequestParticipantsList(from)

        if (!requests || requests.length === 0) {
            return reply(
`╭━━〔 ✅ AHMED-MD APPROVAL 〕━━╮
┃
┃ 📋 Request Status: No Pending Requests
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
            )
        }

        let limit

        if (input === 'all') {
            limit = requests.length
        } else {
            limit = parseInt(input, 10)

            if (!Number.isInteger(limit) || limit < 1) {
                return reply(
`╭━━〔 ✅ AHMED-MD APPROVAL 〕━━╮
┃
┃ 📌 Usage
┃ ✦ .approval 10 - Approve 10 Requests
┃ ✦ .approval all - Approve All Pending
┃
┃ 📥 Pending: ${requests.length}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
                )
            }
        }

        const selected = requests.slice(0, limit)

        const approved = await conn.groupRequestParticipantsUpdate(
            from,
            selected.map(p => p.jid),
            'approve'
        )

        const successCount = Array.isArray(approved)
            ? approved.filter(p => p.status === '200' || p.status === 200 || p.status === 'success').length
            : selected.length

        return reply(
`╭━━〔 ✅ AHMED-MD APPROVAL 〕━━╮
┃
┃ 📥 Pending Requests: ${requests.length}
┃ 📌 Requests Selected: ${selected.length}
┃ ✅ Approval Result: ${successCount}/${selected.length}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
        )

    } catch (e) {
        console.log('AHMED-MD APPROVAL ERROR:', e)
        reply(
`╭━━〔 ❌ AHMED-MD APPROVAL 〕━━╮
┃
┃ ❌ Status: Failed
┃ 📝 Check Bot Admin Permissions Or Logs.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
        )
    }
})
