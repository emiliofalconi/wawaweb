package backend

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

func isValidEmail(email string) bool {
	return emailRegex.MatchString(email)
}

type APIHandler struct {
	db *DB
}

func NewAPIHandler(db *DB) *APIHandler {
	return &APIHandler{db: db}
}

func sendJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

func sendError(w http.ResponseWriter, status int, message string) {
	sendJSON(w, status, map[string]string{"error": message})
}

// EnableCORS permite peticiones seguras desde cualquier origen web
func EnableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// HandleRegister registra un nuevo usuario y su lactante
func (h *APIHandler) HandleRegister(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "Método no permitido")
		return
	}

	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Datos de registro inválidos")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))
	req.FullName = strings.TrimSpace(req.FullName)
	req.BabyName = strings.TrimSpace(req.BabyName)

	if req.FullName == "" || len(req.FullName) < 3 {
		sendError(w, http.StatusBadRequest, "El nombre completo del cuidador debe tener al menos 3 caracteres")
		return
	}
	if !isValidEmail(req.Email) {
		sendError(w, http.StatusBadRequest, "El correo electrónico no tiene un formato válido (ejemplo: usuario@correo.com)")
		return
	}
	if len(req.Password) < 6 {
		sendError(w, http.StatusBadRequest, "La contraseña debe contener al menos 6 caracteres")
		return
	}
	if req.BabyName == "" || len(req.BabyName) < 2 {
		sendError(w, http.StatusBadRequest, "El nombre del recién nacido debe tener al menos 2 caracteres")
		return
	}
	if req.WeightGrams <= 0 {
		sendError(w, http.StatusBadRequest, "El peso del bebé debe ser un valor positivo mayor a 0 gramos (no se permiten números negativos ni cero)")
		return
	}
	if req.WeightGrams < 1500 || req.WeightGrams > 12000 {
		sendError(w, http.StatusBadRequest, "El peso ingresado debe encontrarse en el rango asistencial permitido (entre 1.500 g y 12.000 g)")
		return
	}
	if req.DaysOld < 0 {
		sendError(w, http.StatusBadRequest, "Los días de vida del recién nacido no pueden ser un número negativo")
		return
	}

	if req.BirthDate == "" {
		req.BirthDate = time.Now().Format("2006-01-02")
	} else {
		bDate, err := time.Parse("2006-01-02", req.BirthDate)
		if err != nil {
			sendError(w, http.StatusBadRequest, "El formato de fecha de nacimiento es inválido (debe ser AAAA-MM-DD)")
			return
		}
		if bDate.After(time.Now()) {
			sendError(w, http.StatusBadRequest, "La fecha de nacimiento no puede ser una fecha futura")
			return
		}
	}

	// Verificar si el correo ya existe
	var existingID int64
	err := h.db.QueryRow("SELECT id FROM users WHERE email = ?", req.Email).Scan(&existingID)
	if err == nil {
		sendError(w, http.StatusConflict, "Ya existe una cuenta con este correo electrónico")
		return
	}

	pwdHash, err := HashPassword(req.Password)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error al procesar la contraseña")
		return
	}

	validRoles := map[string]bool{
		"Madre_Primeriza": true,
		"Monoparental":    true,
		"Red_Apoyo":       true,
	}
	if !validRoles[req.CaregiverRole] {
		req.CaregiverRole = "Madre_Primeriza"
	}
	if req.EmergencyPhone == "" {
		req.EmergencyPhone = "911"
	}
	if req.Sex == "" {
		req.Sex = "Femenino"
	}

	// Iniciar transacción
	tx, err := h.db.Begin()
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error en el servidor al iniciar registro")
		return
	}
	defer tx.Rollback()

	resUser, err := tx.Exec(`
		INSERT INTO users (email, password_hash, full_name, caregiver_role, emergency_phone)
		VALUES (?, ?, ?, ?, ?)`,
		req.Email, pwdHash, req.FullName, req.CaregiverRole, req.EmergencyPhone,
	)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error al guardar el usuario")
		return
	}

	userID, _ := resUser.LastInsertId()

	resInfant, err := tx.Exec(`
		INSERT INTO infants (user_id, baby_name, birth_date, days_old, weight_grams, sex)
		VALUES (?, ?, ?, ?, ?, ?)`,
		userID, req.BabyName, req.BirthDate, req.DaysOld, req.WeightGrams, req.Sex,
	)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error al guardar los datos del lactante")
		return
	}

	infantID, _ := resInfant.LastInsertId()

	if err := tx.Commit(); err != nil {
		sendError(w, http.StatusInternalServerError, "Error al confirmar el registro")
		return
	}

	token, err := GenerateToken(userID, req.Email)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error al generar sesión")
		return
	}

	user := User{
		ID:             userID,
		Email:          req.Email,
		FullName:       req.FullName,
		CaregiverRole:  req.CaregiverRole,
		EmergencyPhone: req.EmergencyPhone,
		CreatedAt:      time.Now(),
	}

	infant := &Infant{
		ID:          infantID,
		UserID:      userID,
		BabyName:    req.BabyName,
		BirthDate:   req.BirthDate,
		DaysOld:     req.DaysOld,
		WeightGrams: req.WeightGrams,
		Sex:         req.Sex,
	}

	sendJSON(w, http.StatusCreated, AuthResponse{
		Token:  token,
		User:   user,
		Infant: infant,
	})
}

