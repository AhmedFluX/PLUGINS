const { cmd } = require('../command')

const sleep = ms => new Promise(r => setTimeout(r, ms))

cmd({
    pattern: 'sgs',
    desc: 'Spam group status silently',
    category: 'owner',
    react: '💀',
    filename: __filename
}, async (conn, mek, m, { from, reply, isOwner, isGroup, quoted, q }) => {
    try {
        if (!isOwner) return reply('❌ Sirf owner ye command use kar sakta hai.')

        if (!quoted) {
            return reply(
`╭━━〔 💀 AHMED-MD 〕━━╮
┃
┃ ❌ Kisi message pe reply karke likho:
┃ ✦ .sgs
┃ ✦ .sgs 5
┃ ✦ .sgs 120xxx@g.us 5
┃
┃ Pehla: Us group ka status
┃ Dusra: Kitni baar spam karna hai
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
            )
        }

        const statusText = quoted.text || quoted.body || ''
        if (!statusText) return reply('❌ Status ke liye text chahiye.')

        // Args nikalo: .hi [jid] [quantity]
        const args = (q || '').trim().split(/\s+/).filter(Boolean)
        let quantity = 1

        // Last arg agar number hai to wo quantity hai
        if (args.length > 0 && !isNaN(args[args.length - 1])) {
            quantity = parseInt(args.pop())
        }
        if (!quantity || quantity < 1) quantity = 1
        if (quantity > 20) quantity = 20 // Ban se bachne ke liye max 20

        // Bache hue args me se Group JIDs nikalo
        const groupJids = args.filter(a => a.includes('@g.us') || /^\d+$/.test(a))
            .map(a => a.includes('@') ? a : `${a}@g.us`)

        // Case 1: Koi JID nahi diya - Current group
        if (groupJids.length === 0) {
            if (!isGroup) return reply('❌ Group JID do ya group me use karo.\n\nExample: .sgs 120xxx@g.us 5\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')

            for (let i = 0; i < quantity; i++) {
                try {
                    await conn.groupUpdateDescription(from, statusText)
                } catch {}
                if (quantity > 1) await sleep(1500)
            }
            return reply(`✅ Done! Current group ka status ${quantity} baar update kar diya.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
        }

        // Case 2: Specific groups
        let done = 0
        for (const jid of groupJids) {
            try {
                for (let i = 0; i < quantity; i++) {
                    await conn.groupUpdateDescription(jid, statusText)
                    if (quantity > 1) await sleep(1500)
                }
                done++
            } catch (e) {
                console.log('AHMED-MD HI SKIP:', jid, e.message)
            }
        }

        return reply(`✅ Done! ${done}/${groupJids.length} groups ka status ${quantity} baar update kar diya.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)

    } catch (e) {
        console.log('AHMED-MD HI ERROR:', e)
        reply(`❌ *HI Failed*\n\n${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
})
