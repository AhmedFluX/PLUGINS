
const config = require('../config')
const { cmd, commands } = require('../command')
const path = require('path')
const fs = require('fs')
const { runtime } = require('../lib/functions')

const toSmallCaps = (text) => {
    const map = {
        a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',
        g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',k:'ᴋ',l:'ʟ',
        m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',
        s:'s',t:'ᴛ',u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',
        y:'ʏ',z:'ᴢ'
    }

    return String(text || '').split('').map(
        char => map[char.toLowerCase()] || char
    ).join('')
}

const formatCategory = (category, cmds) => {
    const valid = cmds.filter(
        c => c.pattern && c.pattern.trim() !== ''
    )

    if (!valid.length) return ''

    const title = `\n╭━━〔 ${toSmallCaps(category)} 〕━━╮\n`

    const body = valid.map(c =>
        `┃  ◈ ${toSmallCaps(c.pattern)}`
    ).join('\n')

    return `${title}${body}\n╰━━━━━━━━━━━━━━╯\n`
}

cmd({
    pattern: 'menu',
    alias: ['m', 'help', 'allmenu', 'fullmenu'],
    use: '.menu',
    desc: 'Show all bot commands',
    category: 'main',
    react: '⚡',
    filename: __filename
},
async (conn, mek, m, {
    from,
    reply,
    userConfig
}) => {
    try {
        await conn.sendPresenceUpdate('composing', from)

        const allCommands = Object.values(commands)

        const totalCommands = allCommands.filter(
            c => c.pattern && c.pattern.trim() !== ''
        ).length

        const BOT_NAME =
            userConfig?.BOT_NAME || config.BOT_NAME || 'AHMED-MD'

        const OWNER_NAME =
            userConfig?.OWNER_NAME || config.OWNER_NAME || 'AHMED'

        const PREFIX =
            userConfig?.PREFIX || config.PREFIX || '.'

        const MODE =
            userConfig?.MODE || config.MODE || 'private'

        const VERSION =
            userConfig?.VERSION || config.VERSION || '1.0.0'

        const DESCRIPTION =
            userConfig?.DESCRIPTION || config.DESCRIPTION || ''

        const BOT_IMAGE =
            userConfig?.BOT_IMAGE ||
            userConfig?.BOT_MEDIA_URL ||
            config.BOT_IMAGE ||
            config.BOT_MEDIA_URL

        // AUTOMATIC COMMAND CATEGORIES
        const categories = [
            ...new Set(allCommands.map(c => c.category))
        ].filter(
            cat => cat && cat !== 'undefined' && cat !== 'main'
        )

        let menuSections = ''

        for (const category of categories) {
            const categoryCommands = allCommands.filter(
                c => c.category === category
            )

            menuSections += formatCategory(
                category,
                categoryCommands
            )
        }

        // FINAL MENU
        const menu = `
╭━━〔 ${toSmallCaps(BOT_NAME)} 〕━━╮
┃
┃  ◈ 𝐎ᴡɴᴇʀ : ${toSmallCaps(OWNER_NAME)}
┃  ◈ 𝐂ᴏᴍᴍᴀɴᴅꜱ : ${totalCommands}
┃  ◈ 𝐑ᴜɴᴛɪᴍᴇ : ${runtime(process.uptime())}
┃  ◈ 𝐏ʀᴇғɪx : ${PREFIX}
┃  ◈ 𝐌ᴏᴅᴇ : ${toSmallCaps(MODE)}
┃  ◈ 𝐕ᴇʀꜱɪᴏɴ : ${VERSION}
╰━━━━━━━━━━━━━━━━━━╯

╭━━〔 𝐀ʟʟ 𝐂ᴏᴍᴍᴀɴᴅꜱ 〕━━╮
${menuSections}
${DESCRIPTION}

> 𝐏ᴏᴡᴇʀᴇᴅ ʙʏ ${toSmallCaps(OWNER_NAME)} 💀🇦🇱
© ${toSmallCaps(BOT_NAME)}
`

        // BOT DP
        const localImage = path.join(
            __dirname,
            '../lib/ahmed.png'
        )

        let imageToUse = null

        if (global.menuImageBuffer) {
            imageToUse = global.menuImageBuffer
        } else if (fs.existsSync(localImage)) {
            imageToUse = fs.readFileSync(localImage)
        } else if (BOT_IMAGE) {
            imageToUse = { url: BOT_IMAGE }
        }

        // ORIGINAL BOT CHANNEL
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363429311414073@newsletter',
                newsletterName: 'AHMED-MD SUPPORT',
                serverMessageId: 143
            }
        }

        // SEND MENU ONLY ONCE
        if (imageToUse) {
            await conn.sendMessage(from, {
                image: imageToUse,
                caption: menu,
                contextInfo
            }, { quoted: mek })
        } else {
            await conn.sendMessage(from, {
                text: menu,
                contextInfo
            }, { quoted: mek })
        }

    } catch (e) {
        console.log('MENU ERROR:', e)
        reply(`Menu Error: ${e.message}`)
    }
})
