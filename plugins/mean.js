const { cmd } = require('../command')

cmd({
    pattern: 'mean',
    alias: [],
    desc: 'Get funny meaning of a word',
    category: 'tools',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { from, q, reply } = context

    try {
        if (!q)
            return reply('It is necessary to send a word!')

        const response = await fetch(
            `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(q)}`
        )

        const json = await response.json()

        if (!json.list || !json.list.length)
            return reply('Oops!!, no results found!')

        return reply(json.list[0].definition)

    } catch (error) {
        console.error('MEAN ERROR:', error)
        return reply('Something went wrong while getting the meaning.')
    }
})

cmd({
    pattern: 'dict',
    alias: [],
    desc: 'Get meaning of a word',
    category: 'tools',
    filename: __filename
}, async (conn, mek, m, context) => {
    const { from, q, reply } = context

    try {
        if (!q)
            return reply('It is necessary to send a word!')

        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`
        )

        const json = await response.json()

        let number = Math.floor(Math.random() * 100)

        if (number % 7 === 0) {
            await reply('There is another command called "mean" which gives funny meanings of words. Try it out!')
        }

        if (!Array.isArray(json) || !json.length)
            return reply('Oops!!, no results found!')

        let msg = ''

        msg += `*${json[0].word}*\n`
        msg += 'Meanings:\n'

        for (let i = 0; i < json[0].meanings.length; i++) {
            msg += '*Part of speech:* ' + `${json[0].meanings[i].partOfSpeech}\n`

            for (let j = 0; j < json[0].meanings[i].definitions.length; j++) {
                const definition = json[0].meanings[i].definitions[j]

                msg += '*Definition:* ' + `${definition.definition}\n`

                if (definition.example)
                    msg += `*Example:* ${definition.example}\n`

                if (definition.synonyms && definition.synonyms.length)
                    msg += `*Synonyms:* ${definition.synonyms.join(', ')}\n`

                if (definition.antonyms && definition.antonyms.length)
                    msg += `*Antonyms:* ${definition.antonyms.join(', ')}\n`
            }

            msg += '=============================\n'
        }

        msg += '=============================\n'

        return reply(msg)

    } catch (error) {
        console.error('DICT ERROR:', error)
        return reply('Something went wrong while getting the dictionary meaning.')
    }
})
