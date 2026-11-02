# WawaWeb: Plataforma de Salud Digital (COIL 202715)

> **Plataforma Web para la Educacion en Lactancia Materna, Gestion Trazable del Banco de Leche en el Hogar Mediante Principios FIFO y Sistema de Alerta Neonatal Temprana**

---

## 1. Informacion Institucional y Equipo del Proyecto

* **Instituciones Participantes:**
  * **Universidad Catolica Andres Bello (UCAB) – Extension Guayana (Venezuela)**  
    Facultad de Ingenieria – Escuela de Ingenieria Informatica  
    Catedra: Investigacion de Operaciones / Salud Digital
  * **Pontificia Universidad Catolica del Ecuador (PUCE) – Quito (Ecuador)**  
    Facultad de Enfermeria – Carrera de Enfermeria  
    Catedra: Salud Digital
* **Programa Academico:** Cooperacion Internacional Colaborativa en Linea (**Proyecto COIL 202715**)
* **Docentes Coordinadores:**
  * **UCAB:** Prof. Luz E. Medina C.
  * **PUCE:** Catedra de Salud Digital (Facultad de Enfermeria)
* **Participantes de Ingenieria Informatica (UCAB - Venezuela):**
  * Falconi Silveira, Emilio Jose (C.I.: V-30.366.046)
  * Gomez Arevalo, Carlos Alberto (C.I.: V-27.975.316)
  * Lara Aguilar, Andres Alejandro (C.I.: V-30.857.186)
* **Participantes de Enfermeria (PUCE - Ecuador):**
  * Avila Zambrano, Madelaine Lizeth
  * Cadena Quintuna, Mateo Daniel
  * Cevallos Parra, Emily Alejandra
  * Jacome Bosquez, Kimberlly Johanna
  * Pulamarin Arellano, Neyzer Alexander
  * Quinchimbla Llulluma, Amanda Brigitte
  * Ramirez Suntaxi, Victoria
  * Urgilez Segovia, Karen Lucia

---

## 2. Descripcion del Sistema

WawaWeb es una aplicacion web interactiva de salud digital concebida para brindar soporte a madres primerizas, familias monoparentales y redes de apoyo en el manejo integral del banco de leche humana casero y la deteccion temprana de complicaciones en el recien nacido.

### Modulos Principales:
1. **Dashboard Asistencial:** Indicador de stock total disponible en mililitros y onzas fluidas. Destaca mediante cola de prioridad el **"Frasco Prioritario Hoy"** con el lote viable mas antiguo y su tiempo restante de estabilidad.
2. **Motor de Inventario FIFO (PEPS):** Implementacion algoritmica del principio logistico *First In, First Out*. Ordena los lotes por estampa de tiempo cronologica, previniendo que recipientes antiguos queden olvidados en el fondo del congelador.
3. **Registro de Nuevas Extracciones:** Formulario de captura rapida con generacion automatica de identificador de lote (#Lote), selector termico (Refrigerador 4 °C vs. Congelador -18 °C) y conversion automatica a unidades domesticas.
4. **Calculadora Volumétrica Pediatrica:** Estimacion clinica basada en la directriz internacional de 150 ml/kg/dia segun peso y tomas diarias, desglosando la dosis en biberon, onzas fluidas, jeringas graduadas (10 ml) y cucharaditas (5 ml).
5. **Calendario Semaforico de Frescura:** Matriz interactiva que categoriza los lotes segun estabilidad termica:
   * **Verde (Optimo):** Menos de 48 h en refrigeracion o menos de 3 meses en congelacion.
   * **Amarillo (Consumo Prioritario):** 48 a 72 h en refrigeracion o proximo al limite.
   * **Rojo (Caducidad / Descarte):** Mas de 72 a 96 h en refrigeracion.
6. **Guia de Temperado Bioseguro:** Protocolo paso a paso para descongelacion gradual en frio y bano maria pasivo tibio, con advertencia expresa de prohibicion de hornos microondas o fuego directo. Incluye un temporizador interactivo de 10 minutos con aviso sonoro.
7. **Tamizaje Visual de Alarma Neonatal (AIEPI / OMS):** Evaluacion de cuatro signos semiologicos mayores (fontanela anterior, mucosas orales, signo del pliegue cutaneo y enoftalmos/lagrimas) con clasificacion en tiempo real (Normal, Alerta Temprana, Emergencia Medica) y enlace directo de llamada al 911.
8. **Generador de Reportes Clinicos:** Funcion de impresion formal con formato estandarizado para presentar al pediatra tratante.

---

## 3. Estructura del Repositorio

```text
wawaweb/
├── index.html                   # Interfaz de usuario Single Page Application (SPA)
├── app.js                       # Motores logicos: FIFO, Calculadora, Triaje y Persistencia
├── styles.css                   # Hoja de estilos responsiva (Mobile-First)
├── manifest.json                # Configuracion PWA para dispositivos moviles
├── main.go                      # Servidor nativo ligero con assets embebidos (Go)
├── iniciar_wawaweb.bat          # Script de ejecucion inmediata en Windows
├── docs/                        # Documentacion academica formal y reportes
│   ├── WawaWeb_octubre2026.pdf  # Informe de Analisis de Proyecto (Normas APA)
│   ├── WawaWeb_octubre2026.docx # Version editable del informe academico
│   ├── Plan_de_Sprints_WawaWeb_UCAB_Venezuela.docx # Cronograma detallado de Sprints
│   └── build_complete_wawaweb_system.py # Generador automatizado de la documentacion
└── README.md                    # Documentacion general del repositorio
```

---

## 4. Instrucciones de Ejecucion Local

### Opcion A: Ejecucion Directa en Navegador (Sin dependencias)
1. Clona el repositorio:
   ```bash
   git clone https://github.com/emiliofalconi/wawaweb.git
   cd wawaweb
   ```
2. Abre el archivo `index.html` en Google Chrome, Mozilla Firefox, Microsoft Edge o Safari:
   * En Windows: Haz doble clic sobre `iniciar_wawaweb.bat` o sobre `index.html`.

### Opcion B: Servidor Nativo en Go
Si cuentas con Go instalado en tu sistema:
```bash
go run main.go
```
El servidor se iniciara en un puerto local disponible y abrira de forma automatica la aplicacion en tu navegador.

---

## 5. Cronograma de Sprints (Tercer Parcial)
* **Fecha Limite de Entrega Definitiva:** 16 de Noviembre de 2026
* **Sprint 1 & 2:** Levantamiento clinico, modelo MER 3FN y diseno asistencial en Miro (Terminado).
* **Sprint 3:** Algoritmo FIFO de lotes y matriz de calendario semaforico (Terminado).
* **Sprint 4:** Calculadora volumetrica pediatrica y conversor de medidas caseras (Terminado).
* **Sprint 5:** Integracion de Dashboard, registro de tomas y guia de bano maria seguro (En Progreso).
* **Sprint 6:** Pruebas piloto de usabilidad mediante Escala SUS con madres voluntarias (Por Hacer).

---

## 6. Licencia y Marco Etico
Proyecto desarrollado con fines academicos y de investigacion comunitaria bajo las directrices del proyecto COIL 202715. Cumple con los principios de proteccion de datos personales y etica en investigacion en salud de la Organizacion Mundial de la Salud (OMS).
