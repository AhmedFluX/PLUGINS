const { cmd } = require('../command')

const traits = [
    'Charming ✨', 'Annoying 😈', 'Loyal 🖤', 'Funny 😂', 'Smart 🧠',
    'Courageous 🔥', 'Creative 🎨', 'Honest 🤍', 'Curious 👀', 'Ambitious 👑',
    'Friendly 💗', 'Mysterious 🌑', 'Emotional 🥀', 'Confident 😎', 'Quiet Observer 🦅'
]

const hobbies = [
    'Gaming 🎮', 'Singing 🎤', 'Editing 🎬', 'Music 🎧', 'Reading 📖',
    'Writing ✍️', 'Travelling 🌍', 'Photography 📸', 'Sleeping 💤',
    'Chilling 🖤', 'Poetry 🥀', 'Sports ⚽'
]

const characters = [
    'Calm 🌙', 'Energetic ⚡', 'Patient 🤍', 'Bold 🔥', 'Gentle 💗',
    'Wise 🧠', 'Impulsive 😈', 'Thoughtful 🌌', 'Determined 👑', 'Mysterious 🥷'
]

const moods = [
    'Happy 😁', 'Sad 🥀', 'Chill 😎', 'Romantic 💗',
    'Angry 😤', 'Sleepy 💤', 'Lonely 🌑', 'Undefeated 👑'
]

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const percent = () => Math.floor(Math.random() * 101)
const makeBar = (value) => {
    const filled = Math.round(value / 10)
    return '▰'.repeat(filled) + '▱'.repeat(10 - filled)
}

function getName(q, pushname, quoted) {
    if (q?.trim()) return q.trim()
    if (quoted?.sender) return quoted.pushName || 'User'
    return pushname || 'User'
}

