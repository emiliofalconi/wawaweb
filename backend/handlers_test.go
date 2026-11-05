package backend

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
)

func TestValidations(t *testing.T) {
	os.Setenv("DATABASE_PATH", "test_validation.db")
	db, err := InitDB()
	if err != nil {
		t.Fatalf("Error inicializando DB de test: %v", err)
	}
	defer func() {
		db.Close()
		os.Remove("test_validation.db")
		os.Remove("test_validation.db-shm")
		os.Remove("test_validation.db-wal")
	}()

	api := NewAPIHandler(db)

	// 1. Registro con peso negativo
	t.Run("Rechazar peso negativo en registro", func(t *testing.T) {
		body := RegisterRequest{
			Email:       "test@correo.com",
			Password:    "clave123",
			FullName:    "Usuario Prueba",
			BabyName:    "Bebe Test",
			BirthDate:   "2026-10-01",
			WeightGrams: -500, // NEGATIVO
		}
		data, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(data))
		rec := httptest.NewRecorder()

		api.HandleRegister(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("Esperado 400 Bad Request, obtenido: %d", rec.Code)
		}
	})

	// 2. Registro con peso fuera del rango clínico (1500g a 12000g)
	t.Run("Rechazar peso fuera de rango 1500g - 12000g", func(t *testing.T) {
		bodyUnder := RegisterRequest{
			Email:       "bajo@correo.com",
			Password:    "clave123",
			FullName:    "Usuario Prueba",
			BabyName:    "Bebe Bajo Peso",
			BirthDate:   "2026-10-01",
			WeightGrams: 1400, // MENOR A 1500
		}
		dataUnder, _ := json.Marshal(bodyUnder)
		reqUnder := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(dataUnder))
		recUnder := httptest.NewRecorder()
		api.HandleRegister(recUnder, reqUnder)
		if recUnder.Code != http.StatusBadRequest {
			t.Errorf("Esperado 400 para peso < 1500g, obtenido: %d", recUnder.Code)
		}

		bodyOver := RegisterRequest{
			Email:       "sobre@correo.com",
			Password:    "clave123",
			FullName:    "Usuario Prueba",
			BabyName:    "Bebe Sobre Peso",
			BirthDate:   "2026-10-01",
			WeightGrams: 12500, // MAYOR A 12000
		}
		dataOver, _ := json.Marshal(bodyOver)
		reqOver := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(dataOver))
		recOver := httptest.NewRecorder()
		api.HandleRegister(recOver, reqOver)
		if recOver.Code != http.StatusBadRequest {
			t.Errorf("Esperado 400 para peso > 12000g, obtenido: %d", recOver.Code)
		}
	})

	// 3. Registro con correo inválido
	t.Run("Rechazar correo inválido", func(t *testing.T) {
		body := RegisterRequest{
			Email:       "correo-invalido-sin-arroba",
			Password:    "clave123",
			FullName:    "Usuario Prueba",
			BabyName:    "Bebe Test",
			WeightGrams: 3200,
		}
		data, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(data))
		rec := httptest.NewRecorder()

		api.HandleRegister(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("Esperado 400 Bad Request, obtenido: %d", rec.Code)
		}
	})

	// 4. Registro con fecha futura
	t.Run("Rechazar fecha de nacimiento futura", func(t *testing.T) {
		body := RegisterRequest{
			Email:       "test2@correo.com",
			Password:    "clave123",
			FullName:    "Usuario Prueba",
			BabyName:    "Bebe Test",
			BirthDate:   "2099-01-01", // FUTURO
			WeightGrams: 3200,
		}
		data, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewReader(data))
		rec := httptest.NewRecorder()

		api.HandleRegister(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("Esperado 400 Bad Request, obtenido: %d", rec.Code)
		}
	})

	// 5. Lote con volumen negativo o cero
	t.Run("Rechazar lote con volumen negativo", func(t *testing.T) {
		body := MilkBatch{
			VolumeMl: -50.0, // NEGATIVO
		}
		data, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/batches", bytes.NewReader(data))
		rec := httptest.NewRecorder()

		api.HandleBatches(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("Esperado 400 Bad Request, obtenido: %d", rec.Code)
		}
	})

	// 6. Consumo con volumen negativo
	t.Run("Rechazar consumo con volumen negativo", func(t *testing.T) {
		body := MilkConsumption{
			VolumeConsumedMl: -30.0, // NEGATIVO
		}
		data, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/consumptions", bytes.NewReader(data))
		rec := httptest.NewRecorder()

		api.HandleConsumptions(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("Esperado 400 Bad Request, obtenido: %d", rec.Code)
		}
	})

	// 7. Registro de lotes con ubicación Ambiente y asignación secuencial de Lote FIFO
	t.Run("Registrar lote en Ambiente con ID secuencial", func(t *testing.T) {
		var demoUserID int64
		_ = db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&demoUserID)

		body := MilkBatch{
			VolumeMl:        80.0,
			ThermalLocation: "Ambiente",
			Notes:           "Extracción al despertar",
		}
		data, _ := json.Marshal(body)
		req := httptest.NewRequest(http.MethodPost, "/api/batches", bytes.NewReader(data))
		req = req.WithContext(context.WithValue(req.Context(), UserContextKey, demoUserID))
		rec := httptest.NewRecorder()

		api.HandleBatches(rec, req)
		if rec.Code != http.StatusCreated {
			t.Fatalf("Esperado 201 Created, obtenido: %d, body: %s", rec.Code, rec.Body.String())
		}

		var created MilkBatch
		if err := json.NewDecoder(rec.Body).Decode(&created); err != nil {
			t.Fatalf("Error decodificando respuesta: %v", err)
		}
		if created.ID <= 0 {
			t.Errorf("Esperado ID secuencial > 0, obtenido: %d", created.ID)
		}
		if created.ThermalLocation != "Ambiente" {
			t.Errorf("Esperado ubicacion 'Ambiente', obtenido: %s", created.ThermalLocation)
		}
	})

	// 8. Confirmar consumo de lote y verificar actualización en BD a Consumido
	t.Run("Confirmar consumo y actualizar estado del lote en BD", func(t *testing.T) {
		var demoUserID int64
		_ = db.QueryRow("SELECT id FROM users LIMIT 1").Scan(&demoUserID)

		// 1. Crear lote de 60 ml
		batchBody := MilkBatch{
			VolumeMl:        60.0,
			ThermalLocation: "Refrigerador_4C",
		}
		dataB, _ := json.Marshal(batchBody)
		reqB := httptest.NewRequest(http.MethodPost, "/api/batches", bytes.NewReader(dataB))
		reqB = reqB.WithContext(context.WithValue(reqB.Context(), UserContextKey, demoUserID))
		recB := httptest.NewRecorder()
		api.HandleBatches(recB, reqB)

		var createdB MilkBatch
		_ = json.NewDecoder(recB.Body).Decode(&createdB)

		// 2. Consumir los 60 ml
		consBody := MilkConsumption{
			BatchID:          &createdB.ID,
			VolumeConsumedMl: 60.0,
			Method:           "Biberon_Bioseguro",
		}
		dataC, _ := json.Marshal(consBody)
		reqC := httptest.NewRequest(http.MethodPost, "/api/consumptions", bytes.NewReader(dataC))
		reqC = reqC.WithContext(context.WithValue(reqC.Context(), UserContextKey, demoUserID))
		recC := httptest.NewRecorder()
		api.HandleConsumptions(recC, reqC)

		if recC.Code != http.StatusCreated {
			t.Fatalf("Esperado 201 Created para consumo, obtenido: %d", recC.Code)
		}

		// 3. Verificar que el lote esté marcado como 'Consumido'
		var status string
		_ = db.QueryRow("SELECT conservation_status FROM milk_batches WHERE id = ?", createdB.ID).Scan(&status)
		if status != "Consumido" {
			t.Errorf("Esperado estado 'Consumido', obtenido: '%s'", status)
		}
	})
}
