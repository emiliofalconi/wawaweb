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
    // La información se carga exclusivamente desde la Base de Datos SQLite a través de la API REST.
  },

  get(key) {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  },

  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  clearAll() {
    localStorage.removeItem(this.KEYS.USUARIO);
    localStorage.removeItem(this.KEYS.LACTANTE);
    localStorage.removeItem(this.KEYS.LOTES);
    localStorage.removeItem(this.KEYS.CONSUMOS);
    localStorage.removeItem(this.KEYS.EVALUACIONES);
    localStorage.removeItem(this.KEYS.CONFIG);
  }
};

/**
 * Motor FIFO (First In, First Out / PEPS) y Trazabilidad Térmica
 */
const FIFOEngine = {
  LIMITS: {
    AMBIENTE_HOURS: 4,          // 4 horas máximo a temperatura ambiente (≤25 °C)
    AMBIENTE_YELLOW_HOURS: 2,   // >2h consumo prioritario
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

    if (lote.ubicacion_termica === "Ambiente") {
      const remainingHours = Math.max(0, this.LIMITS.AMBIENTE_HOURS - diffHours);
      if (diffHours < this.LIMITS.AMBIENTE_YELLOW_HOURS) {
        return {
          state: "green",
          label: "Óptimo (Ambiente)",
          hoursElapsed: Math.round(diffHours * 10) / 10,
          remainingHours: Math.round(remainingHours * 10) / 10,
          isExpired: false,
          recommendation: "Conservación a temperatura ambiente segura. Administrar antes de 4 horas o refrigerar."
        };
      } else if (diffHours < this.LIMITS.AMBIENTE_HOURS) {
        return {
          state: "yellow",
          label: "Consumo Prioritario",
          hoursElapsed: Math.round(diffHours * 10) / 10,
          remainingHours: Math.round(remainingHours * 10) / 10,
          isExpired: false,
          recommendation: "Próximo al límite de 4 horas a temperatura ambiente. Ofrecer de inmediato o refrigerar."
        };
      } else {
        return {
          state: "red",
          label: "Caducado (Ambiente >4h)",
          hoursElapsed: Math.round(diffHours * 10) / 10,
          remainingHours: 0,
          isExpired: true,
          recommendation: "Superó las 4 horas seguras a temperatura ambiente. Descartar por seguridad bacteriológica."
        };
      }
    } else if (lote.ubicacion_termica === "Refrigerador_4C") {
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
    const newId = batchData.id_lote || (lotes.length > 0 ? Math.max(...lotes.map(l => l.id_lote)) + 1 : 1);
    
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

  transferToFridge(loteId) {
    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];
    const lote = lotes.find(l => l.id_lote === loteId);
    if (lote) {
      lote.ubicacion_termica = "Refrigerador_4C";
      lote.notas_observacion = (lote.notas_observacion ? lote.notas_observacion + " - " : "") + 
        `Transferido a refrigerador (4 °C) el ${new Date().toLocaleDateString('es')}`;
      StorageManager.set(StorageManager.KEYS.LOTES, lotes);
      return true;
    }
    return false;
  },

  discardBatch(loteId, razon) {
    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];
    // Eliminar el lote del inventario activo y del almacenamiento local
    const filteredLotes = lotes.filter(l => l.id_lote !== loteId);
    StorageManager.set(StorageManager.KEYS.LOTES, filteredLotes);
    return true;
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
        title: "NECESITA ATENCIÓN MÉDICA INMEDIATA",
        description: "El bebé presenta señales de deshidratación severa y decaimiento. Requiere atención de un médico o pediatra de forma urgente.",
        actionRequired: "Llama a emergencias (911) o acude de inmediato al centro de salud o guardia pediátrica más cercana.",
        showCallButton: true
      };
    } else if (alertCount >= 2) {
      return {
        level: "alert",
        title: "ALERTA TEMPRANA - CUIDADO Y ATENCIÓN",
        description: "Se detectan dos o más señales de pérdida de líquidos. Tu bebé necesita reponer hidratación con calma y vigilancia.",
        actionRequired: "Ofrécele el pecho más seguido (cada hora y media o 2 horas). Cuenta al menos 6 pañales con orina clara en 24 horas. Si no notas mejoría en 4 horas, consulta a su pediatra.",
        showCallButton: false
      };
    } else if (alertCount === 1) {
      return {
        level: "alert",
        title: "OBSERVACIÓN PREVENTIVA EN CASA",
        description: "Se observa una señal leve para vigilar. Revisa si toma bien el pecho, si moja sus pañales y si llora con lágrimas.",
        actionRequired: "Mantén la lactancia a libre demanda y recuerda a mamá tomar suficiente agua.",
        showCallButton: false
      };
    } else {
      return {
        level: "normal",
        title: "TU BEBÉ SE ENCUENTRA BIEN HIDRATADO",
        description: "Mollera suave y nivelada, boquita húmeda con saliva, piel con buena elasticidad y lágrimas al llorar. No hay señales de alarma.",
        actionRequired: "Continúa con la lactancia materna a libre demanda (de 8 a 12 tomas al día).",
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
 * Cliente de Conexión a la API RESTful de WawaWeb (Backend Go + SQLite)
 */
const ApiClient = {
  getToken() {
    return localStorage.getItem('wawaweb_jwt_token') || '';
  },

  setToken(token) {
    localStorage.setItem('wawaweb_jwt_token', token);
  },

  clearToken() {
    localStorage.removeItem('wawaweb_jwt_token');
  },

  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(endpoint, { ...options, headers });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}: ${res.statusText}`);
      }
      return data;
    } catch (err) {
      console.warn(`[ApiClient] Aviso en petición a ${endpoint}:`, err.message);
      throw err;
    }
  },

  async login(email, password) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  async getMe() {
    return this.request('/api/auth/me');
  },

  async updateProfile(profileData) {
    return this.request('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  async getBatches() {
    return this.request('/api/batches');
  },

  async createBatch(batchData) {
    return this.request('/api/batches', {
      method: 'POST',
      body: JSON.stringify(batchData)
    });
  },

  async deleteBatch(batchId) {
    return this.request(`/api/batches/${batchId}`, {
      method: 'DELETE'
    });
  },

  async getConsumptions() {
    return this.request('/api/consumptions');
  },

  async createConsumption(consData) {
    return this.request('/api/consumptions', {
      method: 'POST',
      body: JSON.stringify(consData)
    });
  },

  async getEvaluations() {
    return this.request('/api/evaluations');
  },

  async createEvaluation(evalData) {
    return this.request('/api/evaluations', {
      method: 'POST',
      body: JSON.stringify(evalData)
    });
  }
};

/**
 * Controlador de Autenticación, Sesión y Seguridad (AuthController)
 */
const AuthController = {
  currentUser: null,
  currentInfant: null,

  async init() {
    const token = ApiClient.getToken();
    if (!token) {
      this.showAuthScreen();
      return;
    }

    // Verificar sesión contra el backend SQLite
    try {
      const res = await ApiClient.getMe();
      await this.onLoginSuccess(res.user, res.infant, token, false);
    } catch (err) {
      console.warn("[AuthController] Sesión expirada o no disponible:", err.message);
      this.showAuthScreen();
    }
  },

  showAuthScreen(defaultTab = 'login') {
    this.updateHeaderAuth(false);
    UIController.switchScreen('screen-auth');
    this.switchTab(defaultTab);
    const navMain = document.getElementById('main-nav-bar');
    if (navMain) {
      navMain.style.display = 'none';
    }
    const mobNav = document.getElementById('mobile-bottom-nav');
    if (mobNav) {
      mobNav.style.display = 'none';
    }
  },

  switchTab(tab) {
    const formLogin = document.getElementById('form-login');
    const formReg = document.getElementById('form-register');
    const btnLogin = document.getElementById('tab-btn-login');
    const btnReg = document.getElementById('tab-btn-register');
    const alertBox = document.getElementById('auth-alert-box');
    if (alertBox) alertBox.style.display = 'none';

    if (tab === 'login') {
      if (formLogin) formLogin.style.display = 'block';
      if (formReg) formReg.style.display = 'none';
      if (btnLogin) btnLogin.classList.add('active');
      if (btnReg) btnReg.classList.remove('active');
    } else {
      if (formLogin) formLogin.style.display = 'none';
      if (formReg) formReg.style.display = 'block';
      if (btnLogin) btnLogin.classList.remove('active');
      if (btnReg) btnReg.classList.add('active');

      this.goToRegStep(1);
      
      const birthInp = document.getElementById('reg-birthdate');
      if (birthInp) {
        if (!birthInp.value) {
          birthInp.value = new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10);
        }
        this.onBirthDateChange(birthInp.value);
      }
    }
  },

  goToRegStep(step) {
    const step1 = document.getElementById('reg-step-1');
    const step2 = document.getElementById('reg-step-2');
    const btn1 = document.getElementById('step-btn-1');
    const btn2 = document.getElementById('step-btn-2');
    const progressLine = document.getElementById('stepper-progress-line');

    if (step === 2) {
      const fullName = document.getElementById('reg-fullname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;

      if (!fullName || !email || !password || password.length < 6) {
        this.validateAndGoToStep2();
        return;
      }

      if (step1) step1.style.display = 'none';
      if (step2) step2.style.display = 'block';
      if (btn1) {
        btn1.classList.remove('active');
        btn1.classList.add('completed');
      }
      if (btn2) {
        btn2.classList.add('active');
        btn2.classList.remove('completed');
      }
      if (progressLine) progressLine.classList.add('step-2-active');

      const babyNameInp = document.getElementById('reg-babyname');
      if (babyNameInp) babyNameInp.focus();
    } else {
      if (step1) step1.style.display = 'block';
      if (step2) step2.style.display = 'none';
      if (btn1) {
        btn1.classList.add('active');
        btn1.classList.remove('completed');
      }
      if (btn2) {
        btn2.classList.remove('active');
        btn2.classList.remove('completed');
      }
      if (progressLine) progressLine.classList.remove('step-2-active');
    }

    const authContainer = document.querySelector('.auth-container');
    if (authContainer) {
      authContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  validateAndGoToStep2() {
    const fullNameInp = document.getElementById('reg-fullname');
    const emailInp = document.getElementById('reg-email');
    const passwordInp = document.getElementById('reg-password');

    const fullName = fullNameInp ? fullNameInp.value.trim() : '';
    const email = emailInp ? emailInp.value.trim() : '';
    const password = passwordInp ? passwordInp.value : '';

    if (!fullName || fullName.length < 3) {
      this.showAlert("Por favor ingresa tu nombre completo (mínimo 3 caracteres).", "error");
      if (fullNameInp) fullNameInp.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showAlert("El correo electrónico no tiene un formato válido (ej. cuidador@dominio.com).", "error");
      if (emailInp) emailInp.focus();
      return;
    }

    if (!password || password.length < 6) {
      this.showAlert("La contraseña debe tener al menos 6 caracteres.", "error");
      if (passwordInp) passwordInp.focus();
      return;
    }

    const alertBox = document.getElementById('auth-alert-box');
    if (alertBox) alertBox.style.display = 'none';

    this.goToRegStep(2);
  },

  togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (btnEl) {
      btnEl.innerHTML = isPass
        ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
        : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      btnEl.setAttribute('aria-label', isPass ? 'Ocultar contraseña' : 'Ver contraseña');
    }
  },

  onBirthDateChange(dateVal) {
    const hint = document.getElementById('reg-calc-days-hint');
    if (!hint) return;
    if (!dateVal) {
      hint.innerText = "Edad: -- días";
      hint.classList.remove('is-error');
      return;
    }

    const birth = new Date(dateVal + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - birth.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      hint.innerText = "Fecha futura no permitida";
      hint.classList.add('is-error');
    } else {
      hint.innerText = `Edad calculada: ${diffDays} día${diffDays === 1 ? '' : 's'} (automático)`;
      hint.classList.remove('is-error');
    }
  },

  showAlert(msg, type = 'error') {
    const box = document.getElementById('auth-alert-box');
    if (!box) return;
    box.className = `auth-alert ${type}`;
    box.innerText = msg;
    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  async handleLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('btn-submit-login');

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerText = "Verificando en Base de Datos...";
      }
      const res = await ApiClient.login(email, password);
      ApiClient.setToken(res.token);
      await this.onLoginSuccess(res.user, res.infant, res.token, true);
    } catch (err) {
      this.showAlert(err.message || "Error al autenticar", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = "Entrar a WawaWeb";
      }
    }
  },

  async loginDemo() {
    document.getElementById('login-email').value = "demo@wawaweb.org";
    document.getElementById('login-password').value = "wawaweb2026";
    this.switchTab('login');
    await this.handleLogin(null);
  },

  async handleRegister(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('btn-submit-reg');
    const fullName = document.getElementById('reg-fullname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    const phone = document.getElementById('reg-phone').value.trim();
    const babyName = document.getElementById('reg-babyname').value.trim();
    const birthDate = document.getElementById('reg-birthdate').value;
    const rawWeight = document.getElementById('reg-weight').value;
    const weight = parseFloat(rawWeight);
    const sex = document.getElementById('reg-sex').value;

    if (!fullName || fullName.length < 3) {
      this.goToRegStep(1);
      this.showAlert("El nombre completo del cuidador debe tener al menos 3 caracteres.", "error");
      const el = document.getElementById('reg-fullname');
      if (el) el.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.goToRegStep(1);
      this.showAlert("El correo electrónico no tiene un formato válido (ej. cuidador@dominio.com).", "error");
      const el = document.getElementById('reg-email');
      if (el) el.focus();
      return;
    }

    if (!password || password.length < 6) {
      this.goToRegStep(1);
      this.showAlert("La contraseña debe tener un mínimo de 6 caracteres.", "error");
      const el = document.getElementById('reg-password');
      if (el) el.focus();
      return;
    }

    if (!babyName || babyName.length < 2) {
      this.showAlert("El nombre del recién nacido debe tener al menos 2 caracteres.", "error");
      const el = document.getElementById('reg-babyname');
      if (el) el.focus();
      return;
    }

    if (!birthDate) {
      this.showAlert("Por favor selecciona la fecha de nacimiento del recién nacido.", "error");
      const el = document.getElementById('reg-birthdate');
      if (el) el.focus();
      return;
    }

    const bDate = new Date(birthDate + "T00:00:00");
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (bDate > today) {
      this.showAlert("La fecha de nacimiento no puede ser posterior al día de hoy.", "error");
      const el = document.getElementById('reg-birthdate');
      if (el) el.focus();
      return;
    }

    if (isNaN(weight) || weight <= 0) {
      this.showAlert("El peso del bebé debe ser un número positivo mayor a 0 gramos (no se permiten números negativos).", "error");
      const el = document.getElementById('reg-weight');
      if (el) el.focus();
      return;
    }

    if (weight < 1500 || weight > 12000) {
      this.showAlert("El peso del recién nacido debe encontrarse en el rango de 1.500 g a 12.000 g.", "error");
      const el = document.getElementById('reg-weight');
      if (el) el.focus();
      return;
    }

    const consentCheck = document.getElementById('reg-consent');
    if (!consentCheck || !consentCheck.checked) {
      this.showAlert("Debes aceptar las condiciones de consentimiento para crear tu cuenta.", "error");
      if (consentCheck) consentCheck.focus();
      return;
    }

    const birthTime = new Date(birthDate + "T00:00:00").getTime();
    const todayTime = new Date().setHours(0, 0, 0, 0);
    const diffDays = Math.max(0, Math.floor((todayTime - birthTime) / (1000 * 60 * 60 * 24)));

    const data = {
      full_name: fullName,
      email: email,
      password: password,
      caregiver_role: role,
      emergency_phone: phone || "911",
      baby_name: babyName,
      birth_date: birthDate,
      days_old: diffDays,
      weight_grams: weight,
      sex: sex
    };

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerText = "Creando Cuenta en Base de Datos...";
      }
      const res = await ApiClient.register(data);
      ApiClient.setToken(res.token);
      await this.onLoginSuccess(res.user, res.infant, res.token, true);
    } catch (err) {
      this.showAlert(err.message || "Error al registrar cuenta", "error");
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = "Crear Cuenta y Comenzar ✓";
      }
    }
  },

  async onLoginSuccess(user, infant, token, showGreeting = false) {
    this.currentUser = user;
    this.currentInfant = infant;

    StorageManager.set(StorageManager.KEYS.USUARIO, {
      id_usuario: user.id,
      nombre_completo: user.full_name,
      correo_electronico: user.email,
      rol_cuidador: user.caregiver_role,
      telefono_emergencia: user.emergency_phone
    });

    if (infant) {
      StorageManager.set(StorageManager.KEYS.LACTANTE, {
        id_lactante: infant.id,
        id_usuario: user.id,
        nombre_bebe: infant.baby_name,
        fecha_nacimiento: infant.birth_date,
        edad_dias: infant.days_old,
        peso_gramos: infant.weight_grams,
        sexo: infant.sex
      });
    }

    // Sincronizar lotes de leche desde la Base de Datos SQLite
    try {
      const remoteBatches = await ApiClient.getBatches();
      const localBatches = Array.isArray(remoteBatches) ? remoteBatches.map(rb => ({
        id_lote: rb.id,
        id_lactante: rb.infant_id,
        fecha_hora_extraccion: rb.extraction_date,
        volumen_ml: rb.volume_ml,
        ubicacion_termica: rb.thermal_location,
        estado_conservacion: rb.conservation_status,
        notas_observacion: rb.notes
      })) : [];
      StorageManager.set(StorageManager.KEYS.LOTES, localBatches);
    } catch (e) {
      console.warn("[AuthController] Error al cargar lotes desde la base de datos:", e);
      StorageManager.set(StorageManager.KEYS.LOTES, []);
    }

    // Sincronizar consumos y evaluaciones desde la Base de Datos SQLite
    try {
      const remoteCons = await ApiClient.getConsumptions();
      StorageManager.set(StorageManager.KEYS.CONSUMOS, Array.isArray(remoteCons) ? remoteCons : []);
    } catch (e) {
      StorageManager.set(StorageManager.KEYS.CONSUMOS, []);
    }

    try {
      const remoteEvals = await ApiClient.getEvaluations();
      StorageManager.set(StorageManager.KEYS.EVALUACIONES, Array.isArray(remoteEvals) ? remoteEvals : []);
    } catch (e) {
      StorageManager.set(StorageManager.KEYS.EVALUACIONES, []);
    }

    this.updateHeaderAuth(true);
    UIController.refreshAllUI();
    UIController.switchScreen('screen-dashboard');

    if (showGreeting) {
      const shortName = user.full_name ? user.full_name.split(' ')[0] : 'Familia';
      UIController.showToast(`¡Bienvenida/o, ${shortName}! Tus datos se han sincronizado correctamente.`);
    }
  },

  updateHeaderAuth(isLoggedIn) {
    const userBadge = document.getElementById('header-user-badge');
    const userName = document.getElementById('header-user-name');
    const userAvatar = document.getElementById('header-user-avatar');
    const loginBtn = document.getElementById('header-btn-login');
    const babyPill = document.getElementById('header-baby-pill');
    const navAuth = document.getElementById('nav-btn-auth');
    const navMain = document.getElementById('main-nav-bar');
    const mobNav = document.getElementById('mobile-bottom-nav');

    if (isLoggedIn && this.currentUser) {
      if (userBadge) userBadge.style.display = 'flex';
      if (loginBtn) {
        loginBtn.style.setProperty('display', 'none', 'important');
      }
      if (userName) userName.innerText = this.currentUser.full_name.split(' ')[0];
      if (userAvatar) userAvatar.innerText = this.currentUser.full_name.charAt(0).toUpperCase();
      if (babyPill) babyPill.style.display = 'inline-flex';
      if (navAuth) navAuth.style.display = 'none';
      if (navMain) {
        navMain.style.display = 'flex';
        navMain.querySelectorAll('.nav-tab-btn').forEach(b => b.style.opacity = '1');
      }
      if (mobNav) {
        mobNav.style.display = 'flex';
      }

      // Actualizar datos en pantalla de perfil
      const profEmail = document.getElementById('prof-user-email');
      const profId = document.getElementById('prof-user-id');
      const profName = document.getElementById('prof-inp-fullname');
      const profBaby = document.getElementById('prof-inp-babyname');
      const profRole = document.getElementById('prof-inp-role');
      const profPhone = document.getElementById('prof-inp-phone');
      const profWeight = document.getElementById('prof-inp-weight');
      const profDays = document.getElementById('prof-inp-days');

      if (profEmail) profEmail.innerText = this.currentUser.email;
      if (profId) profId.innerText = this.currentUser.id;
      if (profName) profName.value = this.currentUser.full_name;
      if (profRole) profRole.value = this.currentUser.caregiver_role;
      if (profPhone) profPhone.value = this.currentUser.emergency_phone;
      if (this.currentInfant) {
        if (profBaby) profBaby.value = this.currentInfant.baby_name;
        if (profWeight) profWeight.value = this.currentInfant.weight_grams;
        if (profDays) profDays.value = this.currentInfant.days_old;
      }
    } else {
      if (userBadge) userBadge.style.display = 'none';
      if (loginBtn) {
        loginBtn.style.setProperty('display', 'inline-flex', 'important');
      }
      if (babyPill) babyPill.style.display = 'none';
      if (navMain) navMain.style.display = 'none';
      if (mobNav) mobNav.style.display = 'none';
    }
  },

  logout() {
    ApiClient.clearToken();
    StorageManager.clearAll();
    this.currentUser = null;
    this.currentInfant = null;

    // Limpiar campos de inicio de sesión y formulario de registro
    const loginEmail = document.getElementById('login-email');
    if (loginEmail) loginEmail.value = '';
    const loginPass = document.getElementById('login-password');
    if (loginPass) loginPass.value = '';
    const regForm = document.getElementById('form-register');
    if (regForm) regForm.reset();

    this.updateHeaderAuth(false);
    this.showAuthScreen('login');
    try {
      UIController.refreshAllUI();
    } catch (e) {
      console.warn("[AuthController] UI refresh on logout:", e);
    }
    UIController.showToast('Sesión cerrada correctamente.');
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
    this.initCalendar();
    AuthController.init();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('wawaweb_theme') || 
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    this.applyTheme(savedTheme);

    const savedColorScheme = localStorage.getItem('wawaweb_color_scheme') || 'default';
    this.applyColorScheme(savedColorScheme);
  },

  toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    this.applyTheme(next);
    localStorage.setItem('wawaweb_theme', next);
    this.showToast(next === 'dark' ? 'Modo noche activado' : 'Modo día activado');
  },

  toggleColorScheme() {
    const current = document.documentElement.getAttribute('data-color-scheme') || 'default';
    const next = current === 'blue' ? 'default' : 'blue';
    this.applyColorScheme(next);
    localStorage.setItem('wawaweb_color_scheme', next);
    this.showToast(next === 'blue' ? 'Paleta Azul Paternidad activada' : 'Paleta Rosa Maternal activada');
  },

  applyColorScheme(scheme) {
    if (scheme === 'blue') {
      document.documentElement.setAttribute('data-color-scheme', 'blue');
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', '#2B6CB0');
      const btn = document.getElementById('btn-palette-toggle');
      if (btn) {
        btn.setAttribute('title', 'Cambiar a Paleta Rosa Maternal');
        btn.classList.add('palette-active-blue');
      }
    } else {
      document.documentElement.removeAttribute('data-color-scheme');
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) metaTheme.setAttribute('content', '#C86870');
      const btn = document.getElementById('btn-palette-toggle');
      if (btn) {
        btn.setAttribute('title', 'Cambiar a Paleta Azul Paternidad');
        btn.classList.remove('palette-active-blue');
      }
    }
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
    if (inpPeso) inpPeso.addEventListener('input', () => {
      inpPeso.dataset.userModified = 'true';
      this.updateCalculatorView();
    });
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

    // Bloquear caracteres negativos y exponenciales en todos los campos numéricos
    document.querySelectorAll('input[type="number"]').forEach(numInput => {
      numInput.addEventListener('keydown', (e) => {
        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
          e.preventDefault();
        }
      });
      numInput.addEventListener('input', () => {
        if (numInput.value && parseFloat(numInput.value) < 0) {
          numInput.value = Math.abs(parseFloat(numInput.value)) || '';
        }
      });
    });

    // Restringir selectores de fecha para evitar fechas futuras
    const todayStr = new Date().toISOString().slice(0, 10);
    const birthInp = document.getElementById('reg-birthdate');
    if (birthInp) {
      birthInp.max = todayStr;
    }

    const nowIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const extDateInp = document.getElementById('ext-inp-datetime');
    if (extDateInp) {
      extDateInp.max = nowIso;
      if (!extDateInp.value) {
        extDateInp.value = nowIso;
      }
    }

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
    if (!ApiClient.getToken() && screenId !== 'screen-auth') {
      this.showToast('Por favor inicia sesión para continuar.');
      screenId = 'screen-auth';
    }

    this.currentScreen = screenId;

    document.querySelectorAll('.nav-tab-btn').forEach(b => {
      if (b.getAttribute('data-screen') === screenId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    document.querySelectorAll('.mob-nav-item').forEach(b => {
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

    // Centrar automáticamente la pestaña activa en la barra de navegación móvil
    const activeBtn = document.querySelector(`.nav-tab-btn[data-screen="${screenId}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    if (screenId === 'screen-dashboard') this.renderDashboard();
    if (screenId === 'screen-inventory') this.renderInventoryList('all');
    if (screenId === 'screen-intake-history') this.renderIntakeHistory();
    if (screenId === 'screen-calendar') this.renderCalendarDays();
    if (screenId === 'screen-calculator') this.updateCalculatorView();
    if (screenId === 'screen-extraction') {
      const dtInp = document.getElementById('ext-inp-datetime');
      if (dtInp) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const nowStr = now.toISOString().slice(0, 16);
        if (!dtInp.value) dtInp.value = nowStr;
        dtInp.max = nowStr;
      }
      this.updateExtractionPreview();
    }
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
    const usuario = StorageManager.get(StorageManager.KEYS.USUARIO);

    // Calcular días de vida basados en la fecha de nacimiento si está disponible
    let diasVida = 15;
    if (lactante) {
      diasVida = lactante.edad_dias || 15;
      if (lactante.fecha_nacimiento) {
        const birth = new Date(lactante.fecha_nacimiento).getTime();
        const diffDays = Math.floor((Date.now() - birth) / (24 * 3600 * 1000));
        if (!isNaN(diffDays) && diffDays >= 0) diasVida = diffDays;
      }
    }

    const elBabyName = document.querySelectorAll('.baby-display-name');
    elBabyName.forEach(el => el.innerText = (lactante && lactante.nombre_bebe) ? lactante.nombre_bebe : '---');

    const elBabyDays = document.getElementById('header-baby-days');
    if (elBabyDays) {
      elBabyDays.innerText = (lactante && lactante.edad_dias !== undefined) ? `${lactante.edad_dias}` : '--';
    }

    const elDashMeta = document.getElementById('dash-baby-meta');
    if (elDashMeta) {
      if (lactante) {
        const roleStr = (usuario && usuario.rol_cuidador) ? usuario.rol_cuidador.replace('_', ' ') : 'Lactancia Materna';
        elDashMeta.innerText = `${diasVida} días de vida • ${Number(lactante.peso_gramos || 3200).toLocaleString('es')} g • ${lactante.sexo || 'Lactante'} • ${roleStr}`;
      } else {
        elDashMeta.innerText = "Inicia sesión para visualizar los datos del lactante desde la base de datos.";
      }
    }
  },

  renderDashboard() {
    const activeBatches = FIFOEngine.getActiveBatches();
    const priority = FIFOEngine.getPriorityBatch();

    let totalMl = 0;
    let refriMl = 0;
    let freezerMl = 0;
    let ambienteMl = 0;

    activeBatches.forEach(b => {
      totalMl += b.volumen_ml;
      if (b.ubicacion_termica === "Refrigerador_4C") refriMl += b.volumen_ml;
      else if (b.ubicacion_termica === "Congelador_18C") freezerMl += b.volumen_ml;
      else if (b.ubicacion_termica === "Ambiente") ambienteMl += b.volumen_ml;
    });

    const totalOz = (totalMl / IntakeCalculator.FL_OZ_TO_ML).toFixed(1);

    const elStockMl = document.getElementById('dash-stock-ml');
    const elStockOz = document.getElementById('dash-stock-oz');
    const elRefriBadge = document.getElementById('dash-refri-badge');
    const elFreezerBadge = document.getElementById('dash-freezer-badge');
    const elAmbienteBadge = document.getElementById('dash-ambiente-badge');

    if (elStockMl) elStockMl.innerText = `${Math.round(totalMl)} ml`;
    if (elStockOz) elStockOz.innerText = `${totalOz} oz`;
    if (elRefriBadge) elRefriBadge.innerText = `Refri: ${Math.round(refriMl)} ml`;
    if (elFreezerBadge) elFreezerBadge.innerText = `Congelador: ${Math.round(freezerMl)} ml`;
    if (elAmbienteBadge) {
      if (ambienteMl > 0) {
        elAmbienteBadge.innerText = `Ambiente: ${Math.round(ambienteMl)} ml`;
        elAmbienteBadge.style.display = 'inline-block';
      } else {
        elAmbienteBadge.style.display = 'none';
      }
    }

    // Alerta Proactiva para frascos en refrigerador con ≥ 48 horas sin usarse
    const alertContainer = document.getElementById('dash-proactive-alert');
    const refriBatches48h = activeBatches.filter(b => {
      if (b.ubicacion_termica !== "Refrigerador_4C") return false;
      const diffHours = (Date.now() - new Date(b.fecha_hora_extraccion).getTime()) / (3600 * 1000);
      return diffHours >= 48;
    });

    // Actualizar contador dinámico en la campana superior de alertas
    const alertBatchesCount = activeBatches.filter(b => {
      const st = FIFOEngine.getBatchStatus(b);
      return st.state === 'yellow' || st.state === 'red';
    }).length;
    const bellBadge = document.getElementById('header-bell-badge');
    if (bellBadge) {
      if (alertBatchesCount > 0) {
        bellBadge.innerText = String(alertBatchesCount);
        bellBadge.style.display = 'flex';
      } else {
        bellBadge.style.display = 'none';
      }
    }

    if (alertContainer) {
      if (refriBatches48h.length > 0) {
        const urgentBatch = refriBatches48h[0];
        const diffHours = Math.round((Date.now() - new Date(urgentBatch.fecha_hora_extraccion).getTime()) / (3600 * 1000));
        alertContainer.innerHTML = `
          <div class="proactive-alert-banner">
            <div class="proactive-alert-header">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <strong>Alerta Proactiva: Frasco en Refrigerador (≥ 48 horas)</strong>
            </div>
            <p class="proactive-alert-body">
              El <strong>Frasco #${String(urgentBatch.id_lote).padStart(2, '0')}</strong> ha cumplido <strong>${diffHours} horas</strong> en refrigerador. Para aprovechar al máximo sus nutrientes y defensas naturales, sugerimos <strong>ofrecerlo en la próxima toma</strong> o <strong>pasarlo al congelador</strong> de inmediato.
            </p>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn-primary" style="width: auto; font-size: 12px; padding: 7px 14px;" onclick="UIController.openConsumeModal(${urgentBatch.id_lote})">
                Consumir en Próxima Toma
              </button>
              <button class="btn-secondary" style="width: auto; font-size: 12px; padding: 7px 14px;" onclick="UIController.handleTransferToFreezer(${urgentBatch.id_lote})">
                Pasar al Congelador
              </button>
            </div>
          </div>
        `;
        alertContainer.style.display = 'block';
      } else {
        alertContainer.style.display = 'none';
      }
    }

    const fifoContainer = document.getElementById('dash-fifo-container');
    if (!fifoContainer) return;

    if (!priority) {
      fifoContainer.innerHTML = `
        <div class="fifo-primary-card fifo-empty-card">
          <div class="empty-state-illus">
            <svg viewBox="0 0 48 48" width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 14H30V18C32.2 18 34 19.8 34 22V38C34 40.2 32.2 42 30 42H18C15.8 42 14 40.2 14 38V22C14 19.8 15.8 18 18 18V14Z" fill="var(--primary-subtle)" stroke="var(--primary)" stroke-width="2.2" stroke-linejoin="round"/>
              <path d="M20 14V10C20 7.8 21.8 6 24 6C26.2 6 28 7.8 28 10V14" stroke="var(--primary)" stroke-width="2.2" stroke-linecap="round"/>
              <path d="M24 25V33M20 29H28" stroke="var(--secondary)" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="fifo-flag" style="background: var(--bg-subtle); color: var(--neutral-600); border-color: var(--neutral-300);">Banco de Leche Listo</div>
          <div class="fifo-card-title">Aún no tienes frascos guardados</div>
          <div class="fifo-card-subtitle">Guarda tu primera extracción para que te avisemos cuál frasco usar primero y cuidar su frescura.</div>
          <button class="btn-primary" onclick="UIController.switchScreen('screen-extraction')">Registrar Primera Extracción</button>
        </div>
      `;
      return;
    }

    const { lote, status } = priority;
    const isFreezer = lote.ubicacion_termica === "Congelador_18C";
    const isAmbiente = lote.ubicacion_termica === "Ambiente";
    const locText = isAmbiente ? "Ambiente (≤25 °C)" : (isFreezer ? "Congelador (-18 °C)" : "Refrigerador (4 °C)");

    fifoContainer.innerHTML = `
      <div class="fifo-primary-card">
        <div class="fifo-flag">Primer Frasco en la Fila • Usar Primero</div>
        <div class="fifo-card-title">«Frasco Recomendado Hoy» (Frasco #${String(lote.id_lote).padStart(2, '0')})</div>
        <div class="fifo-card-subtitle">
          Es el frasco que lleva más tiempo guardado en perfecto estado. Usarlo primero evita que se venza en la nevera o el congelador.
        </div>

        <div class="fifo-card-meta">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="fifo-bottle-badge" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 9h8v3a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3V9z"/>
                <path d="M13 9V6a3 3 0 0 1 6 0v3"/>
                <line x1="13" y1="18" x2="19" y2="18"/>
                <line x1="13" y1="22" x2="17" y2="22"/>
              </svg>
            </div>
            <div>
              <div class="fifo-lot-code">FRASCO #${String(lote.id_lote).padStart(2, '0')}</div>
              <div style="font-size: 12px; color: var(--neutral-600); font-weight: 600; margin-top: 2px;">
                ${locText} • <strong style="color: var(--primary);">${lote.volumen_ml} ml</strong> (${(lote.volumen_ml / 29.57).toFixed(1)} oz)
              </div>
            </div>
          </div>
          <div class="fifo-countdown">
            <div class="fifo-countdown-time">${status.remainingHours > 0 ? `${status.remainingHours}h restantes` : 'Límite superado'}</div>
            <div class="fifo-countdown-lbl">Edad: ${status.hoursElapsed}h desde extracción</div>
          </div>
        </div>

        <div class="fifo-actions-row">
          <button class="btn-fifo-consume" onclick="UIController.openConsumeModal(${lote.id_lote})">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            <span>Servir este Frasco</span>
          </button>
          <button class="btn-fifo-transfer btn-fifo-sage" onclick="UIController.goToThawingFromPriority(${lote.id_lote})">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span>Temperar (10 min)</span>
          </button>
          ${isAmbiente ? `
            <button class="btn-fifo-transfer" onclick="UIController.handleTransferToFridge(${lote.id_lote})">
              Refrigerar
            </button>
          ` : ''}
          ${!isFreezer ? `
            <button class="btn-fifo-transfer" onclick="UIController.handleTransferToFreezer(${lote.id_lote})">
              Congelar (-18 °C)
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

    if (filter === 'ambiente') {
      lotes = lotes.filter(l => l.ubicacion_termica === "Ambiente" && l.estado_conservacion !== "Consumido");
    } else if (filter === 'refri') {
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
        <div class="empty-state-box">
          <div class="empty-state-illus">
            <svg viewBox="0 0 48 48" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="28" height="28" rx="6" fill="var(--primary-subtle)" stroke="var(--primary)" stroke-width="2"/>
              <path d="M18 24H30M24 18V30" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="empty-state-title">No hay frascos en esta sección</div>
          <p class="empty-state-desc">Usa el botón de abajo para registrar una nueva extracción en el banco de leche.</p>
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

      const locName = lote.ubicacion_termica === 'Ambiente' ? 'Ambiente (≤25 °C)' : (lote.ubicacion_termica === 'Refrigerador_4C' ? 'Refrigerador (4 °C)' : 'Congelador (-18 °C)');

      html += `
        <div class="batch-item-card ${cardStateClass}">
          <div class="batch-card-header">
            <div class="batch-id-tag">
              FRASCO #${String(lote.id_lote).padStart(2, '0')}
              ${!isConsumed ? `<span class="fifo-order-badge">Turno #${index + 1} para usar</span>` : ''}
            </div>
            <span class="batch-status-badge ${badgeClass}">${isConsumed ? 'Consumido' : status.label}</span>
          </div>

          <div class="batch-card-body">
            <div><strong>Volumen:</strong> ${lote.volumen_ml} ml (${(lote.volumen_ml / 29.57).toFixed(1)} oz)</div>
            <div><strong>Ubicación:</strong> ${locName}</div>
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
              ${lote.ubicacion_termica === 'Ambiente' ? `
                <button class="btn-card-action" onclick="UIController.handleTransferToFridge(${lote.id_lote})">
                  Refrigerar
                </button>
              ` : ''}
              ${lote.ubicacion_termica === 'Refrigerador_4C' || lote.ubicacion_termica === 'Ambiente' ? `
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

    let maxTime = "Hasta 4 días (96 h a 4 °C)";
    if (temp === "Ambiente") {
      maxTime = "Hasta 4 horas (Ambiente ≤25 °C)";
    } else if (temp === "Congelador_18C") {
      maxTime = "3 a 6 meses (-18 °C)";
    }

    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];
    const nextLoteNum = lotes.length > 0 ? Math.max(...lotes.map(l => l.id_lote || 0)) + 1 : 1;

    previewBox.innerHTML = `
      <div class="ext-preview-stat-row">
        <span class="ext-preview-main"><strong>${vol} ml</strong> equivalen a <strong>${oz} fl oz</strong></span>
        <span class="ext-preview-sub">(${jeringas} jeringas de 10 ml o ${cuch} cucharaditas)</span>
      </div>
      <div class="ext-preview-meta-row">
        <span>Número asignado: <strong style="color: var(--primary);">Frasco #${String(nextLoteNum).padStart(2, '0')}</strong></span>
        <span class="ext-preview-dot">•</span>
        <span>Tiempo recomendado: <strong>${maxTime}</strong></span>
      </div>
    `;
  },

  async handleSaveExtraction(e) {
    if (e) e.preventDefault();
    const rawVol = document.getElementById('ext-inp-vol').value;
    const vol = parseFloat(rawVol);
    const temp = document.getElementById('ext-sel-temp').value;
    const dateVal = document.getElementById('ext-inp-datetime').value;
    const notes = document.getElementById('ext-inp-notes').value.trim();

    if (isNaN(vol) || vol <= 0) {
      this.showToast("El volumen debe ser un número positivo mayor a 0 ml (no se permiten números negativos ni cero).");
      return;
    }

    if (vol < 5 || vol > 500) {
      this.showToast("El volumen por extracción debe encontrarse en un rango de 5 ml a 500 ml.");
      return;
    }

    let extDate = new Date().toISOString();
    if (dateVal) {
      const selectedTime = new Date(dateVal);
      if (selectedTime > new Date(Date.now() + 5 * 60000)) {
        this.showToast("La fecha y hora de extracción no puede ser futura.");
        return;
      }
      extDate = selectedTime.toISOString();
    }

    // Guardar en la Base de Datos SQLite vía API
    let createdBatch = null;
    try {
      createdBatch = await ApiClient.createBatch({
        volume_ml: vol,
        thermal_location: temp,
        extraction_date: extDate,
        conservation_status: "Optimo",
        notes: notes
      });
    } catch (err) {
      console.warn("[UIController] Registro local de respaldo:", err);
      this.showToast(err.message || "Error al registrar en base de datos");
      return;
    }

    const newBatch = FIFOEngine.addBatch({
      id_lote: createdBatch ? createdBatch.id : undefined,
      volumen_ml: vol,
      ubicacion_termica: temp,
      fecha_hora_extraccion: extDate,
      notas_observacion: notes
    });

    // Limpiar formulario para la siguiente extracción
    const inpVol = document.getElementById('ext-inp-vol');
    if (inpVol) inpVol.value = '';
    const inpNotes = document.getElementById('ext-inp-notes');
    if (inpNotes) inpNotes.value = '';

    SoundEffects.playChime('success');
    this.showToast(`Frasco #${String(newBatch.id_lote).padStart(2, '0')} guardado correctamente en tu banco de leche.`);
    this.refreshAllUI();
    this.openLabelModal(newBatch);
  },

  openLabelModal(batch) {
    const modal = document.getElementById('label-modal');
    if (!modal) return;
    const padId = String(batch.id_lote).padStart(2, '0');
    const dt = new Date(batch.fecha_hora_extraccion);
    const dateFormatted = dt.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeFormatted = dt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });

    let destName = "Refrigerador 4 °C (hasta 4 días)";
    if (batch.ubicacion_termica === "Ambiente") destName = "Ambiente (hasta 4 horas a ≤25 °C)";
    else if (batch.ubicacion_termica === "Congelador_18C") destName = "Congelador -18 °C (3 a 6 meses)";

    const elId = document.getElementById('label-modal-lote-id');
    const elTag = document.getElementById('label-modal-tag');
    const elVol = document.getElementById('label-modal-vol');
    const elDate = document.getElementById('label-modal-date');
    const elTime = document.getElementById('label-modal-time');
    const elDest = document.getElementById('label-modal-dest');

    if (elId) elId.innerText = `Frasco #${padId}`;
    if (elTag) elTag.innerText = `FRASCO #${padId}`;
    if (elVol) elVol.innerText = `${batch.volumen_ml} ml (${(batch.volumen_ml / 29.57).toFixed(1)} oz)`;
    if (elDate) elDate.innerText = dateFormatted;
    if (elTime) elTime.innerText = timeFormatted;
    if (elDest) elDest.innerText = destName;

    modal.classList.add('show');
  },

  closeLabelModal() {
    const modal = document.getElementById('label-modal');
    if (modal) modal.classList.remove('show');
    this.refreshAllUI();
    this.switchScreen('screen-inventory');
  },

  selectedThawingBatchId: null,

  goToThawingFromPriority(loteId) {
    this.selectedThawingBatchId = loteId;
    this.switchScreen('screen-thawing');
    const hint = document.getElementById('thawing-current-lot-hint');
    if (hint) {
      hint.innerText = `🌡️ Preparando para la toma: LOTE #${String(loteId).padStart(2, '0')}`;
      hint.style.display = 'block';
    }
    const timerCard = document.querySelector('.timer-interactive-card');
    if (timerCard) timerCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  goToThawingFromModal() {
    const loteId = parseInt(document.getElementById('modal-consume-lote-id').value);
    this.closeConsumeModal();
    if (loteId) {
      this.goToThawingFromPriority(loteId);
    } else {
      this.switchScreen('screen-thawing');
    }
  },

  finishThawingAndConsume() {
    const loteId = this.selectedThawingBatchId;
    if (loteId) {
      this.openConsumeModal(loteId);
    } else {
      const priority = FIFOEngine.getPriorityBatch();
      if (priority) {
        this.openConsumeModal(priority.lote.id_lote);
      } else {
        this.switchScreen('screen-dashboard');
      }
    }
  },

  updateCalculatorView() {
    const lactante = StorageManager.get(StorageManager.KEYS.LACTANTE);
    const inpPeso = document.getElementById('calc-inp-peso');
    const inpTomas = document.getElementById('calc-inp-tomas');
    const pesoDisplay = document.getElementById('calc-peso-display');
    if (!inpPeso || !inpTomas) return;

    if (!inpPeso.dataset.userModified && lactante && lactante.peso_gramos) {
      inpPeso.value = lactante.peso_gramos;
    }

    const pesoGramos = parseFloat(inpPeso.value) || (lactante ? lactante.peso_gramos : 3000);
    const tomas = parseInt(inpTomas.value) || 8;

    if (pesoDisplay) {
      pesoDisplay.innerText = `${pesoGramos.toLocaleString('es')} g (${(pesoGramos / 1000).toFixed(2)} kg)`;
    }

    const elBabyChip = document.getElementById('calc-baby-info-chip');
    if (elBabyChip) {
      const babyName = (lactante && lactante.nombre_bebe) ? lactante.nombre_bebe : 'Lactante';
      const daysOld = (lactante && lactante.edad_dias !== undefined) ? `${lactante.edad_dias} días de vida` : 'Edad no registrada';
      elBabyChip.innerHTML = `
        <span><strong>${babyName}</strong> • ${daysOld} • Peso base: ${pesoGramos} g</span>
        <span class="calc-formula-pill">Fórmula: 150 ml/kg/día ÷ ${tomas} tomas</span>
      `;
    }

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

  async confirmConsumeFromModal() {
    const loteId = parseInt(document.getElementById('modal-consume-lote-id').value);
    const rawVol = document.getElementById('modal-consume-vol').value;
    const vol = parseFloat(rawVol);
    const tempOk = document.getElementById('modal-consume-temp-check').checked;
    const tiempo = parseInt(document.getElementById('modal-consume-time').value);

    const lotes = StorageManager.get(StorageManager.KEYS.LOTES) || [];
    const lote = lotes.find(l => l.id_lote === loteId);
    if (!lote) {
      this.showToast("Lote no encontrado.");
      return;
    }

    if (isNaN(vol) || vol <= 0) {
      alert("El volumen a suministrar debe ser un número positivo mayor a 0 ml (no se permiten números negativos ni cero).");
      return;
    }

    if (vol > lote.volumen_ml) {
      alert(`El volumen ingresado (${vol} ml) supera la cantidad disponible en este frasco (${lote.volumen_ml} ml).`);
      return;
    }

    if (isNaN(tiempo) || tiempo <= 0) {
      alert("El tiempo de temperado pasivo debe ser un número positivo mayor a 0 minutos.");
      return;
    }

    try {
      await ApiClient.createConsumption({
        batch_id: loteId,
        volume_consumed_ml: vol,
        method: "Biberon_Bioseguro"
      });
    } catch (e) {
      console.warn("[UIController] Registro local de consumo:", e);
    }

    FIFOEngine.consumeBatch(loteId, vol, tempOk, tiempo, 'biberon_lote');
    this.closeConsumeModal();
    SoundEffects.playChime('success');
    this.showToast(`Lote #${String(loteId).padStart(2, '0')} despachado (${vol} ml). Historial actualizado.`);
    this.refreshAllUI();
  },

  togglePhotoRef(refId, btnEl) {
    const accordion = document.getElementById(refId);
    if (!accordion) return;
    const isExpanded = accordion.classList.contains('expanded');
    if (isExpanded) {
      accordion.classList.remove('expanded');
      if (btnEl) {
        btnEl.setAttribute('aria-expanded', 'false');
        btnEl.classList.remove('active');
      }
    } else {
      accordion.classList.add('expanded');
      if (btnEl) {
        btnEl.setAttribute('aria-expanded', 'true');
        btnEl.classList.add('active');
      }
    }
  },

  openPhotoModal(title, conditionKey) {
    const modal = document.getElementById('clinical-photo-modal');
    if (!modal) return;

    const photoDict = {
      'thaw-correct': {
        state: 'Técnica Correcta',
        badgeClass: 'badge-state-normal',
        title: 'Baño María Pasivo (Fuera de la Llama)',
        desc: 'Sumergir el recipiente de leche sellado en un cuenco con agua caliente previamente retirada del fuego directo (máximo 40 °C). Agitar suavemente en círculos para homogenizar la grasa natural.',
        clinicalPoints: [
          'Preserva los anticuerpos vivos (inmunoglobulina A secretora - sIgA).',
          'Evita la desnaturalización térmica de la lisozima y lactoferrina.',
          'Garantiza una distribución calórica uniforme sin puntos calientes.'
        ],
        svgPlaceholder: `<svg viewBox="0 0 120 120" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2">
          <ellipse cx="60" cy="90" rx="45" ry="16" fill="var(--bg-subtle)" stroke="var(--primary)"/>
          <path d="M25 90 C25 105 95 105 95 90" fill="var(--primary-subtle)" stroke="var(--primary)"/>
          <rect x="46" y="35" width="28" height="48" rx="5" fill="var(--bg-card)" stroke="var(--primary)" stroke-width="2.5"/>
          <path d="M46 55 Q60 58 74 55 L74 78 Q60 82 46 78 Z" fill="var(--primary)" opacity="0.25"/>
          <circle cx="60" cy="28" r="6" stroke="var(--secondary)" stroke-width="2"/>
          <path d="M40 30 Q35 22 40 15 M80 30 Q85 22 80 15" stroke="var(--sem-green)" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 3"/>
        </svg>`
      },
      'thaw-danger': {
        state: 'Peligro Crítico',
        badgeClass: 'badge-state-alert',
        title: 'Microondas o Fuego Directo',
        desc: 'El microondas o hervir al fuego calienta de forma irregular creando zonas hirviendo invisibles capaces de quemar la mucosa bucofaríngea del bebé, destruyendo además todas las defensas inmunitarias.',
        clinicalPoints: [
          'Riesgo grave de quemaduras esofágicas por puntos calientes ("hot spots").',
          'Destrucción irreversible de enzimas protectoras y vitaminas termosensibles.',
          'Peligro de liberación de sustancias nocivas en recipientes no aptos.'
        ],
        svgPlaceholder: `<svg viewBox="0 0 120 120" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="25" y="30" width="70" height="55" rx="8" fill="var(--bg-card)" stroke="var(--sem-red)" stroke-width="2"/>
          <rect x="32" y="38" width="40" height="38" rx="4" fill="var(--sem-red-bg)" stroke="var(--sem-red)" stroke-dasharray="3 3"/>
          <line x1="82" y1="42" x2="88" y2="42" stroke="var(--sem-red)" stroke-width="2"/>
          <line x1="82" y1="50" x2="88" y2="50" stroke="var(--sem-red)" stroke-width="2"/>
          <circle cx="85" cy="65" r="4" stroke="var(--sem-red)" stroke-width="2"/>
          <line x1="20" y1="20" x2="100" y2="100" stroke="var(--sem-red)" stroke-width="3" stroke-linecap="round"/>
        </svg>`
      },
      'fontanela-normal': {
        state: 'Signo Normal',
        badgeClass: 'badge-state-normal',
        title: 'Fontanela Normotensa (Plana al tacto)',
        desc: 'Al palpar suavemente la parte superior de la cabeza con el bebé erguido y tranquilo, la fontanela anterior se siente plana, nivelada con la superficie del cráneo y ligeramente pulsátil al ritmo cardíaco.',
        clinicalPoints: [
          'Superficie plana sin depresión ni abombamiento excesivo.',
          'Latido arterial suave perceptible, totalmente fisiológico.',
          'Indica adecuada presión intracraneal y buen balance de líquidos corporales.'
        ],
        svgPlaceholder: `<svg viewBox="0 0 120 120" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="60" cy="65" r="38" fill="var(--bg-subtle)" stroke="var(--primary)" stroke-width="2.5"/>
          <path d="M38 42 C48 48 72 48 82 42" stroke="var(--sem-green)" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="50" cy="65" r="3" fill="var(--primary)"/>
          <circle cx="70" cy="65" r="3" fill="var(--primary)"/>
          <path d="M55 78 Q60 83 65 78" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`
      },
      'fontanela-alert': {
        state: 'Signo de Alarma',
        badgeClass: 'badge-state-alert',
        title: 'Fontanela Deprimida o Hundida',
        desc: 'La fontanela anterior se aprecia visiblemente hundida o se palpa como un desnivel marcado por debajo de los bordes óseos del cráneo. Es un signo clásico de deshidratación moderada a severa.',
        clinicalPoints: [
          'Hundimiento apreciable a simple vista o al deslizamiento suave del pulpejo.',
          'Disminución del turgor cerebral por pérdida de líquido extracelular.',
          'Requiere evaluación médica pediátrica urgente o administración de tomas/rehidratación inmediata.'
        ],
        svgPlaceholder: `<svg viewBox="0 0 120 120" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="60" cy="65" r="38" fill="var(--bg-subtle)" stroke="var(--sem-red)" stroke-width="2.5"/>
          <path d="M38 38 Q60 56 82 38" stroke="var(--sem-red)" stroke-width="4" stroke-linecap="round"/>
          <path d="M60 22 V35 M55 30 L60 36 L65 30" stroke="var(--sem-red)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="50" cy="68" r="3" fill="var(--sem-red)"/>
          <circle cx="70" cy="68" r="3" fill="var(--sem-red)"/>
          <path d="M55 82 Q60 77 65 82" stroke="var(--sem-red)" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`
      },
      'mucosas-normal': {
        state: 'Signo Normal',
        badgeClass: 'badge-state-normal',
        title: 'Mucosas Orales y Labios Húmedos',
        desc: 'Los labios se muestran rosados y brillantes; la lengua y las encías presentan una capa continua de saliva líquida y fluida sin adherencias blanquecinas ni sequedad.',
        clinicalPoints: [
          'Labios suaves y humectados, sin fisuras ni descamación.',
          'Saliva fluida y visible en cavidad oral y comisuras labiales.',
          'Buena perfusión tisular periférica y óptimo estado de hidratación.'
        ],
        svgPlaceholder: `<svg viewBox="0 0 120 120" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M30 60 Q60 40 90 60 Q60 85 30 60 Z" fill="var(--sem-green-bg)" stroke="var(--sem-green)" stroke-width="2.5"/>
          <circle cx="52" cy="58" r="2.5" fill="var(--sem-green)"/>
          <circle cx="68" cy="58" r="2.5" fill="var(--sem-green)"/>
          <path d="M45 66 Q60 74 75 66" stroke="var(--sem-green)" stroke-width="2" stroke-linecap="round"/>
        </svg>`
      },
      'mucosas-alert': {
        state: 'Signo de Alarma',
        badgeClass: 'badge-state-alert',
        title: 'Mucosas Orales Secas y Saliva Espesa',
        desc: 'Lengua y encías blanquecinas, secas o pegajosas al tacto. Labios cuarteados o con pieles secas por falta de líquido circulante.',
        clinicalPoints: [
          'Falta de brillo y ausencia de saliva líquida en la boca.',
          'Lengua áspera ("lengua de loro" en cuadros avanzados de deshidratación).',
          'Alerta clínica de hipovolemia o aporte insuficiente de leche materna.'
        ],
        svgPlaceholder: `<svg viewBox="0 0 120 120" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M30 60 Q60 48 90 60 Q60 76 30 60 Z" fill="var(--sem-red-bg)" stroke="var(--sem-red)" stroke-width="2.5"/>
          <line x1="50" y1="52" x2="52" y2="68" stroke="var(--sem-red)" stroke-width="2" stroke-linecap="round"/>
          <line x1="62" y1="50" x2="60" y2="70" stroke="var(--sem-red)" stroke-width="2" stroke-linecap="round"/>
          <line x1="72" y1="54" x2="70" y2="66" stroke="var(--sem-red)" stroke-width="2" stroke-linecap="round"/>
        </svg>`
      },
      'pliegue-normal': {
        state: 'Signo Normal',
        badgeClass: 'badge-state-normal',
        title: 'Signo del Pliegue Cutáneo Negativo',
        desc: 'Al pellizcar con suavidad un pliegue de piel en el abdomen entre el pulgar y el índice durante 1 segundo y soltarlo, la piel recupera de inmediato su forma lisa (< 1 segundo).',
        clinicalPoints: [
          'Turgor dérmico elástico conservado.',
          'Retorno instantáneo sin dejar huella ni pliegue residual.',
          'Buen contenido hídrico celular y tisular intersticial.'
        ],
        svgPlaceholder: `<svg viewBox="0 0 120 120" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M25 70 Q60 62 95 70" stroke="var(--sem-green)" stroke-width="4" stroke-linecap="round"/>
          <circle cx="60" cy="66" r="3" fill="var(--sem-green)"/>
          <path d="M45 45 L52 55 M75 45 L68 55" stroke="var(--sem-green)" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`
      },
      'pliegue-alert': {
        state: 'Signo de Alarma',
        badgeClass: 'badge-state-alert',
        title: 'Signo del Pliegue Cutáneo Positivo (> 2s)',
        desc: 'La piel pellizcada en el abdomen tarda 2 segundos o más en volver a su posición plana (se mantiene levantada como tienda de campaña). Es un signo cardenal de deshidratación con pérdida marcada de turgencia celular.',
        clinicalPoints: [
          'Pliegue cutáneo que permanece visible tras soltar los dedos.',
          'Pérdida severa del espacio intersticial extracelular.',
          'Criterio de alarma según OMS / AIEPI que amerita evaluación pediátrica urgente.'
        ],
        svgPlaceholder: `<svg viewBox="0 0 120 120" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M25 75 Q48 70 52 45 Q60 35 68 45 Q72 70 95 75" stroke="var(--sem-red)" stroke-width="3.5" stroke-linecap="round"/>
          <path d="M38 35 L48 42 M82 35 L72 42" stroke="var(--sem-red)" stroke-width="2" stroke-linecap="round"/>
        </svg>`
      },
      'ojos-normal': {
        state: 'Signo Normal',
        badgeClass: 'badge-state-normal',
        title: 'Ojos Brillantes y Lágrimas Presentes',
        desc: 'Los ojos se observan húmedos, vivaces y en posición anatómica normal respecto a las órbitas. Al llorar, el lactante produce lágrimas copiosas y visibles.',
        clinicalPoints: [
          'Globo ocular normotenso y córnea brillante.',
          'Glándulas lagrimales plenamente funcionantes.',
          'Mirada reactiva y con adecuado contacto visual.'
        ],
        svgPlaceholder: `<svg viewBox="0 0 120 120" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M30 60 Q60 38 90 60 Q60 82 30 60 Z" fill="var(--sem-green-bg)" stroke="var(--sem-green)" stroke-width="2.5"/>
          <circle cx="60" cy="60" r="10" fill="var(--sem-green)" stroke="var(--sem-green)"/>
          <circle cx="63" cy="57" r="3.5" fill="#fff"/>
          <path d="M92 68 Q95 75 92 80 A3 3 0 0 1 89 77 Q89 73 92 68 Z" fill="var(--sem-green)" stroke="none"/>
        </svg>`
      },
      'ojos-alert': {
        state: 'Signo de Alarma',
        badgeClass: 'badge-state-alert',
        title: 'Ojos Hundidos y Llanto sin Lágrimas',
        desc: 'Los ojos se ven profundos o apagados en sus cuencas orbitarias. Durante el llanto intenso no se observa caída de lágrimas en las mejillas ni humedad conjuntival.',
        clinicalPoints: [
          'Hundimiento del cojinete graso retro-orbitario por deshidratación.',
          'Cese de la secreción lagrimal como mecanismo de ahorro hídrico.',
          'Lactante irritable, con llanto débil o adormilado.'
        ],
        svgPlaceholder: `<svg viewBox="0 0 120 120" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2">
          <ellipse cx="60" cy="60" rx="32" ry="18" fill="var(--sem-red-bg)" stroke="var(--sem-red)" stroke-width="2" stroke-dasharray="3 3"/>
          <circle cx="60" cy="60" r="8" fill="var(--sem-red)"/>
          <path d="M50 42 Q60 36 70 42" stroke="var(--sem-red)" stroke-width="2" stroke-linecap="round"/>
        </svg>`
      }
    };

    const data = photoDict[conditionKey] || {
      state: 'Referencia Clínica',
      badgeClass: 'badge-state-normal',
      title: title || 'Ejemplo Clínico',
      desc: 'Consulta médica recomendada para contrastar hallazgos en tu bebé.',
      clinicalPoints: ['Signo clínico de valoración de salud neonatal.'],
      svgPlaceholder: ''
    };

    const titleEl = document.getElementById('clinical-photo-modal-title');
    const badgeEl = document.getElementById('clinical-photo-modal-badge');
    const graphicEl = document.getElementById('clinical-photo-modal-graphic');
    const descEl = document.getElementById('clinical-photo-modal-desc');
    const listEl = document.getElementById('clinical-photo-modal-points');

    if (titleEl) titleEl.innerText = data.title;
    if (badgeEl) {
      badgeEl.className = `clinical-photo-badge ${data.badgeClass}`;
      badgeEl.innerText = data.state;
    }
    if (graphicEl) graphicEl.innerHTML = data.svgPlaceholder;
    if (descEl) descEl.innerText = data.desc;
    if (listEl) {
      listEl.innerHTML = data.clinicalPoints.map(p => `<li>${p}</li>`).join('');
    }

    modal.classList.add('show');
  },

  closePhotoModal() {
    const modal = document.getElementById('clinical-photo-modal');
    if (modal) modal.classList.remove('show');
  },

  handleTransferToFridge(loteId) {
    if (confirm(`¿Transferir el Lote #${String(loteId).padStart(2, '0')} al refrigerador (4 °C) para prolongar su conservación hasta 4 días?`)) {
      FIFOEngine.transferToFridge(loteId);
      SoundEffects.playChime('success');
      this.showToast(`Lote #${String(loteId).padStart(2, '0')} transferido al refrigerador.`);
      this.refreshAllUI();
    }
  },

  handleTransferToFreezer(loteId) {
    if (confirm(`¿Transferir el Lote #${String(loteId).padStart(2, '0')} al congelador (-18 °C) para extender su viabilidad a 6 meses?`)) {
      FIFOEngine.transferToFreezer(loteId);
      SoundEffects.playChime('success');
      this.showToast(`Lote #${String(loteId).padStart(2, '0')} transferido al congelador.`);
      this.refreshAllUI();
    }
  },

  async handleDiscard(loteId) {
    const reason = prompt("Indica el motivo de descarte (ej. Superó 96 horas, rotura de cadena de frío):", "Superó ventana segura de conservación");
    if (reason !== null) {
      try {
        await ApiClient.deleteBatch(loteId);
      } catch (e) {
        console.warn("[UIController] Eliminado localmente:", e);
      }

      FIFOEngine.discardBatch(loteId, reason);
      SoundEffects.playChime('alarm');
      this.showToast(`Lote #${String(loteId).padStart(2, '0')} eliminado del banco de leche.`);
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

  async saveTriageEvaluation() {
    const res = NeonatalTriage.evaluate(this.selectedTriage);
    const fecha = new Date().toISOString();

    try {
      await ApiClient.createEvaluation({
        evaluation_date: fecha,
        fontanelle_status: this.selectedTriage.fontanela,
        oral_mucosa_status: this.selectedTriage.mucosas,
        skin_pinch_status: this.selectedTriage.pliegue,
        sunken_eyes_status: this.selectedTriage.ojos,
        triage_level: res.level,
        action_taken: res.actionRequired || "Monitoreo domiciliario"
      });
    } catch (e) {
      console.warn("[UIController] Triaje guardado localmente de respaldo:", e);
    }

    const evaluaciones = StorageManager.get(StorageManager.KEYS.EVALUACIONES) || [];
    const newId = evaluaciones.length > 0 ? Math.max(...evaluaciones.map(e => e.id_evaluacion)) + 1 : 1;

    evaluaciones.push({
      id_evaluacion: newId,
      id_lactante: 1,
      fecha_hora_evaluacion: fecha,
      estado_fontanela: this.selectedTriage.fontanela,
      estado_mucosas: this.selectedTriage.mucosas,
      signo_pliegue: this.selectedTriage.pliegue,
      estado_ojos: this.selectedTriage.ojos,
      nivel_clasificacion: res.level,
      derivo_urgencia: res.level === 'danger'
    });

    StorageManager.set(StorageManager.KEYS.EVALUACIONES, evaluaciones);
    SoundEffects.playChime('success');
    this.showToast("Revisión de bienestar guardada con éxito.");
  },

  async saveProfileToBackend() {
    const fullName = document.getElementById('prof-inp-fullname')?.value.trim();
    const babyName = document.getElementById('prof-inp-babyname')?.value.trim();
    const role = document.getElementById('prof-inp-role')?.value;
    const phone = document.getElementById('prof-inp-phone')?.value.trim();
    const rawWeight = document.getElementById('prof-inp-weight')?.value;
    const rawDays = document.getElementById('prof-inp-days')?.value;
    const weight = parseFloat(rawWeight);
    const days = parseInt(rawDays);

    if (!fullName || fullName.length < 3) {
      this.showToast("El nombre del cuidador debe tener al menos 3 caracteres.");
      return;
    }
    if (!babyName || babyName.length < 2) {
      this.showToast("El nombre del lactante debe tener al menos 2 caracteres.");
      return;
    }
    if (isNaN(weight) || weight <= 0) {
      this.showToast("El peso del bebé debe ser un número positivo mayor a 0 gramos (no se permiten números negativos).");
      return;
    }
    if (weight < 1500 || weight > 12000) {
      this.showToast("El peso del bebé debe encontrarse entre 1.500 g y 12.000 g.");
      return;
    }
    if (isNaN(days) || days < 0) {
      this.showToast("Los días de vida no pueden ser un valor negativo.");
      return;
    }

    try {
      await ApiClient.updateProfile({
        full_name: fullName,
        caregiver_role: role,
        emergency_phone: phone,
        baby_name: babyName,
        birth_date: new Date().toISOString().slice(0, 10),
        days_old: days,
        weight_grams: weight,
        sex: "Femenino"
      });

      const user = StorageManager.get(StorageManager.KEYS.USUARIO) || {};
      user.nombre_completo = fullName;
      user.rol_cuidador = role;
      user.telefono_emergencia = phone;
      StorageManager.set(StorageManager.KEYS.USUARIO, user);

      const infant = StorageManager.get(StorageManager.KEYS.LACTANTE) || {};
      infant.nombre_bebe = babyName;
      infant.peso_gramos = weight;
      infant.edad_dias = days;
      StorageManager.set(StorageManager.KEYS.LACTANTE, infant);

      if (AuthController.currentUser) {
        AuthController.currentUser.full_name = fullName;
        AuthController.currentUser.caregiver_role = role;
        AuthController.currentUser.emergency_phone = phone;
      }
      if (AuthController.currentInfant) {
        AuthController.currentInfant.baby_name = babyName;
        AuthController.currentInfant.weight_grams = weight;
        AuthController.currentInfant.days_old = days;
      }

      AuthController.updateHeaderAuth(true);
      this.refreshAllUI();
      SoundEffects.playChime('success');
      this.showToast('Datos actualizados y guardados correctamente.');
    } catch (err) {
      this.showToast(`Error al guardar en base de datos: ${err.message}`);
    }
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
        <div class="empty-state-box" style="padding: 20px;">
          No se registraron extracciones el ${day} de ${this.selectedCalendarDate.toLocaleString('es', { month: 'long' })}.
        </div>
      `;
      return;
    }

    let itemsHtml = lotes.map(l => {
      const st = FIFOEngine.getBatchStatus(l);
      return `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px 10px; padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--neutral-200); border-radius: var(--radius-sm); margin-bottom: 6px;">
          <div style="min-width: 0;">
            <strong>LOTE #${String(l.id_lote).padStart(2, '0')}</strong> (${l.volumen_ml} ml)
            <div style="font-size: 11px; color: var(--neutral-500);">${l.ubicacion_termica === 'Ambiente' ? 'Ambiente (≤25 °C)' : (l.ubicacion_termica === 'Refrigerador_4C' ? 'Refrigerador (4 °C)' : 'Congelador (-18 °C)')}</div>
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
        <div class="empty-state-box">
          <div class="empty-state-illus">
            <svg viewBox="0 0 48 48" width="38" height="38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 8H32C34.2 8 36 9.8 36 12V36C36 38.2 34.2 40 32 40H16C13.8 40 12 38.2 12 36V12C12 9.8 13.8 8 16 8Z" fill="var(--primary-subtle)" stroke="var(--primary)" stroke-width="2"/>
              <path d="M18 18H30M18 24H30M18 30H24" stroke="var(--primary)" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="empty-state-title">No hay tomas registradas</div>
          <p class="empty-state-desc">Usa el botón «+ Registrar Toma» para añadir una administración de leche materna.</p>
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
      const tempCheck = c.temperatura_temperado_ok ? '✓ Dorso muñeca' : 'No verificada';
      return `
        <tr>
          <td data-label="Fecha y Hora"><strong>${fecha}</strong></td>
          <td data-label="Origen">${c.id_lote ? `Lote #${String(c.id_lote).padStart(2, '0')}` : 'Directa'}</td>
          <td data-label="Volumen"><strong style="color: var(--primary);">${c.volumen_ingerido_ml} ml</strong> (${(c.volumen_ingerido_ml / 29.57).toFixed(1)} oz)</td>
          <td data-label="Método"><span class="tag-method">${metodo}</span></td>
          <td data-label="Temperado">${c.tiempo_temperado_min || 10} min (${tempCheck})</td>
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

      <h3>1. Estado del Banco de Leche en el Hogar (Frascos Activos)</h3>
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
