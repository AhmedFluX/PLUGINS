const { cmd } = require('../command')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))
const cheerio = require('cheerio')

const FOOTER = '© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ'

// ─── TextMaker Engine (ephoto360 / textpro / photooxy) ───
async function textMaker(effect_url, texts) {
    try {
        if (!Array.isArray(texts)) texts = [texts]

        // 1. Get form page
        const getRes = await fetch(effect_url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        })
        const html = await getRes.text()
        const $ = cheerio.load(html)

        const form = $('form')
        let action = form.attr('action') || effect_url
        if (!action.startsWith('http')) {
            const u = new URL(effect_url)
            action = u.origin + action
        }

        const token = $('input[name="token"]').val() || ''
        const build_server = $('input[name="build_server"]').val() || ''
        const build_server_id = $('input[name="build_server_id"]').val() || ''

        // 2. Build form data
        const params = new URLSearchParams()
        params.append('token', token)
        params.append('build_server', build_server)
        params.append('build_server_id', build_server_id)
        texts.forEach(t => params.append('text[]', t))

        // 3. Submit
        const postRes = await fetch(action, {
            method: 'POST',
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Referer': effect_url
            },
            body: params.toString()
        })
        const postHtml = await postRes.text()
        const $$ = cheerio.load(postHtml)

        // 4. Find result image
        let imageUrl = $$('div.btn-group a').attr('href') ||
                       $$('#link-image').val() ||
                       $$('img.thumbnail').attr('src') ||
                       $$('.thumbnail img').attr('src')

        if (imageUrl && !imageUrl.startsWith('http')) {
            const u = new URL(effect_url)
            imageUrl = u.origin + imageUrl
        }

        return { status: !!imageUrl, url: imageUrl }
    } catch (e) {
        console.log('TEXTMAKER ERROR:', e)
        return { status: false, url: null }
    }
}

async function sendEffect(conn, from, mek, reply, effect_url, input, needTwo = false, example = '') {
    if (!input) return reply(`❌ Give me text\n${example ? `Example: ${example}\n\n` : ''}> ${FOOTER}`)

    if (needTwo) {
        const parts = input.split(';')
        if (!parts[0] || !parts[1]) return reply(`❌ Give me 2 texts separated by ;\nExample: ${example}\n\n> ${FOOTER}`)
        input = parts
    }

    const wait = await reply('⏳ Creating your text effect...')
    const { url } = await textMaker(effect_url, input)

    try { await conn.sendMessage(from, { delete: wait.key }) } catch {}

    if (!url) return reply(`❌ Failed to create effect. Try again.\n\n> ${FOOTER}`)

    await conn.sendMessage(from, { image: { url }, caption: `> ${FOOTER}` }, { quoted: mek })
}

// ─── 1. SED - Wet Glass ───
cmd({
    pattern: 'sed',
    desc: 'Sad text effect - Wet Glass',
    category: 'general',
    react: '💔',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await sendEffect(conn, from, mek, reply, 'https://en.ephoto360.com/write-text-on-wet-glass-online-589.html', q, false, '.sed Ahmed')
})

// ─── 2. STEEL ───
cmd({
    pattern: 'steel',
    desc: 'Steel text effect',
    category: 'general',
    react: '⚙️',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await sendEffect(conn, from, mek, reply, 'https://en.ephoto360.com/steel-text-effect-66.html', q, true, '.steel Ahmed;MD')
})

// ─── 3. METALLIC ───
cmd({
    pattern: 'metallic',
    desc: 'Metallic text effect',
    category: 'general',
    react: '✨',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await sendEffect(conn, from, mek, reply, 'https://textpro.me/create-a-metallic-text-effect-free-online-1041.html', q, false, '.metallic Ahmed')
})

// ─── 4. GLITCH ───
cmd({
    pattern: 'glitch',
    desc: 'Glitch text effect',
    category: 'general',
    react: '📺',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await sendEffect(conn, from, mek, reply, 'https://textpro.me/create-glitch-text-effect-style-tik-tok-983.html', q, true, '.glitch Ahmed;MD')
})

// ─── 5. BURN ───
cmd({
    pattern: 'burn',
    desc: 'Burn paper text effect',
    category: 'general',
    react: '🔥',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await sendEffect(conn, from, mek, reply, 'https://photooxy.com/logo-and-text-effects/write-text-on-burn-paper-388.html', q, false, '.burn Ahmed')
})

// ─── 6. 8BIT ───
cmd({
    pattern: '8bit',
    desc: '8 Bit text effect',
    category: 'general',
    react: '🎮',
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    await sendEffect(conn, from, mek, reply, 'https://photooxy.com/logo-and-text-effects/8-bit-text-on-arcade-rift-175.html', q, true, '.8bit Ahmed;MD')
})
