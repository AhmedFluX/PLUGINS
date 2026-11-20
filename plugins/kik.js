const { cmd } = require('../command')

cmd({
    pattern: 'kik',
    alias: [],
    desc: 'Remove members from Group',
    category: 'group',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { from, q, reply } = context

    try {
        if (!m.isGroup)
            return reply('This command can only be used in groups.')

        if (!q)
            return reply('Example:\n.kik 994\n.kik 994 kick')

        const metadata = await conn.groupMetadata(from)
        const participants = metadata.participants || []

        const botJid = conn.user.id
        const botParticipant = participants.find(
            user => user.id === botJid ||
            user.id.split(':')[0] === botJid.split(':')[0]
        )

        const isImAdmin = botParticipant?.admin === 'admin' ||
            botParticipant?.admin === 'superadmin'

        if (!isImAdmin)
            return reply("_I'm not admin._")

        let match = q.trim()
        const kik = /\bkick\b/i.test(match)

        if (kik)
            match = match.replace(/\bkick\b/i, '').trim()

        const users = participants
            .filter(user => {
                const number = user.id.split('@')[0].split(':')[0]
                return number.startsWith(match)
            })
            .map(user => user.id)

        if (!users.length)
            return reply('No matching group members found.')

        if (kik) {
            await conn.groupParticipantsUpdate(from, users, 'remove')
            return reply(`Successfully removed ${users.length} member(s).`)
        }

        let msg = ''

        for (const user of users) {
            msg += `○ ${user.split('@')[0]}\n`
        }

        return reply(msg)

    } catch (error) {
        console.error('KIK ERROR:', error)
        return reply('An error occurred while processing the command.')
    }
})
