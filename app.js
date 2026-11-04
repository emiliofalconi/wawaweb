/* ==========================================================================
   WawaWeb - Motor Lógico y Controlador de Aplicación
   Proyecto COIL 202715 (UCAB Venezuela - PUCE Ecuador)
   Versión Profesional sin Emojis
   ========================================================================== */

/**
 * Gestor de Persistencia y Modelo Relacional (3FN) en LocalStorage
 */
const StorageManager = {
  KEYS: {
    USUARIO: 'wawaweb_usuario',
    LACTANTE: 'wawaweb_lactante',
    LOTES: 'wawaweb_lotes',
    CONSUMOS: 'wawaweb_consumos',
    EVALUACIONES: 'wawaweb_evaluaciones',
    CONFIG: 'wawaweb_config'
  },

  init() {
    if (!localStorage.getItem(this.KEYS.USUARIO)) {
      this.seedDefaultData();
    }
  },

  seedDefaultData() {
    const usuario = {
      id_usuario: 1,
      nombre_completo: "Ana María Rodríguez",
      correo_electronico: "ana.rodriguez@wawaweb.org",
      rol_cuidador: "Madre_Primeriza",
      telefono_emergencia: "911",
      fecha_registro: new Date().toISOString()
    };

    const lactante = {
      id_lactante: 1,
      id_usuario: 1,
      nombre_bebe: "Sofía",
      fecha_nacimiento: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      edad_dias: 15,
      peso_gramos: 3200,
      sexo: "Femenino"
    };

    // Crear lotes de extracción realistas (12h, 36h, 52h y 98h)
    const now = Date.now();
    const lotes = [
      {
        id_lote: 1,
        id_lactante: 1,
        fecha_hora_extraccion: new Date(now - 74 * 3600 * 1000).toISOString(),
        volumen_ml: 50.0,
        ubicacion_termica: "Refrigerador_4C",
        estado_conservacion: "Caducado",
        notas_observacion: "Extracción vespertina con sacaleches manual."
      },
      {
        id_lote: 2,
        id_lactante: 1,
        fecha_hora_extraccion: new Date(now - 50 * 3600 * 1000).toISOString(),
        volumen_ml: 65.0,
        ubicacion_termica: "Refrigerador_4C",
        estado_conservacion: "Prioritario",
        notas_observacion: "Seno izquierdo tras toma."
      },
      {
        id_lote: 3,
        id_lactante: 1,
        fecha_hora_extraccion: new Date(now - 28 * 3600 * 1000).toISOString(),
        volumen_ml: 70.0,
        ubicacion_termica: "Refrigerador_4C",
        estado_conservacion: "Optimo",
        notas_observacion: "Extracción matutina óptima."
      },
      {
        id_lote: 4,
        id_lactante: 1,
        fecha_hora_extraccion: new Date(now - 14 * 3600 * 1000).toISOString(),
        volumen_ml: 60.0,
        ubicacion_termica: "Refrigerador_4C",
        estado_conservacion: "Optimo",
        notas_observacion: "Frasco hermético de vidrio estéril."
      },
      {
        id_lote: 5,
        id_lactante: 1,
        fecha_hora_extraccion: new Date(now - 480 * 3600 * 1000).toISOString(),
        volumen_ml: 90.0,
        ubicacion_termica: "Congelador_18C",
        estado_conservacion: "Optimo",
        notas_observacion: "Bolsa térmica para congelación profunda."
      }
    ];

    const consumos = [
      {
        id_consumo: 1,
        id_lote: 99,
        fecha_hora_consumo: new Date(now - 8 * 3600 * 1000).toISOString(),
        volumen_ingerido_ml: 60.0,
        temperatura_temperado_ok: true,
        tiempo_temperado_min: 12,
        metodo: "biberon_lote"
      }
    ];

    const evaluaciones = [
      {
        id_evaluacion: 1,
        id_lactante: 1,
        fecha_hora_evaluacion: new Date(now - 24 * 3600 * 1000).toISOString(),
        estado_fontanela: "Normal",
        estado_mucosas: "Humeda",
        signo_pliegue: "Normal_Inmediato",
        estado_ojos: "Normales",
        nivel_clasificacion: "Normal",
        derivo_urgencia: false
      }
    ];

    localStorage.setItem(this.KEYS.USUARIO, JSON.stringify(usuario));
    localStorage.setItem(this.KEYS.LACTANTE, JSON.stringify(lactante));
    localStorage.setItem(this.KEYS.LOTES, JSON.stringify(lotes));
    localStorage.setItem(this.KEYS.CONSUMOS, JSON.stringify(consumos));
    localStorage.setItem(this.KEYS.EVALUACIONES, JSON.stringify(evaluaciones));
  },

  get(key) {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  },

  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  resetAll() {
    localStorage.clear();
    this.seedDefaultData();
  }
};

/**
 * Motor FIFO (First In, First Out / PEPS) y Trazabilidad Térmica
 */
