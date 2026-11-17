
/* ═══════════════════════════════════════
             AHMED-MD MEGA PLUGIN
          Single File Command System
═══════════════════════════════════════ */

const { cmd } = require('../command');
const config = require('../config');
const axios = require('axios');
const os = require('os');
const { execFile } = require('child_process');

// ═════════ API CONFIGURATION ═════════

const API = {
    SONG: '',
    LYRICS: '',
    AI: '',
    TRANSLATE: '',
    INSTAGRAM: '',
    TIKTOK: '',
    FACEBOOK: '',
    YOUTUBE: '',
    GOOGLE: '',
    WIKI: '',
    WEATHER: '',
    NEWS: '',
    QURAN: '',
    HADITH: '',
    DUA: '',
    JOKE: '',
    QUOTE: '',
    QR: '',
    DEFINE: ''
};

const API_KEY = '';

const PREFIX = config.PREFIX || '.';

// ═════════ HELPERS ═════════

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function cleanText(value) {
    return String(value || '').trim();
}

function getUrl(data) {
    if (!data) return null;

    if (typeof data === 'string') {
        if (/^https?:\/\//i.test(data)) return data;

        try {
            return getUrl(JSON.parse(data));
        } catch {
            return null;
        }
    }

    if (Array.isArray(data)) {
        for (const item of data) {
            const found = getUrl(item);
            if (found) return found;
        }
    }

    if (typeof data === 'object') {
        const keys = [
            'url', 'download', 'downloadUrl', 'media',
            'audio', 'video', 'link', 'result'
        ];

        for (const key of keys) {
            if (data[key]) {
                const found = getUrl(data[key]);
                if (found) return found;
            }
        }

        for (const value of Object.values(data)) {
            if (typeof value === 'object') {
                const found = getUrl(value);
                if (found) return found;
            }
        }
    }

    return null;
}

function getText(data) {
    if (!data) return '';

    if (typeof data === 'string') return data;

    if (Array.isArray(data)) {
        return data.map(getText).filter(Boolean).join('\n');
    }

    if (typeof data === 'object') {
        const keys = [
            'text', 'answer', 'response', 'message',
            'description', 'lyrics', 'content', 'result',
            'title', 'definition'
        ];

        for (const key of keys) {
            if (data[key] && typeof data[key] === 'string') {
                return data[key];
            }
        }

        return JSON.stringify(data, null, 2);
    }

    return String(data);
}

async function apiRequest(endpoint, query) {
    if (!endpoint) {
        throw new Error('API URL is not configured yet.');
    }

    const headers = {};

    if (API_KEY) {
        headers.Authorization = `Bearer ${API_KEY}`;
        headers['x-api-key'] = API_KEY;
    }

    const response = await axios.get(endpoint, {
        params: { q: query, query },
        headers,
        timeout: 30000,
        maxContentLength: 20 * 1024 * 1024
    });

    return response.data;
}

async function sendApiText(reply, endpoint, query, title) {
    const data = await apiRequest(endpoint, query);
    const result = getText(data);

    if (!result) {
        return reply('❌ API returned an empty response.');
    }

    return reply(`╭───〔 *${title}* 〕───⊷\n\n${result}\n\n╰──────────────────`);
}

async function sendApiMedia(conn, from, mek, reply, endpoint, query, type) {
    const data = await apiRequest(endpoint, query);
    const url = getUrl(data);

    if (!url) {
        const text = getText(data);
        return reply(text || '❌ No media URL was returned by the API.');
    }

    if (type === 'audio') {
        return conn.sendMessage(from, {
            audio: { url },
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: mek });
    }

    if (type === 'video') {
        return conn.sendMessage(from, {
            video: { url },
            caption: '乂 *AHMED-MD DOWNLOADER*'
        }, { quoted: mek });
    }

    return reply(url);
}

function registerTextCommand(pattern, aliases, endpointKey, title, category = 'search') {
    cmd({
        pattern,
        alias: aliases,
        desc: `${title} command`,
        category,
        react: '✨',
        filename: __filename
    }, async (conn, mek, m, { from, q, reply }) => {
        try {
            if (!q) return reply(`Example: ${PREFIX}${pattern} search query`);

            await reply('⏳ Please wait...');

            await sendApiText(
                reply,
                API[endpointKey],
                q,
                title
            );
        } catch (error) {
            reply(`❌ ${title} Error: ${error.message}`);
        }
    });
}

function registerMediaCommand(pattern, aliases, endpointKey, type, title) {
    cmd({
        pattern,
        alias: aliases,
        desc: `${title} downloader`,
        category: 'download',
        react: '⬇️',
        filename: __filename
    }, async (conn, mek, m, { from, q, reply }) => {
        try {
            if (!q) return reply(`Example: ${PREFIX}${pattern} link or search`);

            await reply('⏳ Processing your request...');

            await sendApiMedia(
                conn, from, mek, reply,
                API[endpointKey], q, type
            );
        } catch (error) {
            reply(`❌ ${title} Error: ${error.message}`);
        }
    });
}

// ═════════ MUSIC COMMANDS ═════════

registerMediaCommand(
    'song', ['play'], 'SONG', 'audio', 'Song'
);

registerTextCommand(
    'lyrics', ['lyric'], 'LYRICS', 'Lyrics', 'music'
);

// ═════════ AI COMMANDS ═════════

registerTextCommand(
    'ai', ['gpt', 'ask'], 'AI', 'AI Assistant', 'ai'
);

// ═════════ TRANSLATION ═════════

cmd({
    pattern: 'translate',
    alias: ['tr'],
    desc: 'Translate text',
    category: 'tools',
    react: '🌐',
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        if (!q) {
            return reply(`Example: ${PREFIX}translate Hello | Urdu`);
        }

        await sendApiText(reply, API.TRANSLATE, q, 'TRANSLATION');
    } catch (error) {
        reply(`❌ Translation Error: ${error.message}`);
    }
});