// HandleLogin autentica un usuario existente
func (h *APIHandler) HandleLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		sendError(w, http.StatusMethodNotAllowed, "Método no permitido")
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		sendError(w, http.StatusBadRequest, "Datos de inicio de sesión inválidos")
		return
	}

	req.Email = strings.TrimSpace(strings.ToLower(req.Email))

	var user User
	var pwdHash string
	err := h.db.QueryRow(`
		SELECT id, email, password_hash, full_name, caregiver_role, emergency_phone, created_at
		FROM users WHERE email = ?`, req.Email,
	).Scan(&user.ID, &user.Email, &pwdHash, &user.FullName, &user.CaregiverRole, &user.EmergencyPhone, &user.CreatedAt)

	if err != nil {
		sendError(w, http.StatusUnauthorized, "Credenciales incorrectas: correo o contraseña inválida")
		return
	}

	if !CheckPasswordHash(req.Password, pwdHash) {
		sendError(w, http.StatusUnauthorized, "Credenciales incorrectas: correo o contraseña inválida")
		return
	}

	// Obtener lactante asociado
	var infant Infant
	errInfant := h.db.QueryRow(`
		SELECT id, user_id, baby_name, birth_date, days_old, weight_grams, sex
		FROM infants WHERE user_id = ? LIMIT 1`, user.ID,
	).Scan(&infant.ID, &infant.UserID, &infant.BabyName, &infant.BirthDate, &infant.DaysOld, &infant.WeightGrams, &infant.Sex)

	var pInfant *Infant
	if errInfant == nil {
		pInfant = &infant
	}

	token, err := GenerateToken(user.ID, user.Email)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error al generar sesión")
		return
	}

	sendJSON(w, http.StatusOK, AuthResponse{
		Token:  token,
		User:   user,
		Infant: pInfant,
	})
}

// HandleMe obtiene el perfil y datos del usuario autenticado
func (h *APIHandler) HandleMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromContext(r.Context())
	if !ok {
		sendError(w, http.StatusUnauthorized, "Sesión no identificada")
		return
	}

	var user User
	err := h.db.QueryRow(`
		SELECT id, email, full_name, caregiver_role, emergency_phone, created_at
		FROM users WHERE id = ?`, userID,
	).Scan(&user.ID, &user.Email, &user.FullName, &user.CaregiverRole, &user.EmergencyPhone, &user.CreatedAt)

	if err != nil {
		sendError(w, http.StatusNotFound, "Usuario no encontrado")
		return
	}

	var infant Infant
	errInfant := h.db.QueryRow(`
		SELECT id, user_id, baby_name, birth_date, days_old, weight_grams, sex
		FROM infants WHERE user_id = ? LIMIT 1`, user.ID,
	).Scan(&infant.ID, &infant.UserID, &infant.BabyName, &infant.BirthDate, &infant.DaysOld, &infant.WeightGrams, &infant.Sex)

	var pInfant *Infant
	if errInfant == nil {
		pInfant = &infant
	}

	sendJSON(w, http.StatusOK, map[string]interface{}{
		"user":   user,
		"infant": pInfant,
	})
}

