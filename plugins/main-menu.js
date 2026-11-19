
const config = require('../config')
const { cmd, commands } = require('../command')
const path = require('path')
const fs = require('fs')
const { runtime } = require('../lib/functions')

// SMALL CAPS CONVERTER
const toSmallCaps = (text) => {
    const map = {
        a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ',
        f:'ғ', g:'ɢ', h:'ʜ', i:'ɪ', j:'ᴊ',
        k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ',
        p:'ᴘ', q:'ǫ', r:'ʀ', s:'s', t:'ᴛ',
        u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ'
    }

    return String(text || '').split('').map(
        char => map[char.toLowerCase()] || char
    ).join('')
}

// CATEGORY FORMAT
const formatCategory = (category, cmds) => {
    const validCommands = cmds.filter(
        c => c.pattern && c.pattern.trim() !== ''
    )

    if (!validCommands.length) return ''

    const title = `\n╭━━〔 ${toSmallCaps(category)} 〕━━╮\n`

    const body = validCommands.map(c =>
        `┃  ◈ ${toSmallCaps(c.pattern)}`
    ).join('\n')

    return `${title}${body}\n╰━━━━━━━━━━━━━━╯\n`
}

// MENU COMMAND
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

        // BOT SETTINGS
        const BOT_NAME =
            userConfig?.BOT_NAME ||
            config.BOT_NAME ||
            'AHMED-MD'

        const OWNER_NAME =
            userConfig?.OWNER_NAME ||
            config.OWNER_NAME ||
            'AHMED'

        const PREFIX =
            userConfig?.PREFIX ||
            config.PREFIX ||
            '.'

        const MODE =
            userConfig?.MODE ||
            config.MODE ||
            'private'

        const VERSION =
            userConfig?.VERSION ||
            config.VERSION ||
            '1.0.0'

        const DESCRIPTION =
            userConfig?.DESCRIPTION ||
            config.DESCRIPTION ||
            ''

        const BOT_IMAGE =
            userConfig?.BOT_IMAGE ||
            userConfig?.BOT_MEDIA_URL ||
            config.BOT_IMAGE ||
            config.BOT_MEDIA_URL

        // AUTOMATIC CATEGORIES
        const categories = [
            ...new Set(
                allCommands.map(c => c.category)
            )
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

        // MENU TEXT
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
╭━━〔 𝐒ᴜᴘᴘᴏʀᴛ 〕━━╮
┃  ◈ 𝐂ʜᴀɴɴᴇʟ : AHMED-MD | BOT 👾 
╰━━━━━━━━━━━━━━━━━━╯

${DESCRIPTION}

       © ${toSmallCaps(BOT_NAME)} 💀🇦🇱
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

        // CHANNEL INFORMATION
        const contextInfo = {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363429311414073@newsletter',
                newsletterName: 'AHMED-MD SUPPORT',
                serverMessageId: 143
            }
        }

        // SEND MENU WITH DP
        if (imageToUse) {
            await conn.sendMessage(from, {
                image: imageToUse,
                caption: menu,
                contextInfo
            }, {
                quoted: mek
            })
        } else {
            await conn.sendMessage(from, {
                text: menu,
                contextInfo
            }, {
                quoted: mek
            })
        }

        // SUPPORT CHANNEL LINK
        await conn.sendMessage(from, {
            text: '✦ 𝐅ᴏʟʟᴏᴡ 𝐎ᴜʀ 𝐒ᴜᴘᴘᴏʀᴛ 𝐂ʜᴀɴɴᴇʟ ✦',
            contextInfo: {
                externalAdReply: {
                    title: 'AHMED-MD SUPPORT',
                    body: 'ᴏғғɪᴄɪᴀʟ ᴡʜᴀᴛsᴀᴘᴘ ᴄʜᴀɴɴᴇʟ',
                    mediaType: 1,
                    thumbnailUrl: BOT_IMAGE,
                    sourceUrl: 'https://whatsapp.com/channel/0029VbDlhfC9Gv7QQelt583R',
                    renderLargerThumbnail: false
                }
            }
        }, {
            quoted: mek
        })

    } catch (e) {
        console.log('MENU ERROR:', e)
        reply(`Menu Error: ${e.message}`)
    }
})
