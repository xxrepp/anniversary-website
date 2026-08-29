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
    heading: 'SELAMAT SATU TAHUN, SAYANGKUUU.',
    body: 'Sepanjang satu tahun, 12 bulan, 365 hari, 8.760 jam, 525.600 menit, 31.536.00 detik waktu yang kita lalui bersama, banyak momen yang kita lewati bersama, banyak momen yang kita abadikan bersama. Terima kasih sudah datang dan mewarnai hidup aku dengan semua warna-warni pelangi yang kamu bawa. Di setiap pertemuan, aku selalu mau mengabadikan momen bersama kamu. Aku gamau ada momen kita yang tertinggal. Kalo kamu bertanya-tanya untuk apa foto terus kalo sama aku, untukk iniii sayangkuuu.',
    quote: 'Memories may fade with time, but pictures and videos let us relive the moments we never want to forget.',
    highlight: 'Proudly present, Memory of Us',
    sign: '— With love, Aldi Kurniawan'
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
    caption: '🤍'
  },

  /* 4 — month by month */
  {
    type: 'months',
    chapter: 'Month by Month',
    note: 'timeline perjalanan kitaa',
    items: [
      {
        m: 'August', y: '2025', note: 'first date kitaaa',
        thumb: 'photos/AUG-1.jpeg',
        photos: [
          { src: 'photos/AUG-1.jpeg', caption: 'aku memberanikan diri untuk ajak kamu selfie' },
          { src: 'photos/AUG-2.jpeg', caption: 'pada saat itu deg-deg an sekalii' },
          { src: 'photos/AUG-3.jpeg', caption: 'keliatan dari muka aku yang sangat canggung dan kamu cantik sekali' }
        ]
      },
      {
        m: 'September', y: '2025', note: 'jalan-jalan pertamaa kitaaa',
        thumb: 'photos/SEP-1.jpeg',
        photos: [
          { src: 'photos/SEP-1.jpeg', caption: 'selfie pertama kitaa setelah jadiann' },
          { src: 'photos/SEP-2.jpeg', caption: 'jalan-jalan ke sekayuu' },
          { src: 'photos/SEP-3.jpeg', caption: 'ngantrii bensin sepulang kerjaa' }
        ]
      },
      {
        m: 'October', y: '2025', note: 'bulan ulang tahun ayangg',
        thumb: 'photos/OCT-1.jpeg',
        photos: [
          { src: 'photos/OCT-1.jpeg', caption: 'ngerayain ultahh ayangg' },
          { src: 'photos/OCT-2.jpeg', caption: 'nongkii di kdh' },
          { src: 'photos/OCT-3.jpeg', caption: 'melukiss di pasar malemm' }
        ]
      },
      {
        m: 'November', y: '2025', note: 'pertamaa kali kita ngonserr',
        thumb: 'photos/NOV-2.jpeg',
        photos: [
          { src: 'photos/NOV-1.jpeg', caption: 'bobooo' },
          { src: 'photos/NOV-2.jpeg', caption: 'jaga stand bersamaa jerukk' },
          { src: 'photos/NOV-3.jpeg', caption: 'ngonserr' }
        ]
      },
      {
        m: 'December', y: '2025', note: 'bulan ulang tahun akuu',
        thumb: 'photos/DEC-2.jpeg',
        photos: [
          { src: 'photos/DEC-1.jpeg', caption: 'jalan ke prabuu nontonn avatarr' },
          { src: 'photos/DEC-2.jpeg', caption: 'disurprisein ayangg ultahh' },
          { src: 'photos/DEC-3.jpeg', caption: 'dikasihh kadoo sama ayangg' }
        ]
      },
      {
        m: 'January', y: '2026', note: 'kitaa nongkii di palembangg',
        thumb: 'photos/JAN-2.jpeg',
        photos: [
          { src: 'photos/JAN-1.jpeg', caption: 'nongkii di kopilogii' },
          { src: 'photos/JAN-2.jpeg', caption: 'nongkii di nakaa' },
          { src: 'photos/JAN-3.jpeg', caption: 'nongkii di musii' }
        ]
      },
      {
        m: 'February', y: '2026', note: 'nongkii dii benoite',
        thumb: 'photos/FEB-2.jpeg',
        photos: [
          { src: 'photos/FEB-1.jpeg', caption: 'ayangg cantikk' },
          { src: 'photos/FEB-2.jpeg', caption: 'foto berduaa' },
          { src: 'photos/FEB-3.jpeg', caption: 'difotoinn ayangg' }
        ]
      },
      {
        m: 'March', y: '2026', note: 'kita nyeblak di prabuu',
        thumb: 'photos/MAR-2.jpeg',
        photos: [
          { src: 'photos/MAR-1.jpeg', caption: 'mam di dpramss' },
          { src: 'photos/MAR-2.jpeg', caption: 'ciapp mengabdii untuk negeyii' },
          { src: 'photos/MAR-3.jpeg', caption: 'puass jalan-jalan ke prabuu' }
        ]
      },
      {
        m: 'April', y: '2026', note: 'kartini & kartono',
        thumb: 'photos/APR-2.jpeg',
        photos: [
          { src: 'photos/APR-1.jpeg', caption: 'mukaa kusam sepulang kerjaa' },
          { src: 'photos/APR-2.jpeg', caption: 'kartini & kartono' },
          { src: 'photos/APR-3.jpeg', caption: 'selfie harii kartinii' }
        ]
      },
      {
        m: 'May', y: '2026', note: 'mei full jalan-jalann',
        thumb: 'photos/MAY-1.jpeg',
        photos: [
          { src: 'photos/MAY-1.jpeg', caption: 'kitaa kehujanann' },
          { src: 'photos/MAY-2.jpeg', caption: 'nangiss habis nontonn film' },
          { src: 'photos/MAY-3.jpeg', caption: 'berkunjungg ke rumah ayangg bersama ortu akuu' }
        ]
      },
      {
        m: 'June', y: '2026', note: 'junii full joggingg',
        thumb: 'photos/JUN-1.jpeg',
        photos: [
          { src: 'photos/JUN-1.jpeg', caption: 'jogging soree' },
          { src: 'photos/JUN-2.jpeg', caption: 'nongkii kopilogii lagii' },
          { src: 'photos/JUN-3.jpeg', caption: 'jogging pagii' }
        ]
      },
      {
        m: 'July', y: '2026', note: 'persiapan latsarr',
        thumb: 'photos/JUL-1.jpeg',
        photos: [
          { src: 'photos/JUL-1.jpeg', caption: 'sebelum botakk' },
          { src: 'photos/JUL-2.jpeg', caption: 'sesudah botakk' },
          { src: 'photos/JUL-3.jpeg', caption: 'latsarr' }
        ]
      }
    ]
  },

  /* 5 — art gallery sphere */
  {
    type: 'gallery',
    chapter: "The Moon Is Beatiful, Isn't it?",
    note: 'galeri pap bidadari akuuu',
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
    note: 'i love about you',
    items: [
      { text: 'aku cinta masakan kamuu' },
      { text: 'aku cinta cara kamu ketawaa' },
      { text: 'aku cinta kerandomann kamuu' },
      { text: 'aku cinta cara kamu perhatian ke akuu' },
      { text: 'aku cinta menghabiskan waktu bersama kamu' },
      { text: 'aku cinta semua hal tentang kamu' }
    ]
  },

  /* 8 — the letter */
  {
    type: 'letter',
    chapter: 'A Letter to You',
    note: 'break the seal',
    body: [
      'Halo sayangku🤍',
      'Selamat satu tahun ayang. Terima kasih untuk 365 hari yang sudah kita lalui bersama. Banyak suka dan duka yang kita lalui bersama, banyak moment yang kita lewatin bersama, banyak obrolan yang sudah kita bicarakan, banyak janji yang sudah kita buat, dan satu komitmen yang kita jaga bersama.',
      'Selama satu tahun ini, aku selalu bersyukur setiap harinya bisa ditemani pasangan yang se MasyaAllah kamu.',
	  'Dan di tahun depan, hubungan kita akan lebih serius lagi. InsyaAllah, di tahun depan kita akan mengusahakan niat baik kita bersama untuk menikah.',
	  'Aku berdoa perjalanan kita di tahun depan dan tahun-tahun selanjutnya selalu dijaga dan dilancarkan, selalu saling mencintai dan mengusahakan satu sama lain.',
	  'Tidak banyak yang bisa aku ucapkan di ucapan anniversary kali ini, selain terima kasih atas kehadiran kamu di hidup aku.' ,
	  "'Kau adalah semua jawaban dari doa yang kupanjatkan, dengan hadirmu di hidupku sudah kumerasa cukup'",
	  "'Hati ini telah menetapkan engkau sosok yang kan temani, di masa ini, masa nanti, dan masa indah lainnya'",
	  'I love you more, sayangku, cintaku, satu-tahunku'
    ],
    sign: '— always, Aldi Kurniawan'
  },

  /* 9 — together now */
  {
    type: 'photo',
    chapter: 'Together Now',
    src: 'photos/7-1.jpeg',
    caption: 'cieee udahh setahunn'
  },

  /* 10 — year two studio */
  {
    type: 'studio',
    chapter: 'Year Two',
    note: 'begins august 30, 2026',
    body: 'mari kita buka lembaran baru untuk tahun kedua dan tahun-tahun selanjutnya. Aku udah sediain photobox untuk kita. Potret pertama kita di tahun kedua.',
    buttonLabel: '📸',
    after: 'Sesi potret yang selalu kucinta'
  },

  /* 11 — back cover */
  {
    type: 'backcover',
    title: 'the end of volume i',
    sub: 'terus bersama di tahun kedua dan tahun-tahun selanjutnya, ya sayang?',
    scrapHint: 'ayoo photobox'
  }
];