// HandleProfile actualiza datos del usuario y de su bebé
func (h *APIHandler) HandleProfile(w http.ResponseWriter, r *http.Request) {
	userID, _ := GetUserIDFromContext(r.Context())

	if r.Method == http.MethodPut || r.Method == http.MethodPost {
		var req struct {
			FullName       string  `json:"full_name"`
			CaregiverRole  string  `json:"caregiver_role"`
			EmergencyPhone string  `json:"emergency_phone"`
			BabyName       string  `json:"baby_name"`
			BirthDate      string  `json:"birth_date"`
			DaysOld        int     `json:"days_old"`
			WeightGrams    float64 `json:"weight_grams"`
			Sex            string  `json:"sex"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			sendError(w, http.StatusBadRequest, "Datos inválidos")
			return
		}

		req.FullName = strings.TrimSpace(req.FullName)
		req.BabyName = strings.TrimSpace(req.BabyName)

		if req.FullName == "" || len(req.FullName) < 3 {
			sendError(w, http.StatusBadRequest, "El nombre completo del cuidador debe tener al menos 3 caracteres")
			return
		}
		if req.BabyName == "" || len(req.BabyName) < 2 {
			sendError(w, http.StatusBadRequest, "El nombre del lactante debe tener al menos 2 caracteres")
			return
		}
		if req.WeightGrams <= 0 {
			sendError(w, http.StatusBadRequest, "El peso del bebé debe ser un número positivo mayor a 0 gramos (no se permiten números negativos)")
			return
		}
		if req.WeightGrams < 1500 || req.WeightGrams > 12000 {
			sendError(w, http.StatusBadRequest, "El peso debe encontrarse en el rango asistencial permitido (entre 1.500 g y 12.000 g)")
			return
		}
		if req.DaysOld < 0 {
			sendError(w, http.StatusBadRequest, "Los días de vida del recién nacido no pueden ser negativos")
			return
		}

		_, err := h.db.Exec(`
			UPDATE users SET full_name = ?, caregiver_role = ?, emergency_phone = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?`,
			req.FullName, req.CaregiverRole, req.EmergencyPhone, userID,
		)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Error al actualizar perfil de usuario")
			return
		}

		_, err = h.db.Exec(`
			UPDATE infants SET baby_name = ?, birth_date = ?, days_old = ?, weight_grams = ?, sex = ?, updated_at = CURRENT_TIMESTAMP
			WHERE user_id = ?`,
			req.BabyName, req.BirthDate, req.DaysOld, req.WeightGrams, req.Sex, userID,
		)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Error al actualizar datos del bebé")
			return
		}

		sendJSON(w, http.StatusOK, map[string]string{"message": "Perfil actualizado exitosamente"})
		return
	}

	sendError(w, http.StatusMethodNotAllowed, "Método no permitido")
}

// HandleBatches maneja listar y crear lotes de extracción de leche materna
func (h *APIHandler) HandleBatches(w http.ResponseWriter, r *http.Request) {
	userID, _ := GetUserIDFromContext(r.Context())

	switch r.Method {
	case http.MethodGet:
		rows, err := h.db.Query(`
			SELECT id, user_id, infant_id, extraction_date, volume_ml, thermal_location, conservation_status, notes, created_at
			FROM milk_batches WHERE user_id = ?
			ORDER BY extraction_date ASC`, userID,
		)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Error al consultar banco de leche")
			return
		}
		defer rows.Close()

		batches := []MilkBatch{}
		for rows.Next() {
			var b MilkBatch
			if err := rows.Scan(&b.ID, &b.UserID, &b.InfantID, &b.ExtractionDate, &b.VolumeMl, &b.ThermalLocation, &b.ConservationStatus, &b.Notes, &b.CreatedAt); err == nil {
				batches = append(batches, b)
			}
		}
		sendJSON(w, http.StatusOK, batches)

	case http.MethodPost:
		var b MilkBatch
		if err := json.NewDecoder(r.Body).Decode(&b); err != nil {
			sendError(w, http.StatusBadRequest, "Datos de lote inválidos")
			return
		}

		if b.VolumeMl <= 0 {
			sendError(w, http.StatusBadRequest, "El volumen de leche extraída debe ser un número positivo mayor a 0 ml (no se permiten números negativos ni cero)")
			return
		}
		if b.VolumeMl > 1000 {
			sendError(w, http.StatusBadRequest, "El volumen extraído excede la capacidad máxima fisiológica por sesión (máximo 1,000 ml)")
			return
		}
		if b.ExtractionDate == "" {
			b.ExtractionDate = time.Now().Format(time.RFC3339)
		} else {
			extTime, err := time.Parse(time.RFC3339, b.ExtractionDate)
			if err == nil && extTime.After(time.Now().Add(10*time.Minute)) {
				sendError(w, http.StatusBadRequest, "La fecha y hora de extracción no puede ser futura")
				return
			}
		}
		validLocations := map[string]bool{
			"Ambiente":        true,
			"Refrigerador_4C": true,
			"Congelador_18C":  true,
		}
		if !validLocations[b.ThermalLocation] {
			b.ThermalLocation = "Refrigerador_4C"
		}
		if b.ConservationStatus == "" {
			b.ConservationStatus = "Optimo"
		}

		// Obtener infant_id
		var infantID int64
		_ = h.db.QueryRow("SELECT id FROM infants WHERE user_id = ? LIMIT 1", userID).Scan(&infantID)

		res, err := h.db.Exec(`
			INSERT INTO milk_batches (user_id, infant_id, extraction_date, volume_ml, thermal_location, conservation_status, notes)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
			userID, infantID, b.ExtractionDate, b.VolumeMl, b.ThermalLocation, b.ConservationStatus, b.Notes,
		)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Error al registrar lote en el banco de leche")
			return
		}

		b.ID, _ = res.LastInsertId()
		b.UserID = userID
		b.InfantID = infantID
		sendJSON(w, http.StatusCreated, b)

	default:
		sendError(w, http.StatusMethodNotAllowed, "Método no permitido")
	}
}