const FIFOEngine = {
  LIMITS: {
    REFRIGERADOR_HOURS: 96,     // 4 días máximo
    REFRIGERADOR_YELLOW: 48,    // 48h a 72h prioritario
    REFRIGERADOR_RED: 72,       // >72h riesgo microbiológico
    CONGELADOR_DAYS: 180,       // 6 meses
    CONGELADOR_YELLOW_DAYS: 90  // 3 meses
  },

  getActiveBatches() {
    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];
    const active = lotes.filter(l => l.estado_conservacion !== "Consumido");
    active.sort((a, b) => new Date(a.fecha_hora_extraccion) - new Date(b.fecha_hora_extraccion));
    return active;
  },

  getBatchStatus(lote) {
    const now = Date.now();
    const extTime = new Date(lote.fecha_hora_extraccion).getTime();
    const diffHours = (now - extTime) / (3600 * 1000);
    const diffDays = diffHours / 24;

    if (lote.ubicacion_termica === "Refrigerador_4C") {
      const remainingHours = Math.max(0, this.LIMITS.REFRIGERADOR_HOURS - diffHours);
      if (diffHours < this.LIMITS.REFRIGERADOR_YELLOW) {
        return {
          state: "green",
          label: "Óptimo",
          hoursElapsed: Math.round(diffHours),
          remainingHours: Math.round(remainingHours),
          isExpired: false,
          recommendation: "Conservación ideal. Mantener al fondo del estante central."
        };
      } else if (diffHours < this.LIMITS.REFRIGERADOR_RED) {
        return {
          state: "yellow",
          label: "Consumo Prioritario",
          hoursElapsed: Math.round(diffHours),
          remainingHours: Math.round(remainingHours),
          isExpired: false,
          recommendation: "Consumir en las próximas 24 horas o congelar de inmediato."
        };
      } else {
        return {
          state: "red",
          label: diffHours >= this.LIMITS.REFRIGERADOR_HOURS ? "Caducado (Descarte)" : "Límite Crítico (>72h)",
          hoursElapsed: Math.round(diffHours),
          remainingHours: Math.round(remainingHours),
          isExpired: diffHours >= this.LIMITS.REFRIGERADOR_HOURS,
          recommendation: "Riesgo de proliferación bacteriana. Descartar si supera las 96 horas."
        };
      }
    } else {
      const remainingDays = Math.max(0, this.LIMITS.CONGELADOR_DAYS - diffDays);
      if (diffDays < this.LIMITS.CONGELADOR_YELLOW_DAYS) {
        return {
          state: "green",
          label: "Óptimo (Congelado)",
          hoursElapsed: Math.round(diffHours),
          remainingHours: Math.round(remainingDays * 24),
          isExpired: false,
          recommendation: "Máxima estabilidad lipídica e inmunológica a -18 °C."
        };
      } else if (diffDays < this.LIMITS.CONGELADOR_DAYS) {
        return {
          state: "yellow",
          label: "Próximo a Límite",
          hoursElapsed: Math.round(diffHours),
          remainingHours: Math.round(remainingDays * 24),
          isExpired: false,
          recommendation: "Programar su descongelación lenta en refrigerador para toma semanal."
        };
      } else {
        return {
          state: "red",
          label: "Caducado (>6 meses)",
          hoursElapsed: Math.round(diffHours),
          remainingHours: 0,
          isExpired: true,
          recommendation: "Excedió el tiempo seguro. Proceder al descarte."
        };
      }
    }
  },

  getPriorityBatch() {
    const active = this.getActiveBatches();
    if (active.length === 0) return null;

    for (let lote of active) {
      const status = this.getBatchStatus(lote);
      if (!status.isExpired) {
        return { lote, status };
      }
    }
    return { lote: active[0], status: this.getBatchStatus(active[0]) };
  },

  addBatch(batchData) {
    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];
    const newId = lotes.length > 0 ? Math.max(...lotes.map(l => l.id_lote)) + 1 : 1;
    
    const newBatch = {
      id_lote: newId,
      id_lactante: 1,
      fecha_hora_extraccion: batchData.fecha_hora_extraccion || new Date().toISOString(),
      volumen_ml: parseFloat(batchData.volumen_ml),
      ubicacion_termica: batchData.ubicacion_termica || "Refrigerador_4C",
      estado_conservacion: "Optimo",
      notas_observacion: batchData.notas_observacion || ""
    };

    lotes.push(newBatch);
    StorageManager.set(StorageManager.KEYS.LOTES, lotes);
    return newBatch;
  },

  consumeBatch(loteId, volumenConsumido, tempOk, tiempoMin, metodo) {
    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];
    const index = lotes.findIndex(l => l.id_lote === loteId);
    if (index === -1) return false;

    const lote = lotes[index];
    const consumos = StorageManager.get(StorageManager.KEYS.CONSUMOS) || [];
    const newConsumoId = consumos.length > 0 ? Math.max(...consumos.map(c => c.id_consumo)) + 1 : 1;

    consumos.push({
      id_consumo: newConsumoId,
      id_lote: loteId,
      fecha_hora_consumo: new Date().toISOString(),
      volumen_ingerido_ml: parseFloat(volumenConsumido),
      temperatura_temperado_ok: !!tempOk,
      tiempo_temperado_min: parseInt(tiempoMin) || 10,
      metodo: metodo || "biberon_lote"
    });
    StorageManager.set(StorageManager.KEYS.CONSUMOS, consumos);

    if (parseFloat(volumenConsumido) >= lote.volumen_ml) {
      lote.estado_conservacion = "Consumido";
    } else {
      lote.volumen_ml = Math.round((lote.volumen_ml - parseFloat(volumenConsumido)) * 10) / 10;
    }

    StorageManager.set(StorageManager.KEYS.LOTES, lotes);
    return true;
  },

  transferToFreezer(loteId) {
    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];
    const lote = lotes.find(l => l.id_lote === loteId);
    if (lote) {
      lote.ubicacion_termica = "Congelador_18C";
      lote.notas_observacion = (lote.notas_observacion ? lote.notas_observacion + " - " : "") + 
        `Transferido a congelador el ${new Date().toLocaleDateString('es')}`;
      StorageManager.set(StorageManager.KEYS.LOTES, lotes);
      return true;
    }
    return false;
  },

  discardBatch(loteId, razon) {
    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];
    const lote = lotes.find(l => l.id_lote === loteId);
    if (lote) {
      lote.estado_conservacion = "Caducado";
      lote.notas_observacion = (lote.notas_observacion ? lote.notas_observacion + " - " : "") + 
        `Descartado por: ${razon || 'Caducidad biológica'} (${new Date().toLocaleDateString('es')})`;
      StorageManager.set(StorageManager.KEYS.LOTES, lotes);
      return true;
    }
    return false;
  }
};

/**
 * Calculadora Pediátrica de Ingesta Volumétrica y Conversor a Utensilios Domésticos
 */
const IntakeCalculator = {
  COEF_ML_KG_DIA: 150,
  FL_OZ_TO_ML: 29.5735,
  SYRINGE_10ML: 10.0,
  TEASPOON_5ML: 5.0,

  calculate(pesoGramos, tomasPorDia = 8) {
    const pesoKg = Math.max(1.0, pesoGramos / 1000);
    const volumenTotalDia = Math.round(pesoKg * this.COEF_ML_KG_DIA);
    const volumenPorToma = Math.round(volumenTotalDia / tomasPorDia);
    const enOnzas = (volumenPorToma / this.FL_OZ_TO_ML).toFixed(1);
    const jeringas10ml = (volumenPorToma / this.SYRINGE_10ML).toFixed(1);
    const cucharaditas5ml = Math.round(volumenPorToma / this.TEASPOON_5ML);

    return {
      pesoKg,
      volumenTotalDia,
      volumenPorToma,
      enOnzas,
      jeringas10ml,
      cucharaditas5ml,
      tomasPorDia
    };
  },

  convertDomesticToMl(type, qty) {
    const q = parseFloat(qty) || 0;
    switch (type) {
      case 'oz':
        return Math.round(q * this.FL_OZ_TO_ML);
      case 'jeringa10':
        return Math.round(q * 10);
      case 'cucharadita5':
        return Math.round(q * 5);
      case 'cuchara15':
        return Math.round(q * 15);
      default:
        return Math.round(q);
    }
  }
};

