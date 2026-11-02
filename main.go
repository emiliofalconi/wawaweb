package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"time"
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
	fmt.Println("==================================================================")
	fmt.Println()

	subFS, err := fs.Sub(content, "wawaweb-app")
	if err != nil {
		fmt.Printf("Error al cargar archivos embebidos: %v\n", err)
		return
	}

	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		listener, err = net.Listen("tcp", ":8080")
		if err != nil {
			fmt.Printf("Error al iniciar servidor: %v\n", err)
			return
		}
	}
	defer listener.Close()

	port := listener.Addr().(*net.TCPAddr).Port
	url := fmt.Sprintf("http://localhost:%d/", port)

	fmt.Printf("[+] Servidor de produccion embebido activo en: %s\n", url)
	fmt.Println("[+] Abriendo interfaz interactiva de WawaWeb en tu navegador...")

	go func() {
		time.Sleep(400 * time.Millisecond)
		openBrowser(url)
	}()

	fmt.Println("[i] Sistema en ejecucion. Para cerrarlo, presiona Ctrl+C en esta consola.")
	fmt.Println()

	httpFS := http.FileServer(http.FS(subFS))
	if err := http.Serve(listener, httpFS); err != nil {
		fmt.Printf("Servidor finalizado: %v\n", err)
	}
}
