const { cmd } = require('../command')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../lib/linkcollector.json')

function loadDB() {
    try {
        if (!fs.existsSync(dbPath)) return { enabled: false, targetJids: [], customMsg: '', links: [] }
        const d = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
        return { enabled: false, targetJids: [], customMsg: '', links: [], ...d }
    } catch { return { enabled: false, targetJids: [], customMsg: '', links: [] } }
}
function saveDB(data) { fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)) }

function makePanel(settings) {
    return `╭━━〔 🔗 AHMED-MD LINK COLLECTOR 〕━━╮
┃
┃ 🔗 Collector Status: ${settings.enabled ? '🟢 ON' : '🔴 OFF'}
┃ 🎯 Destinations: ${settings.targetJids.length}
┃ 📥 Saved Links: ${settings.links.length}
┃ 💬 Custom Message: ${settings.customMsg || 'None'}
┃
┃ 📌 Commands
┃ ✦ .linkcollector on
┃ ✦ .linkcollector off
┃ ✦ .linkcollector add JID
┃ ✦ .linkcollector del JID
┃ ✦ .linkcollector msg TEXT
┃ ✦ .linkcollector links
┃ ✦ .linkcollector clear
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
}

cmd({
    pattern: 'linkcollector',
    desc: 'Collect WhatsApp group invite links',
    category: 'owner',
    react: '🔗',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isOwner }) => {
    try {
        if (!isOwner) return reply('❌ Sirf owner ye command use kar sakta hai.')

        const parts = (q || '').trim().split(/\s+/)
        const action = (parts.shift() || '').toLowerCase()
        const value = parts.join(' ').trim()

        const settings = loadDB()

        if (!action || action === 'check') {
            return reply(makePanel(settings))
        }

        if (action === 'on' || action === 'off') {
            settings.enabled = action === 'on'
            saveDB(settings)
            return reply(`✅ Link Collector ${action === 'on' ? 'ON 🟢' : 'OFF 🔴'} ho gaya.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
        }

        if (action === 'add') {
            if (!value || !value.includes('@')) return reply('❌ Usage: .linkcollector add 923xx@s.whatsapp.net\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
            if (!settings.targetJids.includes(value)) settings.targetJids.push(value)
            saveDB(settings)
            return reply(`✅ Destination Added\n📍 JID: ${value}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
        }

        if (action === 'del' || action === 'remove') {
            if (!value) return reply('❌ Usage: .linkcollector del JID')
            settings.targetJids = settings.targetJids.filter(j => j !== value)
            saveDB(settings)
            return reply(`✅ Destination Removed\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
        }

        if (action === 'msg') {
            settings.customMsg = value
            saveDB(settings)
            return reply(`✅ Custom Message Updated\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
        }

        if (action === 'links') {
            if (!settings.links.length) return reply('❌ No Links Saved.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
            const output = settings.links.slice(-50).map((item, i) => `┃ ${i + 1}. ${item.link}`).join('\n')
            return reply(
`╭━━〔 📥 AHMED-MD SAVED LINKS 〕━━╮
┃
${output}
┃
┃ Total Saved: ${settings.links.length}
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
            )
        }

        if (action === 'clear') {
            settings.links = []
            saveDB(settings)
            return reply('✅ Links Cleared.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        return reply(makePanel(settings))

    } catch (e) {
        console.log('AHMED-MD LINKCOLLECTOR ERROR:', e)
        reply(`❌ *Failed*\n\n${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
})

// ─── GROUP LINK HANDLER ───
// AHMED-MD me 'on text' wala system plugin se nahi hota,
// ye logic index.js me messages.upsert wali jagah lagana hoga:

/*
const linkRegex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/gi
// Har aane wale message pe:
if (from.endsWith('@g.us')) {
    const db = JSON.parse(fs.readFileSync('./lib/linkcollector.json', 'utf8'))
    if (db.enabled && db.targetJids.length) {
        const links = [...new Set((body.match(linkRegex) || []))]
        for (const link of links) {
            if (db.links.some(x => x.link === link)) continue
            db.links.push({ link, sourceJid: from, timestamp: Date.now() })
            fs.writeFileSync('./lib/linkcollector.json', JSON.stringify(db, null, 2))
            const outgoing = `${db.customMsg ? db.customMsg + '\n\n' : ''}🔗 ${link}\n\n📍 Source GC: ${from}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
            for (const target of db.targetJids) {
                await conn.sendMessage(target, { text: outgoing })
            }
        }
    }
}
*/