// HandleBatchDelete elimina o consume un lote de leche
func (h *APIHandler) HandleBatchDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		sendError(w, http.StatusMethodNotAllowed, "Método no permitido")
		return
	}

	userID, _ := GetUserIDFromContext(r.Context())
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(pathParts) < 3 {
		sendError(w, http.StatusBadRequest, "ID de lote no proporcionado")
		return
	}

	batchID, err := strconv.ParseInt(pathParts[2], 10, 64)
	if err != nil {
		sendError(w, http.StatusBadRequest, "ID de lote inválido")
		return
	}

	res, err := h.db.Exec("DELETE FROM milk_batches WHERE id = ? AND user_id = ?", batchID, userID)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Error al eliminar lote")
		return
	}

	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		sendError(w, http.StatusNotFound, "Lote no encontrado o no pertenece al usuario")
		return
	}

	sendJSON(w, http.StatusOK, map[string]string{"message": "Lote eliminado con éxito"})
}

// HandleConsumptions maneja historial de consumos de leche
func (h *APIHandler) HandleConsumptions(w http.ResponseWriter, r *http.Request) {
	userID, _ := GetUserIDFromContext(r.Context())

	switch r.Method {
	case http.MethodGet:
		rows, err := h.db.Query(`
			SELECT id, user_id, batch_id, consumption_date, volume_consumed_ml, method
			FROM milk_consumptions WHERE user_id = ?
			ORDER BY consumption_date DESC LIMIT 50`, userID,
		)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Error al consultar consumos")
			return
		}
		defer rows.Close()

		consumptions := []MilkConsumption{}
		for rows.Next() {
			var c MilkConsumption
			var batchID sql.NullInt64
			if err := rows.Scan(&c.ID, &c.UserID, &batchID, &c.ConsumptionDate, &c.VolumeConsumedMl, &c.Method); err == nil {
				if batchID.Valid {
					c.BatchID = &batchID.Int64
				}
				consumptions = append(consumptions, c)
			}
		}
		sendJSON(w, http.StatusOK, consumptions)

	case http.MethodPost:
		var c MilkConsumption
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			sendError(w, http.StatusBadRequest, "Datos inválidos")
			return
		}
		if c.VolumeConsumedMl <= 0 {
			sendError(w, http.StatusBadRequest, "El volumen consumido debe ser un número positivo mayor a 0 ml (no se permiten números negativos ni cero)")
			return
		}
		if c.VolumeConsumedMl > 1000 {
			sendError(w, http.StatusBadRequest, "El volumen por toma no puede exceder los 1,000 ml")
			return
		}
		if c.ConsumptionDate == "" {
			c.ConsumptionDate = time.Now().Format(time.RFC3339)
		}
		if c.Method == "" {
			c.Method = "Biberon_Bioseguro"
		}

		res, err := h.db.Exec(`
			INSERT INTO milk_consumptions (user_id, batch_id, consumption_date, volume_consumed_ml, method)
			VALUES (?, ?, ?, ?, ?)`,
			userID, c.BatchID, c.ConsumptionDate, c.VolumeConsumedMl, c.Method,
		)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Error al registrar toma de leche")
			return
		}

		c.ID, _ = res.LastInsertId()
		c.UserID = userID

		// Si se indicó un lote específico, actualizar su stock o marcarlo como Consumido
		if c.BatchID != nil && *c.BatchID > 0 {
			var curVol float64
			if err := h.db.QueryRow("SELECT volume_ml FROM milk_batches WHERE id = ? AND user_id = ?", *c.BatchID, userID).Scan(&curVol); err == nil {
				if c.VolumeConsumedMl >= curVol {
					_, _ = h.db.Exec("UPDATE milk_batches SET conservation_status = 'Consumido', volume_ml = 0 WHERE id = ? AND user_id = ?", *c.BatchID, userID)
				} else {
					newVol := curVol - c.VolumeConsumedMl
					_, _ = h.db.Exec("UPDATE milk_batches SET volume_ml = ? WHERE id = ? AND user_id = ?", newVol, *c.BatchID, userID)
				}
			}
		}

		sendJSON(w, http.StatusCreated, c)

	default:
		sendError(w, http.StatusMethodNotAllowed, "Método no permitido")
	}
}

