const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'new',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      category TEXT DEFAULT 'Kita',
      title TEXT,
      description TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  const defaultContent = {
    hero_title: 'Profesionalus Plytelių Klijavimas',
    hero_subtitle: 'Aukščiausia kokybė, kruopštus darbas ir dėmesys detalėms jūsų namams.',
    contact_phone_href: '+37060030288',
    contact_phone_text: '+370 600 30288',
    contact_email: 'v.finazonok@gmail.com',
    contact_fb_url: 'https://www.facebook.com/share/1D7EM2oc7U/',
    contact_fb_text: 'Vladislav Finažonok',
    services: JSON.stringify([
      {icon: '🚿', title: 'Vonios Kambariai', desc: 'Pilnas vonios kambario plytelių klijavimas, hidroizoliacija ir paruošimas.'},
      {icon: '🍳', title: 'Virtuvės', desc: 'Virtuvės sienelių ir grindų klijavimas, tikslus pjovimas ir derinimas.'},
      {icon: '🏠', title: 'Grindys ir Terasos', desc: 'Didelių formatų plytelių klijavimas svetainėse, holuose ir lauko terasose.'},
      {icon: '🧱', title: 'Fasadų Apdaila Klinkeriu', desc: 'Kokybiškas fasadų klijavimas klinkerio plytelėmis, užtikrinantis ilgaamžiškumą ir estetiką.'}
    ])
  };

  const stmtContent = db.prepare('INSERT OR IGNORE INTO site_content (key, value) VALUES (?, ?)');
  for (const [key, val] of Object.entries(defaultContent)) {
    stmtContent.run(key, val);
  }
  stmtContent.finalize();

  console.log('Database tables verified/created.');

  // Import existing images from the images directory
  const imagesDir = path.join(__dirname, 'images');
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    const stmt = db.prepare('INSERT OR IGNORE INTO images (filename, category) VALUES (?, ?)');

    let importedCount = 0;
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        // Group by filename prefix or similar, let's keep category default to 'Atlikti darbai'
        stmt.run(file, 'Atlikti darbai');
        importedCount++;
      }
    });

    stmt.finalize();
    console.log(`Imported ${importedCount} existing images into the database.`);
  }

  db.close(() => {
    console.log('Database initialization complete.');
  });
});
