package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"wawaweb/backend"
)

//go:embed wawaweb-app/*
var content embed.FS

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "darwin":
		cmd = exec.Command("open", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}

func main() {
	fmt.Println("==================================================================")
	fmt.Println("  WAWAWEB - PLATAFORMA DE SALUD DIGITAL (PROYECTO COIL 202715)")
	fmt.Println("  UCAB (Ingeniería Informática) • PUCE (Facultad de Enfermería)")
	fmt.Println("  Servidor Web Escalable con Base de Datos SQLite / 3FN")
	fmt.Println("==================================================================")
	fmt.Println()

	// 1. Inicializar Base de Datos Relacional (SQLite)
	db, err := backend.InitDB()
	if err != nil {
		log.Fatalf("[-] Error fatal inicializando base de datos: %v", err)
	}
	defer db.Close()

	// 2. Cargar frontend embebido
	subFS, err := fs.Sub(content, "wawaweb-app")
	if err != nil {
		log.Fatalf("[-] Error al cargar archivos estáticos embebidos: %v", err)
	}

	// 3. Configurar Rutas de la API y Servidor
	mux := http.NewServeMux()
	api := backend.NewAPIHandler(db)

	// Registrar todas las rutas de la API asistencial
	backend.RegisterRoutes(mux, api)

	// Servidor de archivos estáticos (Frontend SPA)
	fileServer := http.FileServer(http.FS(subFS))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Evitar colisión con rutas de la API
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		fileServer.ServeHTTP(w, r)
	})

	handler := backend.EnableCORS(mux)

	// 4. Configuración de Red para Despliegue en la Web (Cloud / Docker)
	portEnv := os.Getenv("PORT")
	hostEnv := os.Getenv("HOST")
	if hostEnv == "" {
		hostEnv = "0.0.0.0"
	}

	var listener net.Listener
	var serverURL string
	isDesktop := false

	if portEnv != "" {
		// Despliegue en la nube (Render, Railway, Fly.io, Cloud Run)
		addr := fmt.Sprintf("%s:%s", hostEnv, portEnv)
		listener, err = net.Listen("tcp", addr)
		if err != nil {
			log.Fatalf("[-] Error al vincular puerto web %s: %v", addr, err)
		}
		serverURL = fmt.Sprintf("http://localhost:%s/", portEnv)
	} else {
		// Modo local de escritorio: intentar puerto 8080 o puerto dinámico
		listener, err = net.Listen("tcp", "0.0.0.0:8080")
		if err != nil {
			listener, err = net.Listen("tcp", "127.0.0.1:0")
			if err != nil {
				log.Fatalf("[-] Error al vincular listener: %v", err)
			}
		}
		port := listener.Addr().(*net.TCPAddr).Port
		serverURL = fmt.Sprintf("http://localhost:%d/", port)
		isDesktop = true
	}
	defer listener.Close()

	log.Printf("[+] Servidor WawaWeb activo y escuchando en: %s", serverURL)

	// En modo escritorio local sin variable PORT, abrir navegador automáticamente
	if isDesktop && os.Getenv("NO_BROWSER") == "" {
		go func() {
			time.Sleep(500 * time.Millisecond)
			openBrowser(serverURL)
		}()
	}

	server := &http.Server{
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("[i] Sistema listo para producción y despliegue web. Presiona Ctrl+C para finalizar.")
	if err := server.Serve(listener); err != nil && err != http.ErrServerClosed {
		log.Fatalf("[-] Error del servidor: %v", err)
	}
}