// HandleEvaluations maneja registro y consulta de triaje neonatal
func (h *APIHandler) HandleEvaluations(w http.ResponseWriter, r *http.Request) {
	userID, _ := GetUserIDFromContext(r.Context())

	switch r.Method {
	case http.MethodGet:
		rows, err := h.db.Query(`
			SELECT id, user_id, infant_id, evaluation_date, fontanelle_status, oral_mucosa_status, skin_pinch_status, sunken_eyes_status, triage_level, action_taken
			FROM clinical_evaluations WHERE user_id = ?
			ORDER BY evaluation_date DESC LIMIT 20`, userID,
		)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Error al consultar triajes")
			return
		}
		defer rows.Close()

		evals := []ClinicalEvaluation{}
		for rows.Next() {
			var ev ClinicalEvaluation
			if err := rows.Scan(&ev.ID, &ev.UserID, &ev.InfantID, &ev.EvaluationDate, &ev.FontanelleStatus, &ev.OralMucosaStatus, &ev.SkinPinchStatus, &ev.SunkenEyesStatus, &ev.TriageLevel, &ev.ActionTaken); err == nil {
				evals = append(evals, ev)
			}
		}
		sendJSON(w, http.StatusOK, evals)

	case http.MethodPost:
		var ev ClinicalEvaluation
		if err := json.NewDecoder(r.Body).Decode(&ev); err != nil {
			sendError(w, http.StatusBadRequest, "Datos de evaluación inválidos")
			return
		}
		if ev.EvaluationDate == "" {
			ev.EvaluationDate = time.Now().Format(time.RFC3339)
		}

		var infantID int64
		_ = h.db.QueryRow("SELECT id FROM infants WHERE user_id = ? LIMIT 1", userID).Scan(&infantID)

		res, err := h.db.Exec(`
			INSERT INTO clinical_evaluations (user_id, infant_id, evaluation_date, fontanelle_status, oral_mucosa_status, skin_pinch_status, sunken_eyes_status, triage_level, action_taken)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			userID, infantID, ev.EvaluationDate, ev.FontanelleStatus, ev.OralMucosaStatus, ev.SkinPinchStatus, ev.SunkenEyesStatus, ev.TriageLevel, ev.ActionTaken,
		)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Error al registrar evaluación neonatal")
			return
		}

		ev.ID, _ = res.LastInsertId()
		ev.UserID = userID
		ev.InfantID = infantID
		sendJSON(w, http.StatusCreated, ev)

	default:
		sendError(w, http.StatusMethodNotAllowed, "Método no permitido")
	}
}