/**
 * Evaluador de Triaje Clínico de Alarma Neonatal (AIEPI / OMS)
 */
const NeonatalTriage = {
  evaluate(answers) {
    let dangerCount = 0;
    let alertCount = 0;

    for (let key in answers) {
      if (answers[key] === 'danger') dangerCount++;
      if (answers[key] === 'alert') alertCount++;
    }

    if (dangerCount >= 1) {
      return {
        level: "danger",
        title: "EMERGENCIA MÉDICA NEONATAL",
        description: "Se evidencian signos clínicos compatibles con deshidratación severa o choque hipovolémico. El neonato requiere atención pediátrica presencial inmediata.",
        actionRequired: "Contactar de urgencia al 911 o acudir inmediatamente a la guardia pediátrica más cercana.",
        showCallButton: true
      };
    } else if (alertCount >= 2) {
      return {
        level: "alert",
        title: "ALERTA TEMPRANA - MONITOREO ESTRICTO",
        description: "Se detectan dos o más signos de deshidratación leve a moderada. El lactante se encuentra en riesgo de deterioro hidroelectrolítico.",
        actionRequired: "Ofrecer tomas al pecho cada 1.5 a 2 horas. Verificar presencia de al menos 6 pañales mojados con orina clara en 24h. Si no mejora en 4 horas, consultar al pediatra.",
        showCallButton: false
      };
    } else if (alertCount === 1) {
      return {
        level: "alert",
        title: "VIGILANCIA PREVENTIVA EN EL HOGAR",
        description: "Se observa un signo aislado de alerta. Vigilar tolerancia oral, frecuencia de micción y llanto con lágrimas.",
        actionRequired: "Mantener hidratación a libre demanda e hidratar a la madre lactante.",
        showCallButton: false
      };
    } else {
      return {
        level: "normal",
        title: "ESTADO CLÍNICO ÓPTIMO (HIDRATADO)",
        description: "Fontanela normotensa, mucosas húmedas, turgencia elástica inmediata y lágrimas presentes. El lactante no muestra signos de alarma neonatal.",
        actionRequired: "Continuar con la lactancia materna exclusiva a libre demanda (8 a 12 tomas diarias).",
        showCallButton: false
      };
    }
  }
};

/**
 * Controlador de Sonidos y Notificaciones (Web Audio API)
 */
const SoundEffects = {
  playChime(type = 'success') {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'alarm') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      // Ignorar bloqueos de audio automático del navegador
    }
  }
};

/**
 * Controlador Principal de la Interfaz de Usuario (UIController)
 */
