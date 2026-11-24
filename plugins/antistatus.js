const { cmd } = require('../command')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../lib/antistatus.json')

function loadDB() {
    try {
        if (!fs.existsSync(dbPath)) return { modes: {}, warns: {} }
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    } catch { return { modes: {}, warns: {} } }
}
function saveDB(data) { fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)) }

cmd({
    pattern: 'antistatus',
    desc: 'Anti group status',
    category: 'group',
    react: '🛡️',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isGroup, isAdmins, isBotAdmins }) => {
    try {
        if (!isGroup) return reply('❌ Yeh command sirf group me chalegi.')
        if (!isAdmins) return reply('❌ Sirf group admin ye command use kar sakta hai.')

        const arg = (q || '').trim().toLowerCase()
        const db = loadDB()

        if (arg === 'on' || arg === 'null') {
            db.modes[from] = 'null'
            saveDB(db)
            return reply('✅ *Anti Status ON*\n_Mode: Delete_\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        if (arg === 'warn') {
            db.modes[from] = 'warn'
            saveDB(db)
            return reply('✅ *Anti Status ON*\n_Mode: Warn_\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        if (arg === 'kick') {
            db.modes[from] = 'kick'
            saveDB(db)
            return reply('✅ *Anti Status ON*\n_Mode: Kick_\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        if (arg === 'off') {
            delete db.modes[from]
            db.warns[from] = {}
            saveDB(db)
            return reply('_Anti Status OFF_\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        if (arg === 'reset') {
            db.warns[from] = {}
            saveDB(db)
            return reply('_All warns reset for this group_\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        const mode = db.modes[from]
        const status = mode ? `✅ ON — Mode: *${mode}*` : '❌ OFF'
        return reply(
`╭━━〔 🛡️ AHMED-MD ANTI STATUS 〕━━╮
┃
┃ *Anti Status:* ${status}
┃
┃ *Usage:*
┃ .antistatus on - Sirf Delete
┃ .antistatus warn - Warn + Delete
┃ .antistatus kick - Kick + Delete
┃ .antistatus off - Band
┃ .antistatus reset - Warns Reset
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
        )

    } catch (e) {
        console.log('AHMED-MD ANTISTATUS ERROR:', e)
        reply(`❌ *Failed*\n\n${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
})

// ─── ANTI STATUS HANDLER ───
// AHMED-MD me 'on text' wala system plugin se nahi hota,
// ye logic index.js me messages.upsert wali jagah lagana hoga:

/*
const db = JSON.parse(fs.readFileSync('./lib/antistatus.json', 'utf8'))
const mode = db.modes[from]
if (mode && isGroup) {
    const innerMsg = mek.message
    const isGroupStatus = !!innerMsg?.groupStatusMessageV2 || innerMsg?.extendedTextMessage?.contextInfo?.isGroupStatus === true
    if (isGroupStatus) {
        // 1. Delete karo
        await conn.sendMessage(from, { delete: { remoteJid: from, fromMe: false, id: mek.key.id, participant: sender } })

        if (mode === 'null') return

        if (mode === 'kick') {
            await conn.sendMessage(from, { text: `🚫 @${sender.split('@')[0]}\n_Removed for sharing status in this group._\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`, mentions: [sender] })
            await conn.groupParticipantsUpdate(from, [sender], 'remove')
            return
        }

        if (mode === 'warn') {
            const warns = db.warns[from] || {}
            const current = (warns[sender] || 0) + 1
            warns[sender] = current
            db.warns[from] = warns
            fs.writeFileSync('./lib/antistatus.json', JSON.stringify(db, null, 2))

            if (current < 3) {
                await conn.sendMessage(from, { text: `⚠️ @${sender.split('@')[0]}\n\n*Warning ${current}/3* — Do not share status!\n_${3 - current} warning(s) left before kick_\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`, mentions: [sender] })
            } else {
                warns[sender] = 0
                db.warns[from] = warns
                fs.writeFileSync('./lib/antistatus.json', JSON.stringify(db, null, 2))
                await conn.sendMessage(from, { text: `🚫 @${sender.split('@')[0]}\n\n*3/3 Warnings reached!*\n_Removed from group for sharing status._\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`, mentions: [sender] })
                await conn.groupParticipantsUpdate(from, [sender], 'remove')
            }
        }
    }
}
*/ 