// ═════════ DOWNLOADERS ═════════

registerMediaCommand(
    'instagram', ['ig'], 'INSTAGRAM', 'video', 'Instagram'
);

registerMediaCommand(
    'tiktok', ['tt'], 'TIKTOK', 'video', 'TikTok'
);

registerMediaCommand(
    'facebook', ['fb'], 'FACEBOOK', 'video', 'Facebook'
);

registerMediaCommand(
    'youtube', ['yt'], 'YOUTUBE', 'video', 'YouTube'
);

// ═════════ SEARCH COMMANDS ═════════

registerTextCommand(
    'google', ['search'], 'GOOGLE', 'Google Search'
);

registerTextCommand(
    'wiki', ['wikipedia'], 'WIKI', 'Wikipedia'
);

registerTextCommand(
    'weather', ['climate'], 'WEATHER', 'Weather'
);

registerTextCommand(
    'news', [], 'NEWS', 'Latest News'
);

// ═════════ ISLAMIC COMMANDS ═════════

registerTextCommand(
    'quran', ['ayat'], 'QURAN', 'Quran', 'islamic'
);

registerTextCommand(
    'hadith', [], 'HADITH', 'Hadith', 'islamic'
);

registerTextCommand(
    'dua', [], 'DUA', 'Dua', 'islamic'
);

// ═════════ FUN COMMANDS ═════════

registerTextCommand(
    'joke', [], 'JOKE', 'Joke', 'fun'
);

registerTextCommand(
    'quote', [], 'QUOTE', 'Quote', 'fun'
);

// ═════════ QR CODE ═════════

cmd({
    pattern: 'qr',
    alias: ['qrcode'],
    desc: 'Generate QR code',
    category: 'tools',
    react: '📱',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply(`Example: ${PREFIX}qr Hello World`);

        const data = await apiRequest(API.QR, q);
        const url = getUrl(data);

        if (!url) {
            return reply(getText(data) || '❌ QR image URL not found.');
        }

        await conn.sendMessage(from, {
            image: { url },
            caption: '*乂 AHMED-MD QR CODE*'
        }, { quoted: mek });

    } catch (error) {
        reply(`❌ QR Error: ${error.message}`);
    }
});

// ═════════ DICTIONARY ═════════

registerTextCommand(
    'define', ['meaning'], 'DEFINE', 'Dictionary', 'tools'
);

// ═════════ CALCULATOR ═════════

