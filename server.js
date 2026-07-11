const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '1986';

// In-memory sessions store
const activeSessions = new Set();

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Database connection
const dbPath = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = 'upload_' + Date.now() + '_' + Math.round(Math.random() * 1E6) + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Leidžiamos tik nuotraukos (jpg, jpeg, png, gif, webp)!'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nereguota arba neteisinga autorizacija' });
  }
  const token = authHeader.split(' ')[1];
  if (activeSessions.has(token)) {
    next();
  } else {
    res.status(401).json({ error: 'Sesija pasibaigė arba neteisinga' });
  }
};

// Endpoints

// Public: Submit contact request
app.post('/api/requests', (req, res) => {
  const { name, phone, message } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Vardas ir telefonas yra privalomi!' });
  }

  const stmt = db.prepare('INSERT INTO requests (name, phone, message) VALUES (?, ?, ?)');
  stmt.run(name, phone, message, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Nepavyko išsaugoti užklausos.' });
    }
    res.status(201).json({ success: true, id: this.lastID });
  });
  stmt.finalize();
});

// Public: Get all images
app.get('/api/images', (req, res) => {
  db.all('SELECT * FROM images ORDER BY uploaded_at DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Nepavyko užkrauti nuotraukų.' });
    }
    res.json(rows);
  });
});

// Public: Admin login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    activeSessions.add(token);
    res.json({ success: true, token });
  } else {
    res.status(401).json({ error: 'Neteisingas slaptažodis!' });
  }
});

// Protected: Get all requests
app.get('/api/requests', authenticate, (req, res) => {
  db.all('SELECT * FROM requests ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Nepavyko užkrauti užklausų.' });
    }
    res.json(rows);
  });
});

// Protected: Update request status or notes
app.patch('/api/requests/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  let query = 'UPDATE requests SET ';
  const params = [];
  const updates = [];

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Nenurodyti jokie pakeitimai' });
  }

  query += updates.join(', ') + ' WHERE id = ?';
  params.push(id);

  db.run(query, params, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Nepavyko atnaujinti užklausos.' });
    }
    res.json({ success: true });
  });
});

// Protected: Delete request
app.delete('/api/requests/:id', authenticate, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM requests WHERE id = ?', id, function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Nepavyko ištrinti užklausos.' });
    }
    res.json({ success: true });
  });
});

// Protected: Upload new image
app.post('/api/images', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nepasirinkta jokia nuotrauka.' });
  }

  const { category, title, description } = req.body;
  const filename = req.file.filename;

  const stmt = db.prepare('INSERT INTO images (filename, category, title, description) VALUES (?, ?, ?, ?)');
  stmt.run(filename, category || 'Kita', title || '', description || '', function(err) {
    if (err) {
      console.error(err);
      // Clean up file if db insert fails
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ error: 'Nepavyko įrašyti nuotraukos į duomenų bazę.' });
    }
    res.status(201).json({ success: true, image: { id: this.lastID, filename, category, title, description } });
  });
  stmt.finalize();
});

// Protected: Delete image
app.delete('/api/images/:id', authenticate, (req, res) => {
  const { id } = req.params;

  db.get('SELECT filename FROM images WHERE id = ?', id, (err, row) => {
    if (err || !row) {
      return res.status(404).json({ error: 'Nuotrauka nerasta.' });
    }

    const filepath = path.join(uploadDir, row.filename);

    db.run('DELETE FROM images WHERE id = ?', id, function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Nepavyko ištrinti nuotraukos iš duomenų bazės.' });
      }

      // Delete file from disk
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }

      res.json({ success: true });
    });
  });
});

// Handle 404 for API, serve index.html for others (supporting HTML5 routing if needed)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Serveris veikia ant porto ${PORT}`);
});
