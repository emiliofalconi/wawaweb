package backend

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	"golang.org/x/crypto/bcrypt"
	_ "modernc.org/sqlite"
)

type DB struct {
	*sql.DB
}

var GlobalDB *DB

func InitDB() (*DB, error) {
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		// En Vercel o entornos Serverless, el filesystem raíz es de solo lectura.
		// Solo /tmp permite lectura y escritura.
		if os.Getenv("VERCEL") != "" || os.Getenv("AWS_LAMBDA_FUNCTION_NAME") != "" {
			dbPath = "/tmp/wawaweb_data.db"
		} else {
			dbPath = "wawaweb_data.db"
		}
	}

	db, err := sql.Open("sqlite", dbPath+"?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)&_pragma=foreign_keys(ON)")
	if err != nil {
		return nil, fmt.Errorf("error al abrir base de datos sqlite: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("error conectando a la base de datos: %w", err)
	}

	wrappedDB := &DB{db}
	if err := wrappedDB.createTables(); err != nil {
		return nil, fmt.Errorf("error inicializando tablas: %w", err)
	}

	if err := wrappedDB.seedInitialData(); err != nil {
		log.Printf("[!] Advertencia al inicializar datos semilla: %v", err)
	}

	GlobalDB = wrappedDB
	log.Printf("[+] Base de datos SQLite activa y migrada en: %s", dbPath)
	return wrappedDB, nil
}

func (db *DB) createTables() error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		full_name TEXT NOT NULL,
		caregiver_role TEXT NOT NULL DEFAULT 'Madre_Primeriza',
		emergency_phone TEXT DEFAULT '911',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS infants (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		baby_name TEXT NOT NULL,
		birth_date TEXT NOT NULL,
		days_old INTEGER DEFAULT 15,
		weight_grams REAL DEFAULT 3200,
		sex TEXT DEFAULT 'Femenino',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS milk_batches (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		infant_id INTEGER NOT NULL,
		extraction_date TEXT NOT NULL,
		volume_ml REAL NOT NULL,
		thermal_location TEXT NOT NULL DEFAULT 'Refrigerador_4C',
		conservation_status TEXT NOT NULL DEFAULT 'Optimo',
		notes TEXT DEFAULT '',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (infant_id) REFERENCES infants(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS milk_consumptions (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		batch_id INTEGER,
		consumption_date TEXT NOT NULL,
		volume_consumed_ml REAL NOT NULL,
		method TEXT DEFAULT 'Biberon_Bioseguro',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS clinical_evaluations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user_id INTEGER NOT NULL,
		infant_id INTEGER NOT NULL,
		evaluation_date TEXT NOT NULL,
		fontanelle_status TEXT NOT NULL,
		oral_mucosa_status TEXT NOT NULL,
		skin_pinch_status TEXT NOT NULL,
		sunken_eyes_status TEXT NOT NULL,
		triage_level TEXT NOT NULL,
		action_taken TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (infant_id) REFERENCES infants(id) ON DELETE CASCADE
	);

	CREATE INDEX IF NOT EXISTS idx_batches_user ON milk_batches(user_id);
	CREATE INDEX IF NOT EXISTS idx_batches_date ON milk_batches(extraction_date);
	CREATE INDEX IF NOT EXISTS idx_evaluations_user ON clinical_evaluations(user_id);
	`
	_, err := db.Exec(schema)
	return err
}

func (db *DB) seedInitialData() error {
	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil // Ya existen datos
	}

	// Crear usuario Demo por defecto
	demoEmail := "demo@wawaweb.org"
	demoPassword := "wawaweb2026"
	hash, err := bcrypt.GenerateFromPassword([]byte(demoPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	res, err := db.Exec(`
		INSERT INTO users (email, password_hash, full_name, caregiver_role, emergency_phone)
		VALUES (?, ?, ?, ?, ?)`,
		demoEmail, string(hash), "Ana María Rodríguez", "Madre_Primeriza", "911",
	)
	if err != nil {
		return err
	}

	userId, _ := res.LastInsertId()

	_, err = db.Exec(`
		INSERT INTO infants (user_id, baby_name, birth_date, days_old, weight_grams, sex)
		VALUES (?, ?, ?, ?, ?, ?)`,
		userId, "Sofía", time.Now().AddDate(0, 0, -15).Format("2006-01-02"), 15, 3200, "Femenino",
	)
	if err != nil {
		return err
	}

	log.Printf("[+] Usuario Demo configurado en Base de Datos: %s (password: %s)", demoEmail, demoPassword)
	return nil
}

