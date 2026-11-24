const { cmd } = require('../command')
const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../lib/pdm.json')
const FOOTER = '© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ'

function loadDB() {
    try {
        if (!fs.existsSync(dbPath)) return {}
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    } catch { return {} }
}

function saveDB(data) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

let listenerAttached = false

function attachListener(conn) {
    if (listenerAttached) return
    listenerAttached = true

    conn.ev.on('group-participants.update', async (update) => {
        try {
            const db = loadDB()
            if (!db[update.id]) return

            const action = update.action
            if (action !== 'promote' && action !== 'demote') return

            const author = update.author
            const target = update.participants[0]
            if (!author || !target) return

            let text = ''

            if (action === 'promote') {
                text = `╭─── 👑 PROMOTED ───╮\n┃\n┃ 🎉 *New Admin:* @${target.split('@')[0]}\n┃ 👤 *Promoted By:* @${author.split('@')[0]}\n┃\n┃ Congratulations @${target.split('@')[0]} 🎉\n┃ You are now an Admin!\n┃\n╰─────────────────╯\n\n> ${FOOTER}`
            } else {
                text = `╭─── 📉 DEMOTED ───╮\n┃\n┃ 😔 *Removed Admin:* @${target.split('@')[0]}\n┃ 👤 *Demoted By:* @${author.split('@')[0]}\n┃\n┃ @${target.split('@')[0]} is no longer an Admin.\n┃\n╰─────────────────╯\n\n> ${FOOTER}`
            }

            await conn.sendMessage(update.id, {
                text: text,
                mentions: [author, target]
            })

        } catch (e) {
            console.log('PDM LISTENER ERROR:', e)
        }
    })
}

cmd({
    pattern: 'pdm',
    desc: 'Promote / Demote Monitor - On / Off',
    category: 'group',
    react: '👑',
    filename: __filename
}, async (conn, mek, m, { from, q, reply, isGroup }) => {
    try {
        attachListener(conn)

        if (!isGroup) return reply(`❌ This command only works in Groups.\n\n> ${FOOTER}`)

        const input = (q || '').trim().toLowerCase()
        const db = loadDB()

        if (input === 'on') {
            db[from] = true
            saveDB(db)
            return reply(`✅ *PDM ON*\n\nNow promote / demote alerts will come in this group.\n\n> ${FOOTER}`)
        }

        if (input === 'off') {
            db[from] = false
            saveDB(db)
            return reply(`❌ *PDM OFF*\n\nPromote / demote alerts are off now.\n\n> ${FOOTER}`)
        }

        const status = db[from] ? '🟢 ON' : '🔴 OFF'
        return reply(`👑 *PDM STATUS:* ${status}\n\n📌 *.pdm on* - Turn ON\n📌 *.pdm off* - Turn OFF\n\n> ${FOOTER}`)

    } catch (e) {
        reply(`❌ Failed: ${e.message}\n\n> ${FOOTER}`)
    }
})
