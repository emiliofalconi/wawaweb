package handler

import (
	"net/http"
	"sync"

	"wawaweb/backend"
)

var (
	apiMux  *http.ServeMux
	initErr error
	once    sync.Once
)

func initApp() {
	db, err := backend.InitDB()
	if err != nil {
		initErr = err
		return
	}

	mux := http.NewServeMux()
	api := backend.NewAPIHandler(db)
	backend.RegisterRoutes(mux, api)
	apiMux = mux
}

// Handler es el punto de entrada Serverless invocado por la plataforma Vercel
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(initApp)
	if initErr != nil {
		http.Error(w, `{"error":"Error inicializando base de datos en Vercel: `+initErr.Error()+`"}`, http.StatusInternalServerError)
		return
	}
	apiMux.ServeHTTP(w, r)
}

