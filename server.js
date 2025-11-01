const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const DB_FILE = path.join(__dirname, 'public', 'database.sqlite');

// Asegurar que exista la carpeta public
if (!fs.existsSync(path.join(__dirname, 'public'))) {
  fs.mkdirSync(path.join(__dirname, 'public'));
}

// Conectar a la base de datos SQLite
const db = new sqlite3.Database(DB_FILE);

app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar la base de datos
db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON;`);

  db.run(`CREATE TABLE IF NOT EXISTS participantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    apellidos TEXT,
    dni TEXT UNIQUE,
    telefono TEXT,
    ciudad TEXT,
    password TEXT,
    imagen TEXT,
    color TEXT,
    fuente TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS carreras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT UNIQUE,
    fecha TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    participante_id INTEGER,
    carrera_id INTEGER,
    dorsal INTEGER,
    FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
    FOREIGN KEY (carrera_id) REFERENCES carreras(id) ON DELETE CASCADE
  )`);

  // Insertar carreras por defecto
  const carreras = [
    ['Barcelona', '2026-01-17'],
    ['Madrid', '2026-02-21'],
    ['Alicante', '2026-02-11'],
    ['Valencia', '2026-03-01'],
    ['Sevilla', '2026-04-04'],
    ['Galicia', '2026-05-16']
  ];
  const stmt = db.prepare(`INSERT OR IGNORE INTO carreras (nombre, fecha) VALUES (?, ?)`);
  carreras.forEach(([n, f]) => stmt.run(n, f));
  stmt.finalize();
});

// --- Endpoints ---

// Inscribir participante y asignar dorsal
app.post('/api/inscribir', (req, res) => {
  const { nombre, apellidos, dni, telefono, ciudad, password } = req.body || {};
  if (!nombre || !apellidos || !dni || !ciudad || !password)
    return res.status(400).json({ error: 'Faltan datos' });

  db.get(`SELECT id FROM carreras WHERE nombre = ?`, [ciudad], (err, carrera) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!carrera) return res.status(400).json({ error: 'Carrera no válida' });

    db.get(`SELECT id FROM participantes WHERE dni = ?`, [dni], (err2, participante) => {
      if (err2) return res.status(500).json({ error: err2.message });

      const insertarInscripcion = (participanteId) => {
        db.get(`SELECT MAX(dorsal) AS maxDorsal FROM inscripciones WHERE carrera_id = ?`, [carrera.id], (err3, row) => {
          if (err3) return res.status(500).json({ error: err3.message });
          const nuevoDorsal = (row && row.maxDorsal) ? row.maxDorsal + 1 : 1;
          db.run(`INSERT INTO inscripciones (participante_id, carrera_id, dorsal) VALUES (?, ?, ?)`,
            [participanteId, carrera.id, nuevoDorsal],
            function (err4) {
              if (err4) return res.status(500).json({ error: err4.message });
              res.json({ participante_id: participanteId, carrera_id: carrera.id, dorsal: nuevoDorsal });
            });
        });
      };

      if (participante) {
        insertarInscripcion(participante.id);
      } else {
        db.run(`INSERT INTO participantes (nombre, apellidos, dni, telefono, ciudad, password, imagen, color, fuente)
                VALUES (?, ?, ?, ?, ?, ?, '', '#7b5cff', 'Arial')`,
          [nombre, apellidos, dni, telefono, ciudad, password],
          function (err5) {
            if (err5) return res.status(500).json({ error: err5.message });
            insertarInscripcion(this.lastID);
          });
      }
    });
  });
});

// Login de participante
app.post('/api/login', (req, res) => {
  const { dni, password } = req.body || {};
  if (!dni || !password) return res.status(400).json({ error: 'Faltan credenciales' });

  db.get(`SELECT p.*, i.dorsal, c.nombre AS carrera
          FROM participantes p
          LEFT JOIN inscripciones i ON i.participante_id = p.id
          LEFT JOIN carreras c ON i.carrera_id = c.id
          WHERE p.dni = ? AND p.password = ?`,
    [dni, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) return res.status(401).json({ error: 'Credenciales incorrectas' });
      res.json(row);
    });
});

// Login de administrador
const ADMIN_USER = 'admin';
const ADMIN_PASS = '123000';
app.post('/api/admin-login', (req, res) => {
  const { user, pass } = req.body || {};
  if (user === ADMIN_USER && pass === ADMIN_PASS) return res.json({ ok: true });
  res.status(401).json({ error: 'Credenciales admin incorrectas' });
});

// Obtener todos los participantes
app.get('/api/participantes', (req, res) => {
  const ciudad = req.query.ciudad;
  let query = `
    SELECT p.id, p.nombre, p.apellidos, p.dni, p.telefono, p.ciudad AS ciudad_participante,
           i.dorsal, c.nombre AS carrera
    FROM participantes p
    LEFT JOIN inscripciones i ON i.participante_id = p.id
    LEFT JOIN carreras c ON i.carrera_id = c.id
  `;
  const params = [];
  if (ciudad && ciudad !== '') {
    query += ' WHERE c.nombre = ?';
    params.push(ciudad);
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Participantes por carrera
app.get('/api/participantes/carrera/:nombre', (req, res) => {
  const nombre = req.params.nombre;
  db.all(`SELECT p.nombre, p.apellidos, p.dni, i.dorsal
          FROM inscripciones i
          JOIN participantes p ON i.participante_id = p.id
          JOIN carreras c ON i.carrera_id = c.id
          WHERE c.nombre = ? ORDER BY i.dorsal`, [nombre], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Actualizar participante
app.put('/api/participante/:id', (req, res) => {
  const id = req.params.id;
  const { telefono, ciudad, imagen, color, fuente } = req.body || {};
  db.run(`UPDATE participantes SET telefono=?, ciudad=?, imagen=?, color=?, fuente=? WHERE id=?`,
    [telefono || '', ciudad || '', imagen || '', color || '', fuente || '', id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ actualizado: this.changes });
    });
});

// Eliminar participante
app.delete('/api/participante/:id', (req, res) => {
  const id = req.params.id;
  db.serialize(() => {
    db.run(`DELETE FROM inscripciones WHERE participante_id = ?`, [id]);
    db.run(`DELETE FROM participantes WHERE id = ?`, [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ eliminado: this.changes });
    });
  });
});

// Listar carreras
app.get('/api/carreras', (req, res) => {
  db.all(`SELECT * FROM carreras ORDER BY id`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows || []);
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});