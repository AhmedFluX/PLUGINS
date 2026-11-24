const { cmd } = require('../command')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../lib/linkcollector.json')

function loadDB() {
    try {
        if (!fs.existsSync(dbPath)) return { settings: { enabled: false, targetJids: [], customMsg: '' }, links: [] }
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    } catch { return { settings: { enabled: false, targetJids: [], customMsg: '' }, links: [] } }
}
function saveDB(data) { fs.writeFileSync(dbPath, JSON.stringify(data, null, 2)) }

function extractInviteLinks(text) {
    const regex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/gi
    return [...new Set((text.match(regex) || []).map(link => link.replace(/[.,!?;)\]]+$/, '')))]
}

function makePanel(settings, savedLinks) {
    return [
        '╭━━〔 🔗 AHMED-MD LINK COLLECTOR 〕━━╮',
        '┃',
        `┃ Collector Status: ${settings.enabled ? '🟢 ON' : '🔴 OFF'}`,
        `┃ Destinations: ${settings.targetJids.length}`,
        `┃ Saved Links: ${savedLinks.length}`,
        `┃ Custom Message: ${settings.customMsg || 'None'}`,
        '┃',
        '┃ 📌 Commands',
        '┃ ✦ .linkcollector on',
        '┃ ✦ .linkcollector off',
        '┃ ✦ .linkcollector add JID',
        '┃ ✦ .linkcollector del JID',
        '┃ ✦ .linkcollector msg TEXT',
        '┃ ✦ .linkcollector links',
        '┃ ✦ .linkcollector clear',
        '┃',
        '╰━━━━━━━━━━━━━━━━━━━━╯',
        '',
        '© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ'
    ].join('\n')
}

cmd({
    pattern: 'linkcollector',
    desc: 'Ahmii Link Collector',
    category: 'owner',
    react: '🔗',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isOwner, isAdmins, isGroup }) => {
    try {
        // ✅ FIX: Pehle sirf owner tha, ab Owner + Admin dono chala sakte hain
        // Agar tu chahta hai sab chalaye to is line ko hata de
        if (!isOwner && !isAdmins && !isGroup) {
            // DM me sirf owner
            if (!isOwner) return reply('❌ Sirf owner ye command use kar sakta hai.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }
        if (isGroup && !isOwner && !isAdmins) return reply('❌ Sirf group admin / owner ye command use kar sakta hai.\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')

        const input = (q || '').trim()
        const parts = input.split(/\s+/)
        const command = (parts.shift() || '').toLowerCase()
        const value = parts.join(' ').trim()

        const db = loadDB()
        const settings = db.settings

        if (!command || command === 'check') {
            return reply(makePanel(settings, db.links))
        }

        if (command === 'on' || command === 'off') {
            settings.enabled = command === 'on'
            saveDB(db)
            return reply(`✅ Link Collector ${settings.enabled ? '🟢 ON' : '🔴 OFF'}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
        }

        if (command === 'add') {
            if (!value || !value.includes('@')) return reply('⚠️ Usage: `.linkcollector add JID`\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
            if (!settings.targetJids.includes(value)) {
                settings.targetJids.push(value)
                saveDB(db)
            }
            return reply(`✅ Destination Added\n📍 JID: ${value}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
        }

        if (command === 'del' || command === 'remove') {
            if (!value) return reply('⚠️ Usage: `.linkcollector del JID`\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
            settings.targetJids = settings.targetJids.filter(j => j !== value)
            saveDB(db)
            return reply(`✅ Destination Removed\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
        }

        if (command === 'msg') {
            settings.customMsg = value
            saveDB(db)
            return reply(`✅ Message Updated\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
        }

        if (command === 'links') {
            if (!db.links.length) return reply('📥 No Links Saved\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
            const output = db.links.slice(-50).map((item, i) => `${i + 1}. ${item.link}`)
            return reply(`📥 AHMED-MD LINK COLLECTOR\n\n${output.join('\n')}\n\n📊 Total Saved: ${db.links.length}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
        }

        if (command === 'clear') {
            db.links = []
            saveDB(db)
            return reply('🗑️ Links Cleared\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        return reply(makePanel(settings, db.links))

    } catch (e) {
        console.log('AHMED-MD LINKCOLLECTOR ERROR:', e)
        reply(`❌ *Failed*\n\n${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
})

// ─── GROUP LINK HANDLER - index.js me lagana hai ───
/*
const db = JSON.parse(fs.readFileSync('./lib/linkcollector.json', 'utf8'))
const settings = db.settings
if (settings.enabled && from.endsWith('@g.us')) {
    const text = m.body || ''
    const links = text.match(/https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+/gi) || []
    for (const link of links) {
        if (db.links.some(x => x.link === link)) continue
        db.links.push({ link, sourceJid: from, timestamp: Date.now() })
        fs.writeFileSync('./lib/linkcollector.json', JSON.stringify(db, null, 2))
        const outgoing = [settings.customMsg, `🔗 ${link}`, '', `📍 Source GC: ${from}`, '© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`].filter(Boolean).join('\n')
        for (const target of settings.targetJids) {
            await conn.sendMessage(target, { text: outgoing })
        }
    }
}
*/
