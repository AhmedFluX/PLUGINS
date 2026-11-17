
const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const path = require('path');
const fs = require('fs');

const BOT_VERSION = '1.0.0';
const BOT_BUILD = 'BETA';

function toSmallCaps(text) {
    const map = {
        a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ',
        e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ',
        i: 'ɪ', j: 'ᴊ', k: 'ᴋ', l: 'ʟ',
        m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ',
        q: 'ǫ', r: 'ʀ', s: 'ꜱ', t: 'ᴛ',
        u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x',
        y: 'ʏ', z: 'ᴢ'
    };

    return String(text)
        .toLowerCase()
        .split('')
        .map(char => map[char] || char)
        .join('');
}

function getCommands() {
    const list = Array.isArray(commands)
        ? commands
        : Object.values(commands || {});

    return list.filter(command =>
        command &&
        typeof command.pattern === 'string' &&
        command.pattern.trim() !== ''
    );
}

function formatCategory(category, list, prefix) {
    let text = `╭━━〔 ${toSmallCaps(category)} 〕━━╮\n`;
    text += `┃\n`;

    for (const command of list) {
        text += `┃  ◦ ${prefix}${toSmallCaps(command.pattern)}\n`;
    }

    text += `┃\n`;
    text += `╰━━━━━━━━━━━━━━╯\n\n`;

    return text;
}

cmd({
    pattern: 'menu',
    alias: ['m', 'help', 'allmenu', 'fullmenu'],
    use: '.menu',
    desc: 'Show all bot commands',
    category: 'main',
    react: '⚡',
    filename: __filename
}, async (conn, mek, m, {
    from,
    reply,
    userConfig
}) => {
    try {
        await conn.sendPresenceUpdate('composing', from);

        const BOT_NAME =
            userConfig?.BOT_NAME ||
            config.BOT_NAME ||
            'AHMED-MD';

        const OWNER_NAME =
            userConfig?.OWNER_NAME ||
            config.OWNER_NAME ||
            'AHMED';

        const PREFIX =
            userConfig?.PREFIX ||
            config.PREFIX ||
            '.';

        const MODE =
            userConfig?.MODE ||
            config.MODE ||
            'PUBLIC';

        const DESCRIPTION =
            userConfig?.DESCRIPTION ||
            config.DESCRIPTION ||
            '';

        const BOT_IMAGE =
            userConfig?.BOT_IMAGE ||
            userConfig?.BOT_MEDIA_URL ||
            config.BOT_IMAGE ||
            config.BOT_MEDIA_URL;

        const allCommands = getCommands();
        const totalCommands = allCommands.length;

        // CATEGORY GROUPING
        const categorized = {};

        for (const command of allCommands) {
            const category =
                command.category &&
                String(command.category).trim()
                    ? String(command.category).trim()
                    : 'OTHER';

            if (!categorized[category]) {
                categorized[category] = [];
            }

            categorized[category].push(command);
        }

        // MENU HEADER
        let menuText = '';

        menuText += `╭━━〔 ${BOT_NAME} 〕━━╮\n`;
        menuText += `┃  ᴏᴡɴᴇʀ    : ${OWNER_NAME}\n`;
        menuText += `┃  ᴄᴏᴍᴍᴀɴᴅꜱ : ${totalCommands}\n`;
        menuText += `┃  ʀᴜɴᴛɪᴍᴇ  : ${runtime(process.uptime())}\n`;
        menuText += `┃  ᴘʀᴇꜰɪx   : ${PREFIX}\n`;
        menuText += `┃  ᴍᴏᴅᴇ     : ${toSmallCaps(MODE)}\n`;
        menuText += `┃  ᴠᴇʀꜱɪᴏɴ  : ${BOT_VERSION}\n`;
        menuText += `┃  ʙᴜɪʟᴅ    : ${toSmallCaps(BOT_BUILD)}\n`;
        menuText += `┃\n`;
        menuText += `╰━━━━━━━━━━━━━━╯\n\n`;

        // ALL COMMAND CATEGORIES
        for (const [category, list] of Object.entries(categorized)) {
            menuText += formatCategory(category, list, PREFIX);
        }

        // FOOTER
        menuText += `       ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴀʜᴍᴇᴅ\n`;

        if (DESCRIPTION) {
            menuText += `\n${DESCRIPTION}`;
        }

        // ORIGINAL CHANNEL PREVIEW
        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363429311414073@newsletter',
                newsletterName: BOT_NAME,
                serverMessageId: 143
            }
        };

        // MENU IMAGE
        const localImagePath = path.join(
            __dirname,
            '../lib/ahmed.png'
        );

        let image = null;

        if (global.menuImageBuffer) {
            image = global.menuImageBuffer;
        } else if (fs.existsSync(localImagePath)) {
            image = fs.readFileSync(localImagePath);
        } else if (
            typeof BOT_IMAGE === 'string' &&
            /^https?:\/\//i.test(BOT_IMAGE)
        ) {
            image = { url: BOT_IMAGE };
        }

        // SEND MENU WITH CHANNEL PREVIEW
        if (image) {
            await conn.sendMessage(
                from,
                {
                    image: image,
                    caption: menuText,
                    contextInfo: contextInfo
                },
                { quoted: mek }
            );
        } else {
            await conn.sendMessage(
                from,
                {
                    text: menuText,
                    contextInfo: contextInfo
                },
                { quoted: mek }
            );
        }

        // OPTIONAL AUDIO
        const audioPath = path.join(
            __dirname,
            '../lib/love.mp3'
        );

        if (fs.existsSync(audioPath)) {
            await new Promise(resolve =>
                setTimeout(resolve, 1000)
            );

            await conn.sendMessage(
                from,
                {
                    audio: fs.readFileSync(audioPath),
                    mimetype: 'audio/mpeg',
                    ptt: false
                },
                { quoted: mek }
            );
        }

    } catch (error) {
        console.log('MENU ERROR:', error);
        reply(`Menu Error: ${error.message || error}`);
    }
});