function sendCard(reply, title, rows) {
    const output = [
        `╭━━〔 ${title} 〕━━╮`,
        ...rows.map(l => `┃ ${l}`),
        `╰━━━━━━━━━━━━━━━━━━━━╯`,
        ``,
        `© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
    ].join('\n')
    return reply(output)
}

const checks = [
    {
        pattern: 'ahmiicheck', alias: ['check', 'personality'],
        desc: 'Check a fun personality profile', title: 'AHMED-MD PERSONALITY',
        run: (name) => [
            `*Name:* ${name}`, `*Trait:* ${pick(traits)}`, `*Hobby:* ${pick(hobbies)}`,
            `*Character:* ${pick(characters)}`, `*Mood:* ${pick(moods)}`,
            `*Simp:* ${percent()}%`, `*Good Vibes:* ${percent()}%`,
            `*Intelligence:* ${percent()}%`, `*Luck:* ${percent()}%`
        ]
    },
    {
        pattern: 'aura', desc: 'Check your aura level', title: 'AHMED-MD AURA CHECK',
        run: (name) => {
            const n = percent()
            return [`*Name:* ${name}`, `*Aura:* ${n}%`, `*Power:* ${makeBar(n)}`, `*Title:* ${pick(['LEGEND 👑', 'SILENT KILLER 🥷', 'DARK AURA 🌑', 'MYSTERY PERSON 🌌', 'BORN TO SHINE ✨'])}`]
        }
    },
    {
        pattern: 'attitude', desc: 'Check your attitude level', title: 'AHMED-MD ATTITUDE',
        run: (name) => {
            const n = percent()
            return [`*Name:* ${name}`, `*Attitude:* ${n}%`, `*Level:* ${makeBar(n)}`, `*Style:* ${pick(['BOSS MODE 👑', 'SILENT VIBE 🖤', 'NO FEAR 🔥', 'CHILL MODE 😎'])}`]
        }
    },
    {
        pattern: 'lovecheck', desc: 'Check a fun love percentage', title: 'AHMED-MD LOVE CHECK',
        run: (name) => {
            const n = percent()
            return [`*Name:* ${name}`, `*Love Level:* ${n}%`, `*Love:* ${makeBar(n)}`, `*Vibe:* ${pick(['SOFT HEART 💗', 'LOYAL SOUL 🖤', 'ROMANTIC 🌹', 'SECRET LOVE 🌙'])}`]
        }
    },
    {
        pattern: 'friendcheck', desc: 'Check friendship vibes', title: 'AHMED-MD FRIENDSHIP',
        run: (name) => {
            const n = percent()
            return [`*Name:* ${name}`, `*Friendship:* ${n}%`, `*Bond:* ${makeBar(n)}`, `*Type:* ${pick(['LOYAL FRIEND 🤝', 'FUNNY BESTIE 😂', 'SILENT FRIEND 🖤', 'RARE GEM 💎'])}`]
        }
    },
    {
        pattern: 'iqcheck', desc: 'Check a fictional IQ score', title: 'AHMED-MD IQ CHECK',
        run: (name) => [`*Name:* ${name}`, `*Fictional IQ:* ${Math.floor(70 + Math.random() * 91)}`, `*Brain Vibe:* ${pick(['GENIUS 🧠', 'QUICK THINKER ⚡', 'CREATIVE MIND 🎨', 'DEEP THINKER 🌌'])}`]
    },
    {
        pattern: 'moodcheck', desc: 'Check a random mood', title: 'AHMED-MD MOOD CHECK',
        run: (name) => [`*Name:* ${name}`, `*Mood:* ${pick(moods)}`, `*Energy:* ${percent()}%`, `*Vibe:* ${pick(['MAIN CHARACTER ✨', 'LOWKEY 🌑', 'CHILL SOUL 🌙', 'FULL POWER ⚡'])}`]
    },
    {
        pattern: 'luckcheck', desc: 'Check your random luck', title: 'AHMED-MD LUCK CHECK',
        run: (name) => {
            const n = percent()
            return [`*Name:* ${name}`, `*Luck:* ${n}%`, `*Luck Bar:* ${makeBar(n)}`, `*Fortune:* ${pick(['SUPER LUCKY 🍀', 'GOOD VIBES ✨', 'TRUST YOUR JOURNEY 🌙', 'LEGENDARY MODE 👑'])}`]
        }
    },
    {
        pattern: 'roastme', desc: 'Get a playful roast', title: 'AHMED-MD ROAST MODE',
        run: (name) => [`*Target:* ${name}`, `*Roast:* ${pick(['Tumhara WiFi bhi tumse tez hai 😂', 'Tumhara attitude top class hai, battery 2% 😭', 'Tumhari speed dekh ke slow motion bhi sharma jaye 😂', 'Tum online reh ke bhi offline vibes dete ho 😭'])}`]
    },
    {
        pattern: 'simpcheck', desc: 'Check a fun simp percentage', title: 'AHMED-MD SIMP CHECK',
        run: (name) => {
            const n = percent()
            return [`*Name:* ${name}`, `*Simp Level:* ${n}%`, `*Simp Bar:* ${makeBar(n)}`, `*Status:* ${n > 75 ? 'HEART OVER BRAIN 💗' : n > 40 ? 'MANAGABLE 😎' : 'UNBOTHERED 🖤'}`]
        }
    },
    {
        pattern: 'vibecheck', desc: 'Check your vibe', title: 'AHMED-MD VIBE CHECK',
        run: (name) => [`*Name:* ${name}`, `*Vibe:* ${pick(['DARK AURA 🌑', 'PURE SOUL 🤍', 'AESTHETIC ✨', 'SAD POET 🥀', 'MAIN CHARACTER 👑', 'CHAOTIC ENERGY ⚡'])}`, `*Charisma:* ${percent()}%`, `*Coolness:* ${percent()}%`]
    }
]

for (const check of checks) {
    cmd({
        pattern: check.pattern,
        alias: check.alias || [],
        desc: check.desc,
        category: 'fun',
        react: '🎲',
        filename: __filename
    }, async (conn, mek, m, { q, reply, pushname, quoted }) => {
        try {
            const name = getName(q, pushname, m.quoted)
            await sendCard(reply, check.title, check.run(name))
        } catch (e) {
            console.log('AHMED-MD CHECK ERROR:', e)
            reply('❌ Try again.')
        }
    })
}

cmd({
    pattern: 'ahmiigames',
    alias: ['checkmenu', 'funmenu'],
    desc: 'Show all check commands',
    category: 'fun',
    react: '🎲',
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    await reply(
`╭━━〔 🎲 AHMED-MD CHECK MENU 〕━━╮
┃
┃ *PERSONALITY*
┃ ✦ .ahmiicheck [name]
┃ ✦ .moodcheck [name]
┃ ✦ .vibecheck [name]
┃
┃ *AURA & ATTITUDE*
┃ ✦ .aura [name]
┃ ✦ .attitude [name]
┃ ✦ .luckcheck [name]
┃
┃ *FUN CHECKS*
┃ ✦ .lovecheck [name]
┃ ✦ .friendcheck [name]
┃ ✦ .iqcheck [name]
┃ ✦ .simpcheck [name]
┃ ✦ .roastme [name]
┃
╰━━━━━━━━━━━━━━━━━━━━╯

© 𝐏oᴡᴇʀᴇᴅ 𝐁ʏ 𝐀нᴍᴇᴅ`
    )
}) 
