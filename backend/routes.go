package backend

import (
	"net/http"
)

// RegisterRoutes registra todas las rutas asistenciales de la API en el ServeMux
func RegisterRoutes(mux *http.ServeMux, api *APIHandler) {
	// Rutas Públicas de Autenticación
	mux.HandleFunc("/api/auth/register", api.HandleRegister)
	mux.HandleFunc("/api/auth/login", api.HandleLogin)

	// Rutas Protegidas (JWT Middleware)
	mux.HandleFunc("/api/auth/me", AuthMiddleware(api.HandleMe))
	mux.HandleFunc("/api/profile", AuthMiddleware(api.HandleProfile))
	mux.HandleFunc("/api/batches", AuthMiddleware(api.HandleBatches))
	mux.HandleFunc("/api/consumptions", AuthMiddleware(api.HandleConsumptions))
	mux.HandleFunc("/api/evaluations", AuthMiddleware(api.HandleEvaluations))

	// Manejador especial para rutas con ID dinámico como DELETE /api/batches/{id}
	mux.HandleFunc("/api/batches/", AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodDelete {
			api.HandleBatchDelete(w, r)
		} else {
			http.Error(w, "Método no permitido", http.StatusMethodNotAllowed)
		}
	}))
}

