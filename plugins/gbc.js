const { cmd } = require('../command')

const delay = ms => new Promise(res => setTimeout(res, ms))

cmd({
    pattern: 'gbc',
    desc: 'Send message to all groups',
    category: 'owner',
    react: '📡',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
    try {
        if (!isOwner) return reply('❌ Sirf owner ye command use kar sakta hai.')

        const text = q?.trim()

        if (!text) {
            return reply(
`╭━━〔 📡 AHMED-MD GBC 〕━━╮
┃
┃ ✦ .gbc Message
┃ ✦ Example: .gbc Hello Everyone
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
            )
        }

        const groupsObj = await conn.groupFetchAllParticipating()
        const groups = Object.values(groupsObj)
        const total = groups.length

        if (!total) return reply('❌ Bot kisi group me nahi hai.')

        await reply(
`╭━━〔 🚀 AHMED-MD BROADCAST 〕━━╮
┃
┃ 🚀 Broadcast Started
┃ Total Groups: ${total}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
        )

        const batchSize = 50
        let sent = 0
        let batchCount = 0

        for (let i = 0; i < groups.length; i += batchSize) {
            const batch = groups.slice(i, i + batchSize)
            batchCount++

            for (const g of batch) {
                try {
                    const members = g.participants.map(p => p.id)
                    await conn.sendMessage(g.id, { text, mentions: members })
                    sent++
                    await delay(1000)
                } catch (err) {
                    console.log('AHMED-MD GBC ERROR:', g.id, err.message)
                }
            }

            await reply(
`╭━━〔 📡 AHMED-MD PROGRESS 〕━━╮
┃
┃ Batch: ${batchCount}
┃ Sent: ${sent}/${total}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
            )

            if (i + batchSize < total) {
                await delay(10000)
            }
        }

        await reply(
`╭━━〔 ✅ AHMED-MD BROADCAST 〕━━╮
┃
┃ ✅ Broadcast Completed
┃ Total Sent: ${sent}/${total}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
        )

    } catch (e) {
        console.log('AHMED-MD GBC ERROR:', e)
        reply(`❌ *Broadcast Failed*\n\n${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
})