const UIController = {
  currentScreen: 'screen-dashboard',
  timerInterval: null,
  timerSecondsRemaining: 600,
  isTimerRunning: false,
  selectedCalendarDate: new Date(),

  init() {
    StorageManager.init();
    this.initTheme();
    this.bindEvents();
    this.refreshAllUI();
    this.initCalendar();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('wawaweb_theme') || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.applyTheme(savedTheme);
  },

  toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    localStorage.setItem('wawaweb_theme', next);
    this.showToast(next === 'dark' ? 'Modo noche activado' : 'Modo cálido activado');
  },

  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      const iconMoon = document.getElementById('theme-icon-moon');
      const iconSun = document.getElementById('theme-icon-sun');
      if (iconMoon) iconMoon.style.display = 'none';
      if (iconSun) iconSun.style.display = 'block';
    } else {
      document.documentElement.removeAttribute('data-theme');
      const iconMoon = document.getElementById('theme-icon-moon');
      const iconSun = document.getElementById('theme-icon-sun');
      if (iconMoon) iconMoon.style.display = 'block';
      if (iconSun) iconSun.style.display = 'none';
    }
  },

  bindEvents() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const screenId = btn.getAttribute('data-screen');
        if (screenId) this.switchScreen(screenId);
      });
    });

    const inpPeso = document.getElementById('calc-inp-peso');
    const inpTomas = document.getElementById('calc-inp-tomas');
    if (inpPeso) inpPeso.addEventListener('input', () => this.updateCalculatorView());
    if (inpTomas) inpTomas.addEventListener('input', () => this.updateCalculatorView());

    document.querySelectorAll('.quick-vol-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const add = parseFloat(btn.getAttribute('data-val')) || 0;
        const inp = document.getElementById('ext-inp-vol');
        if (inp) {
          inp.value = add;
          this.updateExtractionPreview();
        }
      });
    });

    const inpExtVol = document.getElementById('ext-inp-vol');
    if (inpExtVol) inpExtVol.addEventListener('input', () => this.updateExtractionPreview());

    document.querySelectorAll('.filter-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        this.renderInventoryList(filter);
      });
    });
  },

  switchScreen(screenId) {
    this.currentScreen = screenId;

    document.querySelectorAll('.nav-tab-btn').forEach(b => {
      if (b.getAttribute('data-screen') === screenId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    document.querySelectorAll('.app-screen').forEach(scr => {
      scr.classList.remove('active-screen');
    });

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active-screen');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (screenId === 'screen-dashboard') this.renderDashboard();
    if (screenId === 'screen-inventory') this.renderInventoryList('all');
    if (screenId === 'screen-intake-history') this.renderIntakeHistory();
    if (screenId === 'screen-calendar') this.renderCalendarDays();
    if (screenId === 'screen-calculator') this.updateCalculatorView();
    if (screenId === 'screen-profile') this.renderProfileForm();
  },

  refreshAllUI() {
    this.renderHeaderMeta();
    this.renderDashboard();
    this.renderInventoryList('all');
    this.renderIntakeHistory();
    this.updateCalculatorView();
    this.updateExtractionPreview();
    this.renderProfileForm();
  },

  renderHeaderMeta() {
    const lactante = StorageManager.get(StorageManager.KEYS.LACTANTE);
    if (!lactante) return;

    // Calcular días de vida basados en la fecha de nacimiento si está disponible
    let diasVida = lactante.edad_dias || 15;
    if (lactante.fecha_nacimiento) {
      const birth = new Date(lactante.fecha_nacimiento).getTime();
      const diffDays = Math.floor((Date.now() - birth) / (24 * 3600 * 1000));
      if (!isNaN(diffDays) && diffDays >= 0) diasVida = diffDays;
    }

    const elBabyName = document.querySelectorAll('.baby-display-name');
    elBabyName.forEach(el => el.innerText = lactante.nombre_bebe);

    const coilPill = document.querySelector('.coil-pill span');
    if (coilPill) {
      coilPill.innerHTML = `Paciente: <span class="baby-display-name">${lactante.nombre_bebe}</span> (${diasVida} d)`;
    }

    const heroDesc = document.querySelector('#screen-dashboard .hero-desc');
    if (heroDesc) {
      const pesoFormatted = Number(lactante.peso_gramos).toLocaleString('es');
      heroDesc.innerText = `${diasVida} días de vida • ${pesoFormatted} g • Régimen: Lactancia Materna Exclusiva`;
    }
  },

  renderDashboard() {
    const activeBatches = FIFOEngine.getActiveBatches();
    const priority = FIFOEngine.getPriorityBatch();

    let totalMl = 0;
    let refriMl = 0;
    let freezerMl = 0;

    activeBatches.forEach(b => {
      totalMl += b.volumen_ml;
      if (b.ubicacion_termica === "Refrigerador_4C") refriMl += b.volumen_ml;
      else freezerMl += b.volumen_ml;
    });

    const totalOz = (totalMl / IntakeCalculator.FL_OZ_TO_ML).toFixed(1);

    const elStockMl = document.getElementById('dash-stock-ml');
    const elStockOz = document.getElementById('dash-stock-oz');
    const elRefriBadge = document.getElementById('dash-refri-badge');
    const elFreezerBadge = document.getElementById('dash-freezer-badge');

    if (elStockMl) elStockMl.innerText = `${Math.round(totalMl)} ml`;
    if (elStockOz) elStockOz.innerText = `${totalOz} oz`;
    if (elRefriBadge) elRefriBadge.innerText = `Refri: ${Math.round(refriMl)} ml`;
    if (elFreezerBadge) elFreezerBadge.innerText = `Congelador: ${Math.round(freezerMl)} ml`;

    const fifoContainer = document.getElementById('dash-fifo-container');
    if (!fifoContainer) return;

    if (!priority) {
      fifoContainer.innerHTML = `
        <div class="fifo-primary-card" style="border-color: var(--neutral-300); background: var(--neutral-50);">
          <div class="fifo-flag" style="background: var(--neutral-500);">Inventario Vacío</div>
          <div class="fifo-card-title" style="color: var(--neutral-700);">No hay lotes disponibles</div>
          <div class="fifo-card-subtitle">Registra una nueva extracción para activar la cola de prioridad FIFO.</div>
          <button class="btn-primary" onclick="UIController.switchScreen('screen-extraction')">Registrar Primera Extracción</button>
        </div>
      `;
      return;
    }

    const { lote, status } = priority;
    const isFreezer = lote.ubicacion_termica === "Congelador_18C";
    const locText = isFreezer ? "Congelador (-18 °C)" : "Refrigerador (4 °C)";

    fifoContainer.innerHTML = `
      <div class="fifo-primary-card">
        <div class="fifo-flag">Principio FIFO (PEPS) - Lote Prioritario</div>
        <div class="fifo-card-title">Frasco Prioritario para la Próxima Toma</div>
        <div class="fifo-card-subtitle">
          Seleccionado automáticamente por ser la extracción viable más antigua. Consumir este frasco primero previene la caducidad microbiológica en el fondo.
        </div>

        <div class="fifo-card-meta">
          <div>
            <div class="fifo-lot-code">LOTE #${String(lote.id_lote).padStart(2, '0')}</div>
            <div style="font-size: 12px; color: var(--neutral-600); font-weight: 600; margin-top: 2px;">
              ${locText} - <strong>${lote.volumen_ml} ml</strong> (${(lote.volumen_ml / 29.57).toFixed(1)} oz)
            </div>
          </div>
          <div class="fifo-countdown">
            <div class="fifo-countdown-time">${status.remainingHours > 0 ? `${status.remainingHours}h restantes` : 'Límite superado'}</div>
            <div class="fifo-countdown-lbl">Edad: ${status.hoursElapsed}h desde extracción</div>
          </div>
        </div>

        <div class="fifo-actions-row">
          <button class="btn-fifo-consume" onclick="UIController.openConsumeModal(${lote.id_lote})">
            Despachar y Consumir Lote
          </button>
          ${!isFreezer ? `
            <button class="btn-fifo-transfer" onclick="UIController.handleTransferToFreezer(${lote.id_lote})">
              Congelar
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  renderInventoryList(filter = 'all') {
    const container = document.getElementById('inventory-list-container');
    if (!container) return;

    let lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];

    if (filter === 'refri') {
      lotes = lotes.filter(l => l.ubicacion_termica === "Refrigerador_4C" && l.estado_conservacion !== "Consumido");
    } else if (filter === 'freezer') {
      lotes = lotes.filter(l => l.ubicacion_termica === "Congelador_18C" && l.estado_conservacion !== "Consumido");
    } else if (filter === 'consumed') {
      lotes = lotes.filter(l => l.estado_conservacion === "Consumido");
    } else {
      lotes = lotes.filter(l => l.estado_conservacion !== "Consumido");
      lotes.sort((a, b) => new Date(a.fecha_hora_extraccion) - new Date(b.fecha_hora_extraccion));
    }

    if (lotes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--neutral-500);">
          <div style="font-size: 15px; font-weight: 700;">No hay frascos en esta sección</div>
          <p style="font-size: 12.5px; margin-top: 4px;">Usa el botón de abajo para registrar una nueva extracción.</p>
        </div>
      `;
      return;
    }

    let html = '';
    lotes.forEach((lote, index) => {
      const status = FIFOEngine.getBatchStatus(lote);
      const isConsumed = lote.estado_conservacion === "Consumido";
      const badgeClass = isConsumed ? 'badge-consumed' : `badge-${status.state}`;
      const cardStateClass = isConsumed ? '' : `state-${status.state}`;

      const dateStr = new Date(lote.fecha_hora_extraccion).toLocaleString('es', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      html += `
        <div class="batch-item-card ${cardStateClass}">
          <div class="batch-card-header">
            <div class="batch-id-tag">
              LOTE #${String(lote.id_lote).padStart(2, '0')}
              ${!isConsumed ? `<span class="fifo-order-badge">Posición FIFO #${index + 1}</span>` : ''}
            </div>
            <span class="batch-status-badge ${badgeClass}">${isConsumed ? 'Consumido' : status.label}</span>
          </div>

          <div class="batch-card-body">
            <div><strong>Volumen:</strong> ${lote.volumen_ml} ml (${(lote.volumen_ml / 29.57).toFixed(1)} oz)</div>
            <div><strong>Ubicación:</strong> ${lote.ubicacion_termica === 'Refrigerador_4C' ? 'Refrigerador (4 °C)' : 'Congelador (-18 °C)'}</div>
            <div><strong>Extraído:</strong> ${dateStr}</div>
            <div><strong>Estabilidad:</strong> ${isConsumed ? 'Histórico' : `${status.remainingHours}h de vida útil`}</div>
          </div>

          ${lote.notas_observacion ? `
            <div style="font-size: 11.5px; color: var(--neutral-500); font-style: italic; margin-bottom: 10px;">
              Nota: ${lote.notas_observacion}
            </div>
          ` : ''}

          ${!isConsumed ? `
            <div class="batch-card-actions">
              <button class="btn-card-action primary-consume" onclick="UIController.openConsumeModal(${lote.id_lote})">
                Consumir
              </button>
              ${lote.ubicacion_termica === 'Refrigerador_4C' ? `
                <button class="btn-card-action" onclick="UIController.handleTransferToFreezer(${lote.id_lote})">
                  Congelar
                </button>
              ` : ''}
              <button class="btn-card-action danger-discard" onclick="UIController.handleDiscard(${lote.id_lote})">
                Descartar
              </button>
            </div>
          ` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  },

  updateExtractionPreview() {
    const vol = parseFloat(document.getElementById('ext-inp-vol')?.value) || 0;
    const temp = document.getElementById('ext-sel-temp')?.value || "Refrigerador_4C";
    const previewBox = document.getElementById('ext-preview-text');
    if (!previewBox) return;

    const oz = (vol / IntakeCalculator.FL_OZ_TO_ML).toFixed(1);
    const jeringas = Math.round(vol / 10);
    const cuch = Math.round(vol / 5);

    const maxTime = temp === "Refrigerador_4C" ? "Hasta 4 días (96 h a 4 °C)" : "Hasta 6 meses (-18 °C)";

    previewBox.innerHTML = `
      <strong>${vol} ml</strong> equivalen a <strong>${oz} fl oz</strong>, ${jeringas} jeringas graduadas (10 ml) o ${cuch} cucharaditas.<br>
      Caducidad estimada: <strong>${maxTime}</strong> en zona óptima.
    `;
  },

  handleSaveExtraction(e) {
    if (e) e.preventDefault();
    const vol = parseFloat(document.getElementById('ext-inp-vol').value);
    const temp = document.getElementById('ext-sel-temp').value;
    const dateVal = document.getElementById('ext-inp-datetime').value;
    const notes = document.getElementById('ext-inp-notes').value;

    if (!vol || vol <= 0) {
      alert("Por favor introduce un volumen válido de leche extraída.");
      return;
    }

    const newBatch = FIFOEngine.addBatch({
      volumen_ml: vol,
      ubicacion_termica: temp,
      fecha_hora_extraccion: dateVal ? new Date(dateVal).toISOString() : new Date().toISOString(),
      notas_observacion: notes
    });

    SoundEffects.playChime('success');
    this.showToast(`Lote #${String(newBatch.id_lote).padStart(2, '0')} guardado en cola FIFO.`);
    this.refreshAllUI();
    this.switchScreen('screen-dashboard');
  },

  updateCalculatorView() {
    const inpPeso = document.getElementById('calc-inp-peso');
    const inpTomas = document.getElementById('calc-inp-tomas');
    if (!inpPeso || !inpTomas) return;

    const pesoGramos = parseFloat(inpPeso.value) || 3200;
    const tomas = parseInt(inpTomas.value) || 8;

    const res = IntakeCalculator.calculate(pesoGramos, tomas);

    const valToma = document.getElementById('calc-res-toma-ml');
    const valTotal = document.getElementById('calc-res-total-dia');
    const valOz = document.getElementById('calc-equiv-oz');
    const valJer = document.getElementById('calc-equiv-jeringa');
    const valCuch = document.getElementById('calc-equiv-cuch');

    if (valToma) valToma.innerText = `${res.volumenPorToma} ml / toma`;
    if (valTotal) valTotal.innerText = `Requerimiento diario: ${res.volumenTotalDia} ml (${(res.volumenTotalDia / 29.57).toFixed(1)} oz) en ${res.tomasPorDia} tomas`;
    if (valOz) valOz.innerText = `${res.enOnzas} fl oz (onzas fluidas)`;
    if (valJer) valJer.innerText = `${res.jeringas10ml} jeringas de 10 ml graduadas`;
    if (valCuch) valCuch.innerText = `${res.cucharaditas5ml} cucharaditas dosificadoras (5 ml c/u)`;
  },

  openConsumeModal(loteId) {
    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];
    const lote = lotes.find(l => l.id_lote === loteId);
    if (!lote) return;

    const modal = document.getElementById('consume-modal');
    if (!modal) return;

    document.getElementById('modal-consume-lote-id').value = loteId;
    document.getElementById('modal-consume-lotename').innerText = `LOTE #${String(lote.id_lote).padStart(2, '0')} (${lote.volumen_ml} ml disponibles)`;
    document.getElementById('modal-consume-vol').value = lote.volumen_ml;
    document.getElementById('modal-consume-vol').max = lote.volumen_ml;

    modal.classList.add('show');
  },

  openDirectIntakeModal() {
    const priority = FIFOEngine.getPriorityBatch();
    if (priority) {
      this.openConsumeModal(priority.lote.id_lote);
    } else {
      const activeBatches = FIFOEngine.getActiveBatches();
      if (activeBatches.length > 0) {
        this.openConsumeModal(activeBatches[0].id_lote);
      } else {
        alert("No hay lotes de leche materna disponibles en el inventario. Registra una nueva extracción primero.");
        this.switchScreen('screen-extraction');
      }
    }
  },

  closeConsumeModal() {
    const modal = document.getElementById('consume-modal');
    if (modal) modal.classList.remove('show');
  },

  confirmConsumeFromModal() {
    const loteId = parseInt(document.getElementById('modal-consume-lote-id').value);
    const vol = parseFloat(document.getElementById('modal-consume-vol').value);
    const tempOk = document.getElementById('modal-consume-temp-check').checked;
    const tiempo = document.getElementById('modal-consume-time').value;
    const metodoEl = document.getElementById('modal-consume-method');
    const metodo = metodoEl ? metodoEl.value : 'biberon_lote';

    if (!vol || vol <= 0) {
      alert("Por favor indica el volumen suministrado.");
      return;
    }

    FIFOEngine.consumeBatch(loteId, vol, tempOk, tiempo, metodo);
    this.closeConsumeModal();
    SoundEffects.playChime('success');
    this.showToast(`Lote #${String(loteId).padStart(2, '0')} despachado (${vol} ml). Historial actualizado.`);
    this.refreshAllUI();
  },

  handleTransferToFreezer(loteId) {
    if (confirm(`¿Transferir el Lote #${String(loteId).padStart(2, '0')} al congelador (-18 °C) para extender su viabilidad a 6 meses?`)) {
      FIFOEngine.transferToFreezer(loteId);
      SoundEffects.playChime('success');
      this.showToast(`Lote #${String(loteId).padStart(2, '0')} transferido al congelador.`);
      this.refreshAllUI();
    }
  },

  handleDiscard(loteId) {
    const reason = prompt("Indica el motivo de descarte (ej. Superó 96 horas, rotura de cadena de frío):", "Superó ventana segura de conservación");
    if (reason !== null) {
      FIFOEngine.discardBatch(loteId, reason);
      SoundEffects.playChime('alarm');
      this.showToast(`Lote #${String(loteId).padStart(2, '0')} descartado por bioseguridad.`);
      this.refreshAllUI();
    }
  },

  toggleTimer() {
    if (this.isTimerRunning) {
      clearInterval(this.timerInterval);
      this.isTimerRunning = false;
      document.getElementById('btn-timer-start').innerText = "Reanudar";
      document.getElementById('btn-timer-start').classList.remove('btn-pause');
    } else {
      this.isTimerRunning = true;
      document.getElementById('btn-timer-start').innerText = "Pausar";
      document.getElementById('btn-timer-start').classList.add('btn-pause');

      this.timerInterval = setInterval(() => {
        if (this.timerSecondsRemaining > 0) {
          this.timerSecondsRemaining--;
          this.renderTimerDisplay();
        } else {
          clearInterval(this.timerInterval);
          this.isTimerRunning = false;
          SoundEffects.playChime('alarm');
          alert("Atención: Tiempo cumplido. La leche ha alcanzado la temperatura adecuada en baño maría pasivo. Verifica una gota en el dorso de la muñeca antes de alimentar.");
          this.resetTimer();
        }
      }, 1000);
    }
  },

  resetTimer() {
    clearInterval(this.timerInterval);
    this.isTimerRunning = false;
    this.timerSecondsRemaining = 600;
    const btn = document.getElementById('btn-timer-start');
    if (btn) {
      btn.innerText = "Iniciar (10 min)";
      btn.classList.remove('btn-pause');
    }
    this.renderTimerDisplay();
  },

  renderTimerDisplay() {
    const m = Math.floor(this.timerSecondsRemaining / 60);
    const s = this.timerSecondsRemaining % 60;
    const display = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const el = document.getElementById('timer-display');
    if (el) el.innerText = display;
  },

  selectedTriage: {
    fontanela: 'normal',
    mucosas: 'normal',
    pliegue: 'normal',
    ojos: 'normal'
  },

  setTriageAnswer(signKey, value, btnEl) {
    this.selectedTriage[signKey] = value;

    const parent = btnEl.parentElement;
    parent.querySelectorAll('.triage-option-btn').forEach(b => {
      b.className = 'triage-option-btn';
    });

    if (value === 'normal') btnEl.classList.add('selected-normal');
    if (value === 'alert') btnEl.classList.add('selected-alert');
    if (value === 'danger') btnEl.classList.add('selected-danger');

    this.computeTriageResult();
  },

  computeTriageResult() {
    const res = NeonatalTriage.evaluate(this.selectedTriage);
    const box = document.getElementById('triage-result-card');
    if (!box) return;

    box.className = `triage-diagnosis-box show state-${res.level}`;
    box.innerHTML = `
      <div class="diag-title">${res.title}</div>
      <div class="diag-desc">${res.description}</div>
      <div style="font-weight: 700; margin-bottom: 12px; font-size: 13.5px;">Acción Clínica Indicada: ${res.actionRequired}</div>
      ${res.showCallButton ? `
        <a href="tel:911" class="btn-emergency-call" onclick="SoundEffects.playChime('alarm')">
          Llamar Directamente a Emergencias Pediátricas (911)
        </a>
      ` : ''}
    `;

    if (res.level === 'danger') {
      SoundEffects.playChime('alarm');
    }
  },

  saveTriageEvaluation() {
    const res = NeonatalTriage.evaluate(this.selectedTriage);
    const evaluaciones = StorageManager.get(StorageManager.KEYS.EVALUACIONES) || [];
    const newId = evaluaciones.length > 0 ? Math.max(...evaluaciones.map(e => e.id_evaluacion)) + 1 : 1;

    evaluaciones.push({
      id_evaluacion: newId,
      id_lactante: 1,
      fecha_hora_evaluacion: new Date().toISOString(),
      estado_fontanela: this.selectedTriage.fontanela,
      estado_mucosas: this.selectedTriage.mucosas,
      signo_pliegue: this.selectedTriage.pliegue,
      estado_ojos: this.selectedTriage.ojos,
      nivel_clasificacion: res.level,
      derivo_urgencia: res.level === 'danger'
    });

    StorageManager.set(StorageManager.KEYS.EVALUACIONES, evaluaciones);
    SoundEffects.playChime('success');
    this.showToast("Evaluación clínica guardada en el historial del lactante.");
  },

  initCalendar() {
    this.renderCalendarDays();
  },

  renderCalendarDays() {
    const grid = document.getElementById('calendar-days-grid');
    const monthTitle = document.getElementById('calendar-month-title');
    if (!grid || !monthTitle) return;

    const year = this.selectedCalendarDate.getFullYear();
    const month = this.selectedCalendarDate.getMonth();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthTitle.innerText = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];

    grid.innerHTML = '';

    for (let i = 0; i < firstDayIndex; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'cal-day-cell';
      emptyCell.style.opacity = '0.3';
      emptyCell.style.pointerEvents = 'none';
      grid.appendChild(emptyCell);
    }

    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day-cell';

      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
      if (isToday) cell.classList.add('today');

      const dayLotes = lotes.filter(l => {
        const d = new Date(l.fecha_hora_extraccion);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
      });

      let dotsHtml = '';
      if (dayLotes.length > 0) {
        dayLotes.slice(0, 3).forEach(l => {
          const status = FIFOEngine.getBatchStatus(l);
          dotsHtml += `<span class="cal-dot ${status.state}"></span>`;
        });
      }

      cell.innerHTML = `
        <span>${day}</span>
        ${dotsHtml ? `<div class="cal-dots-row">${dotsHtml}</div>` : ''}
      `;

      cell.addEventListener('click', () => {
        document.querySelectorAll('.cal-day-cell').forEach(c => c.classList.remove('selected'));
        cell.classList.add('selected');
        this.showCalendarDayDetails(day, month, year, dayLotes);
      });

      grid.appendChild(cell);
    }
  },

  changeCalendarMonth(delta) {
    this.selectedCalendarDate.setMonth(this.selectedCalendarDate.getMonth() + delta);
    this.renderCalendarDays();
  },

  showCalendarDayDetails(day, month, year, lotes) {
    const detailsBox = document.getElementById('calendar-selected-details');
    if (!detailsBox) return;

    if (lotes.length === 0) {
      detailsBox.innerHTML = `
        <div style="background: var(--neutral-50); border: 1px dashed var(--neutral-300); border-radius: var(--radius-md); padding: 14px; text-align: center; font-size: 12.5px; color: var(--neutral-500);">
          No se registraron extracciones el ${day} de ${this.selectedCalendarDate.toLocaleString('es', { month: 'long' })}.
        </div>
      `;
      return;
    }

    let itemsHtml = lotes.map(l => {
      const st = FIFOEngine.getBatchStatus(l);
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: white; border: 1px solid var(--neutral-200); border-radius: var(--radius-sm); margin-bottom: 6px;">
          <div>
            <strong>LOTE #${String(l.id_lote).padStart(2, '0')}</strong> (${l.volumen_ml} ml)
            <div style="font-size: 11px; color: var(--neutral-500);">${l.ubicacion_termica === 'Refrigerador_4C' ? 'Refrigerador (4 °C)' : 'Congelador (-18 °C)'}</div>
          </div>
          <span class="batch-status-badge badge-${st.state}">${st.label}</span>
        </div>
      `;
    }).join('');

    detailsBox.innerHTML = `
      <div style="margin-top: 10px;">
        <div style="font-size: 13px; font-weight: 700; margin-bottom: 6px;">Lotes del día ${day}:</div>
        ${itemsHtml}
      </div>
    `;
  },

  renderIntakeHistory() {
    const container = document.getElementById('intake-history-list-container');
    if (!container) return;

    const consumos = StorageManager.get(StorageManager.KEYS.CONSUMOS) || [];
    if (consumos.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--neutral-500);">
          <div style="font-size: 15px; font-weight: 700;">No hay tomas registradas</div>
          <p style="font-size: 12.5px; margin-top: 4px;">Usa el botón "Registrar Toma" para añadir una administración de leche.</p>
        </div>
      `;
      return;
    }

    const methodLabels = {
      biberon_lote: "Biberón graduado",
      vasito_reliquia: "Vasito / Cuchara",
      jeringa_10ml: "Jeringa (10 ml)",
      suplementador: "Suplementador (SNS)"
    };

    // Orden cronológico inverso (más recientes primero)
    const sorted = [...consumos].sort((a, b) => new Date(b.fecha_hora_consumo) - new Date(a.fecha_hora_consumo));

    let rowsHtml = sorted.map(c => {
      const fecha = new Date(c.fecha_hora_consumo).toLocaleString('es', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const metodo = methodLabels[c.metodo] || c.metodo || 'Biberón';
      const tempCheck = c.temperatura_temperado_ok ? '✅ Dorso muñeca' : '⚠️ No verificada';
      return `
        <tr>
          <td><strong>${fecha}</strong></td>
          <td>${c.id_lote ? `Lote #${String(c.id_lote).padStart(2, '0')}` : 'Directa'}</td>
          <td><strong style="color: #0F766E;">${c.volumen_ingerido_ml} ml</strong> (${(c.volumen_ingerido_ml / 29.57).toFixed(1)} oz)</td>
          <td><span class="tag-method">${metodo}</span></td>
          <td>${c.tiempo_temperado_min || 10} min (${tempCheck})</td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="history-table-wrapper">
        <table class="history-data-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Origen</th>
              <th>Volumen</th>
              <th>Método</th>
              <th>Temperado</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  },

  renderProfileForm() {
    const lactante = StorageManager.get(StorageManager.KEYS.LACTANTE);
    const usuario = StorageManager.get(StorageManager.KEYS.USUARIO);
    if (!lactante || !usuario) return;

    const inpBabyName = document.getElementById('prof-inp-babyname');
    const inpBirthdate = document.getElementById('prof-inp-birthdate');
    const inpWeight = document.getElementById('prof-inp-weight');
    const inpFeedings = document.getElementById('prof-inp-feedings');
    const inpCaregiver = document.getElementById('prof-inp-caregiver');
    const selRole = document.getElementById('prof-sel-role');
    const inpPhone = document.getElementById('prof-inp-phone');

    if (inpBabyName) inpBabyName.value = lactante.nombre_bebe || "Sofía";
    if (inpBirthdate && lactante.fecha_nacimiento) inpBirthdate.value = lactante.fecha_nacimiento;
    if (inpWeight) inpWeight.value = lactante.peso_gramos || 3200;
    if (inpFeedings) {
      const calcTomas = document.getElementById('calc-inp-tomas');
      inpFeedings.value = calcTomas ? calcTomas.value : 8;
    }
    if (inpCaregiver) inpCaregiver.value = usuario.nombre_completo || "Ana María Rodríguez";
    if (selRole && usuario.rol_cuidador) selRole.value = usuario.rol_cuidador;
    if (inpPhone) inpPhone.value = usuario.telefono_emergencia || "911";
  },

  saveProfileSettings() {
    const babyName = document.getElementById('prof-inp-babyname')?.value.trim();
    const birthdate = document.getElementById('prof-inp-birthdate')?.value;
    const weight = parseFloat(document.getElementById('prof-inp-weight')?.value);
    const feedings = parseInt(document.getElementById('prof-inp-feedings')?.value);
    const caregiver = document.getElementById('prof-inp-caregiver')?.value.trim();
    const role = document.getElementById('prof-sel-role')?.value;
    const phone = document.getElementById('prof-inp-phone')?.value.trim();

    if (!babyName || !weight || isNaN(weight) || weight <= 0) {
      alert("Por favor completa el nombre del lactante y un peso válido en gramos.");
      return;
    }

    const lactante = StorageManager.get(StorageManager.KEYS.LACTANTE) || {};
    lactante.nombre_bebe = babyName;
    if (birthdate) {
      lactante.fecha_nacimiento = birthdate;
      const diffDays = Math.floor((Date.now() - new Date(birthdate).getTime()) / (24 * 3600 * 1000));
      if (!isNaN(diffDays) && diffDays >= 0) lactante.edad_dias = diffDays;
    }
    lactante.peso_gramos = weight;
    StorageManager.set(StorageManager.KEYS.LACTANTE, lactante);

    const usuario = StorageManager.get(StorageManager.KEYS.USUARIO) || {};
    if (caregiver) usuario.nombre_completo = caregiver;
    if (role) usuario.rol_cuidador = role;
    if (phone) usuario.telefono_emergencia = phone;
    StorageManager.set(StorageManager.KEYS.USUARIO, usuario);

    // Sincronizar calculadora
    const calcPeso = document.getElementById('calc-inp-peso');
    const calcTomas = document.getElementById('calc-inp-tomas');
    if (calcPeso) calcPeso.value = weight;
    if (calcTomas && feedings) calcTomas.value = feedings;

    SoundEffects.playChime('success');
    this.showToast("Perfil clínico del lactante actualizado correctamente.");
    this.refreshAllUI();
  },

  exportDataJSON() {
    const data = {
      usuario: StorageManager.get(StorageManager.KEYS.USUARIO),
      lactante: StorageManager.get(StorageManager.KEYS.LACTANTE),
      lotes: StorageManager.get(StorageManager.KEYS.LOTES),
      consumos: StorageManager.get(StorageManager.KEYS.CONSUMOS),
      evaluaciones: StorageManager.get(StorageManager.KEYS.EVALUACIONES),
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wawaweb_respaldo_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("Respaldo JSON descargado con éxito.");
  },

  generateClinicalPrintReport() {
    const lactante = StorageManager.get(StorageManager.KEYS.LACTANTE);
    const usuario = StorageManager.get(StorageManager.KEYS.USUARIO);
    const lotes = FIFOEngine.getActiveBatches();
    const consumos = StorageManager.get(StorageManager.KEYS.CONSUMOS) || [];
    const evaluaciones = StorageManager.get(StorageManager.KEYS.EVALUACIONES) || [];

    const printContainer = document.getElementById('clinical-print-report');
    if (!printContainer) return;

    let lotesRows = lotes.map(l => `
      <tr>
        <td>#${l.id_lote}</td>
        <td>${new Date(l.fecha_hora_extraccion).toLocaleString('es')}</td>
        <td>${l.volumen_ml} ml</td>
        <td>${l.ubicacion_termica}</td>
        <td>${FIFOEngine.getBatchStatus(l).label}</td>
      </tr>
    `).join('');

    let consumosRows = consumos.slice(-5).reverse().map(c => `
      <tr>
        <td>${new Date(c.fecha_hora_consumo).toLocaleString('es')}</td>
        <td>${c.id_lote ? `Lote #${c.id_lote}` : 'Directa'}</td>
        <td>${c.volumen_ingerido_ml} ml</td>
        <td>${c.metodo || 'biberon_lote'}</td>
      </tr>
    `).join('');

    let evalRows = evaluaciones.slice(-3).map(e => `
      <tr>
        <td>${new Date(e.fecha_hora_evaluacion).toLocaleString('es')}</td>
        <td>${e.nivel_clasificacion}</td>
        <td>F:${e.estado_fontanela} | M:${e.estado_mucosas} | P:${e.signo_pliegue} | O:${e.estado_ojos}</td>
      </tr>
    `).join('');

    printContainer.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #0D9488; padding-bottom: 12px; margin-bottom: 20px;">
        <h2>INFORME CLÍNICO DE SEGUIMIENTO NEONATAL Y BANCO DE LECHE</h2>
        <p>Plataforma WawaWeb - Proyecto COIL 202715 (UCAB - PUCE)</p>
      </div>

      <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
        <tr>
          <td><strong>Paciente (Lactante):</strong> ${lactante.nombre_bebe}</td>
          <td><strong>Edad:</strong> ${lactante.edad_dias} días</td>
          <td><strong>Peso:</strong> ${lactante.peso_gramos} g</td>
        </tr>
        <tr>
          <td><strong>Madre / Cuidador:</strong> ${usuario.nombre_completo}</td>
          <td><strong>Rol:</strong> ${usuario.rol_cuidador}</td>
          <td><strong>Fecha Emisión:</strong> ${new Date().toLocaleDateString('es')}</td>
        </tr>
      </table>

      <h3>1. Estado del Banco de Leche en el Hogar (Inventario FIFO)</h3>
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: left;">
        <thead>
          <tr style="background: #E2E8F0;">
            <th>Lote</th><th>Fecha Extracción</th><th>Volumen</th><th>Ubicación</th><th>Estado</th>
          </tr>
        </thead>
        <tbody>${lotesRows || '<tr><td colspan="5">Sin lotes activos</td></tr>'}</tbody>
      </table>

      <h3>2. Registro Reciente de Tomas Suministradas</h3>
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: left;">
        <thead>
          <tr style="background: #E2E8F0;">
            <th>Fecha y Hora</th><th>Lote / Origen</th><th>Volumen</th><th>Método</th>
          </tr>
        </thead>
        <tbody>${consumosRows || '<tr><td colspan="4">Sin tomas registradas</td></tr>'}</tbody>
      </table>

      <h3>3. Últimas Evaluaciones de Alarma Neonatal (AIEPI)</h3>
      <table border="1" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; text-align: left;">
        <thead>
          <tr style="background: #E2E8F0;">
            <th>Fecha</th><th>Clasificación</th><th>Signos Evaluados</th>
          </tr>
        </thead>
        <tbody>${evalRows || '<tr><td colspan="3">Sin evaluaciones previas</td></tr>'}</tbody>
      </table>

      <div style="margin-top: 40px; text-align: right; border-top: 1px solid #CBD5E1; padding-top: 10px;">
        <p>Firma del Profesional Pediátrico / Enfermería: ___________________________</p>
      </div>
    `;

    window.print();
  },

  showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  UIController.init();
});
