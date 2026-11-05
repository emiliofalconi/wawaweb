package backend

import "time"

type User struct {
	ID             int64     `json:"id"`
	Email          string    `json:"email"`
	FullName       string    `json:"full_name"`
	CaregiverRole  string    `json:"caregiver_role"`
	EmergencyPhone string    `json:"emergency_phone"`
	CreatedAt      time.Time `json:"created_at"`
}

type Infant struct {
	ID          int64   `json:"id"`
	UserID      int64   `json:"user_id"`
	BabyName    string  `json:"baby_name"`
	BirthDate   string  `json:"birth_date"`
	DaysOld     int     `json:"days_old"`
	WeightGrams float64 `json:"weight_grams"`
	Sex         string  `json:"sex"`
}

type MilkBatch struct {
	ID                 int64   `json:"id"`
	UserID             int64   `json:"user_id"`
	InfantID           int64   `json:"infant_id"`
	ExtractionDate     string  `json:"extraction_date"`
	VolumeMl           float64 `json:"volume_ml"`
	ThermalLocation    string  `json:"thermal_location"`
	ConservationStatus string  `json:"conservation_status"`
	Notes              string  `json:"notes"`
	CreatedAt          string  `json:"created_at,omitempty"`
}

type MilkConsumption struct {
	ID               int64   `json:"id"`
	UserID           int64   `json:"user_id"`
	BatchID          *int64  `json:"batch_id,omitempty"`
	ConsumptionDate  string  `json:"consumption_date"`
	VolumeConsumedMl float64 `json:"volume_consumed_ml"`
	Method           string  `json:"method"`
}

type ClinicalEvaluation struct {
	ID               int64  `json:"id"`
	UserID           int64  `json:"user_id"`
	InfantID         int64  `json:"infant_id"`
	EvaluationDate   string `json:"evaluation_date"`
	FontanelleStatus string `json:"fontanelle_status"`
	OralMucosaStatus string `json:"oral_mucosa_status"`
	SkinPinchStatus  string `json:"skin_pinch_status"`
	SunkenEyesStatus string `json:"sunken_eyes_status"`
	TriageLevel      string `json:"triage_level"`
	ActionTaken      string `json:"action_taken"`
}

type RegisterRequest struct {
	Email          string  `json:"email"`
	Password       string  `json:"password"`
	FullName       string  `json:"full_name"`
	CaregiverRole  string  `json:"caregiver_role"`
	EmergencyPhone string  `json:"emergency_phone"`
	BabyName       string  `json:"baby_name"`
	BirthDate      string  `json:"birth_date"`
	DaysOld        int     `json:"days_old"`
	WeightGrams    float64 `json:"weight_grams"`
	Sex            string  `json:"sex"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token  string  `json:"token"`
	User   User    `json:"user"`
	Infant *Infant `json:"infant,omitempty"`
}

