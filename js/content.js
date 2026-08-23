/* ============================================================
   content.js — EDIT THIS FILE. This is the whole scrapbook.

   Every entry below is one PAGE of the book, in order.
   To swap in real photos: drop your JPGs into photos/ and
   change the `src` values. To change words: edit the text.
   You never need to touch the other JS files.

   Page types:
     cover      — the front cover
     intro      — a short opening note
     polaroids  — 2–4 scattered polaroid photos  (items: src/caption/date)
     photo      — one big taped-down photo       (src/caption)
     months     — a grid of month cards
                  (items: m/y/note/thumb/photos[3])
     chat       — favorite chat moments          (items: from 'me'|'you', text, time)
     notes      — little sticky notes            (items: text)
     letter     — a sealed letter (tap the seal) (body: array of paragraphs)
     studio     — the Year Two photo studio page
     backcover  — the back cover (shows Year Two studio photo when taken)

   Keep the total number of pages EVEN so the back cover sits
   on the back of the last sheet.
   ============================================================ */

window.SCRAPBOOK_PAGES = [

  /* 0 — front cover */
  {
    type: 'cover',
    kicker: 'a digital scrapbook',
    title: 'Museum',
    title2: 'of Us',
    sub: 'volume i · our first year',
    hint: 'tap the right edge — it opens'
  },

  /* 1 — opening note */
  {
    type: 'intro',
    heading: 'haloo, ayaanggg.',
    body: 'SELAMAT SATU TAHUNNN. sepanjang satu tahun waktu yang kita lalui bersama, banyak momen yang kita lewati bersama, banyak momen yang kita abadikan bersama. di setiap pertemuan, aku selalu mau mengabadikan momen bersama kamu. kalo kamu bertanya-tanya untuk apa foto terus kalo sama aku, untukk iniii sayangkuuu. SELAMATT DATANGG DI MUSEUM OF US',
    sign: '— With love, Aldi'
  },

  /* 2 — how we started */
  {
    type: 'polaroids',
    chapter: 'How We Started',
    note: 'July 2025',
    items: [
      { src: 'photos/1-1.PNG', caption: 'pertama kali kamu reply sw akuu', date: 'juli 2025', rotate: -4 },
      { src: 'photos/1-2.PNG', caption: 'aku foto kamu diem" karena kita couplee', date: 'juli 2025', rotate: 3 },
      { src: 'photos/1-3.PNG', caption: 'pertama kali kita telponann', date: 'juli 2025', rotate: -2 }
    ]
  },

  /* 3 — one big photo */
  {
    type: 'photo',
    src: 'photos/1-4.JPG',
    caption: 'the first photo I ever took of you — [swap this photo + line]'
  },

  /* 4 — month by month, part one */
  {
    type: 'months',
    chapter: 'Month by Month',
    note: 'part one · aug — jan',
    items: [
      {
        m: 'August', y: '2025', note: 'first date kitaaa',
        thumb: 'photos/AUG-1.jpeg',
        photos: [
          { src: 'photos/AUG-1.jpeg', caption: 'day one' },
          { src: 'photos/AUG-2.jpeg', caption: 'still smiling' },
          { src: 'photos/AUG-3.jpeg', caption: 'already ours' }
        ]
      },
      {
        m: 'September', y: '2025', note: '[one line about september]',
        thumb: 'photos/SEP-1.jpeg',
        photos: [
          { src: 'photos/SEP-1.jpeg', caption: 'selfie pertama kitaa setelah jadiann' },
          { src: 'photos/SEP-2.jpeg', caption: 'jalan-jalan ke sekayuu' },
          { src: 'photos/SEP-3.jpeg', caption: 'ngantrii bensin sepulang kerjaa' }
        ]
      },
      {
        m: 'October', y: '2025', note: '[one line about october]',
        thumb: 'photos/OCT-1.jpeg',
        photos: [
          { src: 'photos/OCT-1.jpeg', caption: 'ngerayain ultahh ayangg' },
          { src: 'photos/OCT-2.jpeg', caption: 'nongkii di kdh' },
          { src: 'photos/OCT-3.jpeg', caption: 'melukiss di pasar malemm' }
        ]
      },
      {
        m: 'November', y: '2025', note: '[one line about november]',
        thumb: 'photos/NOV-2.jpeg',
        photos: [
          { src: 'photos/NOV-1.jpeg', caption: 'bobooo' },
          { src: 'photos/NOV-2.jpeg', caption: 'jaga stand bersamaa jerukk' },
          { src: 'photos/NOV-3.jpeg', caption: 'ngonserr' }
        ]
      },
      {
        m: 'December', y: '2025', note: '[one line about december]',
        thumb: 'photos/DEC-2.jpeg',
        photos: [
          { src: 'photos/DEC-1.jpeg', caption: 'jalan ke prabuu nontonn avatarr' },
          { src: 'photos/DEC-2.jpeg', caption: 'disurprisein ayangg ultahh' },
          { src: 'photos/DEC-3.jpeg', caption: 'dikasihh kadoo sama ayangg' }
        ]
      },
      {
        m: 'January', y: '2026', note: '[one line about january]',
        thumb: 'photos/JAN-2.jpeg',
        photos: [
          { src: 'photos/JAN-1.jpeg', caption: 'nongkii di kopilogii' },
          { src: 'photos/JAN-2.jpeg', caption: 'nongkii di nakaa' },
          { src: 'photos/JAN-3.jpeg', caption: 'nongkii di musii' }
        ]
      }
    ]
  },

  /* 5 — art gallery sphere */
  {
    type: 'gallery',
    chapter: 'An Art Gallery Could Never Be As Unique As You',
    note: 'drag the sphere · tap any photo to open',
    folder: 'art',
    count: 50,
    ext: 'jpeg'
  },

  /* 6 — favorite moments, said over text */
  {
    type: 'chat',
    chapter: 'Pertama kali dipanggil sayangg',
    note: '1 september 2025',
    items: [
      { from: 'you', text: 'allooo sayangg selamatt pagiii, semangatt kerjaa yaa hari iniii..', time: '05.50' },
      { from: 'me',  text: 'hihiii', time: '05.55' },
	  { from: 'me',  text: 'pagiii jugaa sayangg, kamuu jugaa semangatt', time: '05.55' },
      { from: 'you', text: 'hahah butuh energi banget akoh mau ngucapin itu🤣😜', time: '05.56' },
    ]
  },

  /* 7 — little things */
  {
    type: 'notes',
    chapter: 'Little Things',
    note: 'in no particular order',
    items: [
      { text: 'the way you narrate your own cooking' },
      { text: 'your laugh in the quiet parts of movies' },
      { text: '[a little thing you love #3]' },
      { text: '[a little thing you love #4]' },
      { text: '[a little thing you love #5]' },
      { text: '[a little thing you love #6]' }
    ]
  },

  /* 8 — the letter */
  {
    type: 'letter',
    chapter: 'A Letter to You',
    note: 'break the seal',
    body: [
      '[This is where the real letter goes. Write it the way you talk — a year deserves more than a caption.]',
      '[Second paragraph — the thing you have been meaning to say out loud.]'
    ],
    sign: '— always, [your name]'
  },

  /* 9 — together now */
  {
    type: 'photo',
    chapter: 'Together Now',
    src: 'photos/7-1.jpeg',
    caption: 'one year in — [swap this for a recent one of us]'
  },

  /* 10 — year two studio */
  {
    type: 'studio',
    chapter: 'Year Two',
    note: 'begins august 30, 2026',
    body: 'Volume one ends here — which means volume two needs a first photo. Take one right now (or pick one), and it comes framed for the start of our second year. It also gets strapped onto the back cover of this book.',
    buttonLabel: 'open the little photo studio',
    after: 'it makes a picture you can save + post'
  },

  /* 11 — back cover */
  {
    type: 'backcover',
    title: 'the end of volume i',
    sub: 'see you in volume ii · august 30, 2026',
    scrapHint: 'your year-two photo lives here'
  }
];