cmd({
    pattern: 'calc',
    alias: ['calculate'],
    desc: 'Basic calculator',
    category: 'tools',
    react: '🧮',
    filename: __filename
}, async (conn, mek, m, { q, reply }) => {
    try {
        if (!q) return reply(`Example: ${PREFIX}calc 20 + 30`);

        // Only allow basic arithmetic characters.
        if (!/^[0-9+\-*/().%\s]+$/.test(q)) {
            return reply('❌ Only basic arithmetic expressions are allowed.');
        }

        const tokens = q.match(/\d+(?:\.\d+)?|[()+\-*/%]/g);

        if (!tokens || tokens.join('') !== q.replace(/\s/g, '')) {
            return reply('❌ Invalid calculation.');
        }

        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2, '%': 2 };
        const output = [];
        const operators = [];

        for (const token of tokens) {
            if (/^\d/.test(token)) {
                output.push(Number(token));
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length && operators.at(-1) !== '(') {
                    output.push(operators.pop());
                }
                if (operators.pop() !== '(') throw new Error('Invalid brackets');
            } else {
                while (
                    operators.length &&
                    precedence[operators.at(-1)] >= precedence[token]
                ) {
                    output.push(operators.pop());
                }
                operators.push(token);
            }
        }

        while (operators.length) {
            const op = operators.pop();
            if (op === '(') throw new Error('Invalid brackets');
            output.push(op);
        }

        const stack = [];

        for (const token of output) {
            if (typeof token === 'number') {
                stack.push(token);
            } else {
                const b = stack.pop();
                const a = stack.pop();

                if (a === undefined || b === undefined) {
                    throw new Error('Invalid expression');
                }

                if ((token === '/' || token === '%') && b === 0) {
                    throw new Error('Cannot divide by zero');
                }

                const operations = {
                    '+': () => a + b,
                    '-': () => a - b,
                    '*': () => a * b,
                    '/': () => a / b,
                    '%': () => a % b
                };

                stack.push(operations[token]());
            }
        }

        if (stack.length !== 1 || !Number.isFinite(stack[0])) {
            throw new Error('Invalid expression');
        }

        reply(`🧮 *CALCULATOR*\n\n${q} = *${stack[0]}*`);

    } catch (error) {
        reply(`❌ Calculator Error: ${error.message}`);
    }
});

// ═════════ BOT INFORMATION ═════════

cmd({
    pattern: 'owner',
    alias: ['creator'],
    desc: 'Show bot owner information',
    category: 'main',
    react: '👑',
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    reply(
        `╭───〔 *BOT OWNER* 〕───⊷\n\n` +
        `🤖 Bot: ${config.BOT_NAME || 'AHMED-MD'}\n` +
        `👑 Owner: ${config.OWNER_NAME || 'AHMED'}\n` +
        `📞 Contact: ${config.OWNER_NUMBER || 'Not configured'}\n\n` +
        `╰──────────────────`
    );
});

cmd({
    pattern: 'getjid',
    alias: ['jid'],
    desc: 'Get chat JID',
    category: 'tools',
    react: '🆔',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    reply(`🆔 *CHAT JID*\n\n${from}`);
});

// ═════════ SYSTEM INFORMATION ═════════

cmd({
    pattern: 'system',
    alias: ['sysinfo'],
    desc: 'Show system information',
    category: 'main',
    react: '💻',
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    const memory = process.memoryUsage();

    reply(
        `╭───〔 *SYSTEM INFO* 〕───⊷\n\n` +
        `🤖 Bot: ${config.BOT_NAME || 'AHMED-MD'}\n` +
        `📦 Node: ${process.version}\n` +
        `💻 Platform: ${os.platform()}\n` +
        `🏗️ Architecture: ${os.arch()}\n` +
        `🧠 RAM: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB\n` +
        `📊 Bot Memory: ${(memory.rss / 1024 / 1024).toFixed(2)} MB\n` +
        `⏱️ Runtime: ${Math.floor(process.uptime())} seconds\n\n` +
        `╰──────────────────`
    );
});

// ═════════ OWNER RESTART ═════════

cmd({
    pattern: 'restart',
    alias: ['reboot'],
    desc: 'Restart bot',
    category: 'owner',
    react: '♻️',
    filename: __filename
}, async (conn, mek, m, { from, reply, isCreator }) => {
    try {
        if (!isCreator) {
            return reply('❌ This command is only for the bot owner.');
        }

        await reply('♻️ AHMED-MD is restarting...');

        // Fixed PM2 process name; no user-supplied shell command.
        execFile('pm2', ['restart', 'levanter'], (error) => {
            if (error) {
                console.error('PM2 restart error:', error.message);
            }
        });

    } catch (error) {
        reply(`❌ Restart Error: ${error.message}`);
    }
});

// ═════════ END MEGA PLUGIN ═════════
