const { cmd } = require('../command')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../lib/linkcollector.json')

function loadDB() {
    try {
        if (!fs.existsSync(dbPath)) {
            return { settings: { enabled: false, targetJids: [], customMsg: '' }, links: [] }
        }
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    } catch (e) {
        return { settings: { enabled: false, targetJids: [], customMsg: '' }, links: [] }
    }
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

function makePanel(settings, savedLinks) {
    return `╭━━〔 🔗 AHMED-MD LINK COLLECTOR 〕━━╮
┃
┃ Collector Status: ${settings.enabled ? '🟢 ON' : '🔴 OFF'}
┃ Destinations: ${settings.targetJids.length}
┃ Saved Links: ${savedLinks.length}
┃ Custom Message: ${settings.customMsg || 'None'}
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
    desc: 'Link Collector',
    category: 'general',
    react: '🔗',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
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
            return reply('✅ Destination Removed\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
        }

        if (command === 'msg') {
            settings.customMsg = value
            saveDB(db)
            return reply('✅ Message Updated\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ')
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
        reply(`❌ Failed: ${e.message}\n\n© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`)
    }
})
