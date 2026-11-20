const libro = new Libro()

cmd({
    pattern: 'libro',
    alias: [],
    desc: 'Search books and Telegram files',
    category: 'download',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { from, q, reply } = context

    const message = {
        data: mek,

        send: async (content, options = {}, category = null) => {
            const quoted = { quoted: mek }

            if (Buffer.isBuffer(content)) {
                const fileName = options.fileName || 'file'
                const mimetype = options.mimetype || 'application/octet-stream'
                const caption = options.caption || ''

                const payload = category === 'image'
                    ? { image: content, mimetype, fileName, caption }
                    : category === 'video'
                    ? { video: content, mimetype, fileName, caption }
                    : category === 'audio'
                    ? { audio: content, mimetype, fileName }
                    : { document: content, mimetype, fileName, caption }

                return conn.sendMessage(from, payload, quoted)
            }

            return conn.sendMessage(
                from,
                { text: String(content) },
                quoted
            )
        }
    }

    try {
        const config = {
            ...process.env,
            ...(context.userConfig || {})
        }

        libro.setContext(config)

        if (!libro.fI) {
            await libro.cIF()
        }

        const inp = (q || '').trim()

        if (!inp) {
            return reply(
                '> Search: `.libro` <query>\n' +
                '> Language: `.libro` <query> `--l` <language>\n' +
                '> Download: `.libro dd` <indices>'
            )
        }

        const arg = inp.split(/\s+/)

        if (arg[0].toLowerCase() === 'dd') {
            const idx = arg.slice(1).join('').split(/[,\s]+/)
            await libro.dSI(message, idx)
            return
        }

        let searchQuery = inp
        libro.cLang = libro.gDefLang()

        const tIdx = arg.indexOf('--l')

        if (tIdx !== -1 && arg[tIdx + 1]) {
            libro.cLang = `&lang=${arg[tIdx + 1]}`
            searchQuery = arg.slice(0, tIdx).join(' ')
        }

        await libro.sIC(message, searchQuery)

    } catch (error) {
        logger.error(`[LIBRO ERROR] ${error.message}`)
        return reply(`Error: ${error.message}`)
    }
})

module.exports = { libro }
