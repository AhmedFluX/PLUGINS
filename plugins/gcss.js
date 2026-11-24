const { cmd } = require('../command')

cmd({
    pattern: 'gcss',
    desc: 'Update all groups status',
    category: 'owner',
    react: '📢',
    filename: __filename
}, async (conn, mek, m, { reply, isOwner, quoted }) => {
    try {
        if (!isOwner) return reply('❌ Sirf owner ye command use kar sakta hai.')

        if (!quoted) {
            return reply(
`╭━━〔 📢 AHMED-MD GC STATUS 〕━━╮
┃
┃ ❌ Kisi message pe reply karke likho:
┃ ✦ .gcss
┃
┃ Example: Kisi text pe reply karke
┃ .gcss likho wo text sare
┃ groups ka Status lag jayega.
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
            )
        }

        const groupsObj = await conn.groupFetchAllParticipating()
        const groups = Object.values(groupsObj)

        if (!groups.length) return reply('❌ Bot kisi group me nahi hai.')

        const statusText = quoted.text || quoted.body || ''

        if (!statusText) return reply('❌ Status ke liye text chahiye.')

        await reply(`⏳ ${groups.length} groups ka Status update kar raha hoon...`)

        let updated = 0

        for (const g of groups) {
            try {
                // Yehi AHMII ke groupStatus() ka AHMED-MD version hai
                await conn.groupUpdateDescription(g.id, statusText)
                updated++
            } catch (e) {
                console.log('AHMED-MD GCSS SKIP:', g.id, e.message)
            }
        }

        await reply(
`╭━━〔 ✅ AHMED-MD GC STATUS 〕━━╮
┃
┃ ✅ Status Updated: ${updated}/${groups.length} Groups
┃ 📝 New Status: ${statusText}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
        )

    } catch (e) {
        console.log('AHMED-MD GCSS ERROR:', e)
        reply(`❌ *GC Status Failed*\n\n${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
}) 
