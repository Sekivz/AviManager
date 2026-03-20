import {
  Component, OnInit, signal, computed,
  HostListener, effect, AfterViewInit, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { FormsModule } from '@angular/forms';

// ── Interfaces ────────────────────────────────────────────────
export interface Lote {
  id: number;
  galpon: string;
  cantidadInicial: number;
  cantidadActual: number;
  costoUnitario: number;
  precioVentaEstimado: number;
  fechaIngreso: string;
  pesoPromedio?: number;        // kg actual promedio
  alimentoDiario?: number;      // kg alimento/día
  causa?: string;               // causa de última baja
}

export interface Baja {
  id: number;
  loteId: number;
  galpon: string;
  cantidad: number;
  causa: 'enfermedad' | 'accidente' | 'natural' | 'desconocida';
  notas: string;
  fecha: string;
  usuario: string;
}

export interface HistorialItem {
  id: number;
  tipo: 'crear' | 'editar' | 'eliminar' | 'baja' | 'importar';
  descripcion: string;
  detalle: string;
  timestamp: Date;
  usuario: string;
}

export interface Alerta {
  id: string;
  tipo: 'danger' | 'warning';
  titulo: string;
  mensaje: string;
  leida: boolean;
  timestamp: Date;
}

export interface OnboardingStep {
  target: string;
  title: string;
  desc: string;
  icon: string;
}

export type NavId = 'dashboard' | 'lotes' | 'alertas' | 'reportes' | 'config';
export type LangCode = 'es' | 'en' | 'pt' | 'fr' | 'de' | 'zh';

// ── i18n ──────────────────────────────────────────────────────
const TRANSLATIONS: Record<LangCode, Record<string, string>> = {
  es: {
    appName:'AviManager', dashboard:'Dashboard', lotes:'Lotes', alertas:'Alertas',
    reportes:'Reportes', config:'Configuración', dashboardTitle:'Dashboard Avícola',
    dashboardSub:'Gestión integral de lotes y métricas en tiempo real',
    nuevoLote:'Nuevo Lote', invertotal:'Inversión Total', gananciaEst:'Ganancia Estimada',
    mortalidadProm:'Mortalidad Promedio', totalAves:'Total Aves Vivas',
    capitalActivo:'Capital activo en operación', proyeccion:'Proyección aves vivas',
    lotesActivos:'lotes activos', tendencias:'Tendencias por Lote',
    mortalidad:'Mortalidad', crecimiento:'Crecimiento',
    gestionLotes:'Gestión de Lotes', galpon:'Galpón', aves:'Aves',
    inversion:'Inversión', ganancia:'Ganancia', acciones:'Acciones',
    editar:'Editar', baja:'Registrar Baja', eliminar:'Eliminar',
    editarLote:'Editar Lote', crearLote:'Nuevo Lote',
    datosGalpon:'Completa los datos del galpón',
    cantInicial:'Cantidad Inicial', cantActual:'Cantidad Actual',
    costoAve:'Costo/Ave (USD)', precioVenta:'Precio Venta Est. (USD)',
    fechaIngreso:'Fecha Ingreso', cancelar:'Cancelar',
    guardarCambios:'Guardar Cambios', crear:'Crear Lote',
    historialCambios:'Historial de Cambios', descargarPDF:'Descargar PDF',
    sinHistorial:'Sin registros aún', todoNormal:'Todo en orden',
    sinAlertasActivas:'Sin alertas activas', marcarTodas:'Marcar todas',
    alertasTitle:'Alertas del Sistema', alertasSub:'Monitoreo automático de umbrales críticos',
    lotesTitle:'Gestión de Lotes', lotesSub:'Administra y monitorea todos los lotes activos',
    reportesTitle:'Reportes y Análisis', reportesSub:'Proyecciones, rentabilidad y exportación',
    configTitle:'Configuración', configSub:'Preferencias del sistema',
    usuario:'Usuario', nombreUsuario:'Nombre de usuario', cambiarNombre:'Cambiar nombre',
    apariencia:'Apariencia', modoOscuro:'Modo Oscuro', modoClaro:'Modo Claro',
    idioma:'Idioma', guardado:'Guardado', guardar:'Guardar',
    rangoNormal:'Rango normal', atencionRequerida:'Atención requerida',
    critico:'CRÍTICO — Revisar lotes', umbralPct:'Umbral 5%', mortalidadPct:'MORTALIDAD (%)',
    administrador:'Administrador', lotesCrud:'lotes',
    registrarBaja:'Registrar Bajas', cantBaja:'Cantidad de bajas',
    causaBaja:'Causa', notasBaja:'Notas adicionales',
    causeEnfermedad:'Enfermedad', causeAccidente:'Accidente',
    causeNatural:'Natural', causeDesconocida:'Desconocida',
    importarCSV:'Importar CSV', proyeccionTitle:'Proyección de Rentabilidad',
    diasRestantes:'Días a venta estimada', rentabilidad:'Rentabilidad',
    roi:'ROI estimado', onboardingSkip:'Omitir tour',
    onboardingNext:'Siguiente', onboardingFin:'Comenzar',
    pesoPromedio:'Peso Promedio (kg)', alimentoDiario:'Alimento Diario (kg)',
  },
  en: {
    appName:'AviManager', dashboard:'Dashboard', lotes:'Batches', alertas:'Alerts',
    reportes:'Reports', config:'Settings', dashboardTitle:'Poultry Dashboard',
    dashboardSub:'Comprehensive batch and metrics management in real time',
    nuevoLote:'New Batch', invertotal:'Total Investment', gananciaEst:'Estimated Profit',
    mortalidadProm:'Avg Mortality', totalAves:'Total Live Birds',
    capitalActivo:'Active capital in operation', proyeccion:'Live birds projection',
    lotesActivos:'active batches', tendencias:'Batch Trends',
    mortalidad:'Mortality', crecimiento:'Growth',
    gestionLotes:'Batch Management', galpon:'Coop', aves:'Birds',
    inversion:'Investment', ganancia:'Profit', acciones:'Actions',
    editar:'Edit', baja:'Register Loss', eliminar:'Delete',
    editarLote:'Edit Batch', crearLote:'New Batch', datosGalpon:'Fill in coop details',
    cantInicial:'Initial Count', cantActual:'Current Count',
    costoAve:'Cost/Bird (USD)', precioVenta:'Est. Sale Price (USD)',
    fechaIngreso:'Entry Date', cancelar:'Cancel',
    guardarCambios:'Save Changes', crear:'Create Batch',
    historialCambios:'Change History', descargarPDF:'Download PDF',
    sinHistorial:'No records yet', todoNormal:'All clear',
    sinAlertasActivas:'No active alerts', marcarTodas:'Mark all read',
    alertasTitle:'System Alerts', alertasSub:'Automatic monitoring of critical thresholds',
    lotesTitle:'Batch Management', lotesSub:'Manage and monitor all active batches',
    reportesTitle:'Reports & Analysis', reportesSub:'Projections, profitability and export',
    configTitle:'Settings', configSub:'System preferences',
    usuario:'User', nombreUsuario:'Username', cambiarNombre:'Change name',
    apariencia:'Appearance', modoOscuro:'Dark Mode', modoClaro:'Light Mode',
    idioma:'Language', guardado:'Saved', guardar:'Save',
    rangoNormal:'Normal range', atencionRequerida:'Attention required',
    critico:'CRITICAL — Review batches', umbralPct:'Threshold 5%', mortalidadPct:'MORTALITY (%)',
    administrador:'Administrator', lotesCrud:'batches',
    registrarBaja:'Register Losses', cantBaja:'Loss count',
    causaBaja:'Cause', notasBaja:'Additional notes',
    causeEnfermedad:'Disease', causeAccidente:'Accident',
    causeNatural:'Natural', causeDesconocida:'Unknown',
    importarCSV:'Import CSV', proyeccionTitle:'Profitability Projection',
    diasRestantes:'Days to estimated sale', rentabilidad:'Profitability',
    roi:'Estimated ROI', onboardingSkip:'Skip tour',
    onboardingNext:'Next', onboardingFin:'Get started',
    pesoPromedio:'Avg Weight (kg)', alimentoDiario:'Daily Feed (kg)',
  },
  pt: {
    appName:'AviManager', dashboard:'Painel', lotes:'Lotes', alertas:'Alertas',
    reportes:'Relatórios', config:'Configurações', dashboardTitle:'Painel Avícola',
    dashboardSub:'Gestão integral de lotes e métricas em tempo real',
    nuevoLote:'Novo Lote', invertotal:'Investimento Total', gananciaEst:'Lucro Estimado',
    mortalidadProm:'Mortalidade Média', totalAves:'Total de Aves Vivas',
    capitalActivo:'Capital ativo em operação', proyeccion:'Projeção de aves vivas',
    lotesActivos:'lotes ativos', tendencias:'Tendências por Lote',
    mortalidad:'Mortalidade', crecimiento:'Crescimento',
    gestionLotes:'Gestão de Lotes', galpon:'Galinheiro', aves:'Aves',
    inversion:'Investimento', ganancia:'Lucro', acciones:'Ações',
    editar:'Editar', baja:'Registrar Baixa', eliminar:'Excluir',
    editarLote:'Editar Lote', crearLote:'Novo Lote', datosGalpon:'Preencha os dados',
    cantInicial:'Qtd. Inicial', cantActual:'Qtd. Atual',
    costoAve:'Custo/Ave (USD)', precioVenta:'Preço Venda Est. (USD)',
    fechaIngreso:'Data Entrada', cancelar:'Cancelar',
    guardarCambios:'Salvar Alterações', crear:'Criar Lote',
    historialCambios:'Histórico', descargarPDF:'Baixar PDF',
    sinHistorial:'Sem registros', todoNormal:'Tudo em ordem',
    sinAlertasActivas:'Sem alertas', marcarTodas:'Marcar todas',
    alertasTitle:'Alertas do Sistema', alertasSub:'Monitoramento automático',
    lotesTitle:'Gestão de Lotes', lotesSub:'Administre todos os lotes',
    reportesTitle:'Relatórios e Análise', reportesSub:'Projeções e exportação',
    configTitle:'Configurações', configSub:'Preferências do sistema',
    usuario:'Usuário', nombreUsuario:'Nome de usuário', cambiarNombre:'Alterar nome',
    apariencia:'Aparência', modoOscuro:'Modo Escuro', modoClaro:'Modo Claro',
    idioma:'Idioma', guardado:'Salvo', guardar:'Salvar',
    rangoNormal:'Faixa normal', atencionRequerida:'Atenção necessária',
    critico:'CRÍTICO — Revisar lotes', umbralPct:'Limite 5%', mortalidadPct:'MORTALIDADE (%)',
    administrador:'Administrador', lotesCrud:'lotes',
    registrarBaja:'Registrar Baixas', cantBaja:'Quantidade de baixas',
    causaBaja:'Causa', notasBaja:'Notas adicionais',
    causeEnfermedad:'Doença', causeAccidente:'Acidente',
    causeNatural:'Natural', causeDesconocida:'Desconhecida',
    importarCSV:'Importar CSV', proyeccionTitle:'Projeção de Rentabilidade',
    diasRestantes:'Dias para venda estimada', rentabilidad:'Rentabilidade',
    roi:'ROI estimado', onboardingSkip:'Pular tour',
    onboardingNext:'Próximo', onboardingFin:'Começar',
    pesoPromedio:'Peso Médio (kg)', alimentoDiario:'Ração Diária (kg)',
  },
  fr: {
    appName:'AviManager', dashboard:'Tableau de bord', lotes:'Lots', alertas:'Alertes',
    reportes:'Rapports', config:'Paramètres', dashboardTitle:'Tableau de bord avicole',
    dashboardSub:'Gestion intégrale des lots en temps réel',
    nuevoLote:'Nouveau lot', invertotal:'Investissement total', gananciaEst:'Bénéfice estimé',
    mortalidadProm:'Mortalité moyenne', totalAves:'Total oiseaux vivants',
    capitalActivo:'Capital actif en exploitation', proyeccion:'Projection oiseaux vivants',
    lotesActivos:'lots actifs', tendencias:'Tendances par lot',
    mortalidad:'Mortalité', crecimiento:'Croissance',
    gestionLotes:'Gestion des lots', galpon:'Poulailler', aves:'Oiseaux',
    inversion:'Investissement', ganancia:'Bénéfice', acciones:'Actions',
    editar:'Modifier', baja:'Enregistrer perte', eliminar:'Supprimer',
    editarLote:'Modifier lot', crearLote:'Nouveau lot', datosGalpon:'Remplir les données',
    cantInicial:'Qté initiale', cantActual:'Qté actuelle',
    costoAve:'Coût/oiseau (USD)', precioVenta:'Prix vente est. (USD)',
    fechaIngreso:"Date d'entrée", cancelar:'Annuler',
    guardarCambios:'Enregistrer', crear:'Créer lot',
    historialCambios:'Historique', descargarPDF:'Télécharger PDF',
    sinHistorial:'Aucun enregistrement', todoNormal:'Tout est normal',
    sinAlertasActivas:'Aucune alerte', marcarTodas:'Tout marquer',
    alertasTitle:'Alertes système', alertasSub:'Surveillance automatique',
    lotesTitle:'Gestion des lots', lotesSub:'Gérez tous les lots actifs',
    reportesTitle:'Rapports et Analyses', reportesSub:'Projections et exportation',
    configTitle:'Paramètres', configSub:'Préférences du système',
    usuario:'Utilisateur', nombreUsuario:"Nom d'utilisateur", cambiarNombre:'Changer le nom',
    apariencia:'Apparence', modoOscuro:'Mode sombre', modoClaro:'Mode clair',
    idioma:'Langue', guardado:'Enregistré', guardar:'Enregistrer',
    rangoNormal:'Plage normale', atencionRequerida:'Attention requise',
    critico:'CRITIQUE — Vérifier lots', umbralPct:'Seuil 5%', mortalidadPct:'MORTALITÉ (%)',
    administrador:'Administrateur', lotesCrud:'lots',
    registrarBaja:'Enregistrer pertes', cantBaja:'Nombre de pertes',
    causaBaja:'Cause', notasBaja:'Notes supplémentaires',
    causeEnfermedad:'Maladie', causeAccidente:'Accident',
    causeNatural:'Naturelle', causeDesconocida:'Inconnue',
    importarCSV:'Importer CSV', proyeccionTitle:'Projection de Rentabilité',
    diasRestantes:'Jours à la vente estimée', rentabilidad:'Rentabilité',
    roi:'ROI estimé', onboardingSkip:'Passer le tour',
    onboardingNext:'Suivant', onboardingFin:'Commencer',
    pesoPromedio:'Poids moyen (kg)', alimentoDiario:'Alimentation quotidienne (kg)',
  },
  de: {
    appName:'AviManager', dashboard:'Dashboard', lotes:'Chargen', alertas:'Alarme',
    reportes:'Berichte', config:'Einstellungen', dashboardTitle:'Geflügel-Dashboard',
    dashboardSub:'Umfassendes Chargen-Management in Echtzeit',
    nuevoLote:'Neue Charge', invertotal:'Gesamtinvestition', gananciaEst:'Geschätzter Gewinn',
    mortalidadProm:'Durchschn. Sterblichkeit', totalAves:'Lebende Vögel gesamt',
    capitalActivo:'Aktives Kapital', proyeccion:'Projektion lebende Vögel',
    lotesActivos:'aktive Chargen', tendencias:'Chargentrends',
    mortalidad:'Sterblichkeit', crecimiento:'Wachstum',
    gestionLotes:'Chargenverwaltung', galpon:'Stall', aves:'Vögel',
    inversion:'Investition', ganancia:'Gewinn', acciones:'Aktionen',
    editar:'Bearbeiten', baja:'Verlust registrieren', eliminar:'Löschen',
    editarLote:'Charge bearbeiten', crearLote:'Neue Charge', datosGalpon:'Stalldaten ausfüllen',
    cantInicial:'Anfangsmenge', cantActual:'Aktuelle Menge',
    costoAve:'Kosten/Vogel (USD)', precioVenta:'Gesch. Verkaufspreis (USD)',
    fechaIngreso:'Eingangsdatum', cancelar:'Abbrechen',
    guardarCambios:'Speichern', crear:'Charge erstellen',
    historialCambios:'Änderungsprotokoll', descargarPDF:'PDF herunterladen',
    sinHistorial:'Keine Einträge', todoNormal:'Alles in Ordnung',
    sinAlertasActivas:'Keine Alarme', marcarTodas:'Alle markieren',
    alertasTitle:'Systemalarme', alertasSub:'Automatische Überwachung',
    lotesTitle:'Chargenverwaltung', lotesSub:'Alle aktiven Chargen verwalten',
    reportesTitle:'Berichte und Analysen', reportesSub:'Projektionen und Export',
    configTitle:'Einstellungen', configSub:'Systempräferenzen',
    usuario:'Benutzer', nombreUsuario:'Benutzername', cambiarNombre:'Namen ändern',
    apariencia:'Erscheinungsbild', modoOscuro:'Dunkelmodus', modoClaro:'Hellmodus',
    idioma:'Sprache', guardado:'Gespeichert', guardar:'Speichern',
    rangoNormal:'Normalbereich', atencionRequerida:'Aufmerksamkeit erforderlich',
    critico:'KRITISCH — Chargen prüfen', umbralPct:'Schwellenwert 5%', mortalidadPct:'STERBLICHKEIT (%)',
    administrador:'Administrator', lotesCrud:'Chargen',
    registrarBaja:'Verluste registrieren', cantBaja:'Anzahl Verluste',
    causaBaja:'Ursache', notasBaja:'Zusätzliche Notizen',
    causeEnfermedad:'Krankheit', causeAccidente:'Unfall',
    causeNatural:'Natürlich', causeDesconocida:'Unbekannt',
    importarCSV:'CSV importieren', proyeccionTitle:'Rentabilitätsprojektion',
    diasRestantes:'Tage bis zum Verkauf', rentabilidad:'Rentabilität',
    roi:'Geschätzter ROI', onboardingSkip:'Tour überspringen',
    onboardingNext:'Weiter', onboardingFin:'Loslegen',
    pesoPromedio:'Durchschnittsgew. (kg)', alimentoDiario:'Tagesfutter (kg)',
  },
  zh: {
    appName:'AviManager', dashboard:'仪表盘', lotes:'批次', alertas:'警报',
    reportes:'报告', config:'设置', dashboardTitle:'禽类管理仪表盘',
    dashboardSub:'实时综合批次与指标管理',
    nuevoLote:'新批次', invertotal:'总投资', gananciaEst:'预计收益',
    mortalidadProm:'平均死亡率', totalAves:'活禽总数',
    capitalActivo:'运营中的活跃资本', proyeccion:'活禽预测',
    lotesActivos:'活跃批次', tendencias:'批次趋势',
    mortalidad:'死亡率', crecimiento:'生长',
    gestionLotes:'批次管理', galpon:'禽舍', aves:'禽类',
    inversion:'投资', ganancia:'收益', acciones:'操作',
    editar:'编辑', baja:'登记损失', eliminar:'删除',
    editarLote:'编辑批次', crearLote:'新批次', datosGalpon:'填写禽舍数据',
    cantInicial:'初始数量', cantActual:'当前数量',
    costoAve:'每禽成本(USD)', precioVenta:'预计售价(USD)',
    fechaIngreso:'入场日期', cancelar:'取消',
    guardarCambios:'保存更改', crear:'创建批次',
    historialCambios:'变更历史', descargarPDF:'下载PDF',
    sinHistorial:'暂无记录', todoNormal:'一切正常',
    sinAlertasActivas:'无活跃警报', marcarTodas:'全部标记',
    alertasTitle:'系统警报', alertasSub:'关键阈值自动监控',
    lotesTitle:'批次管理', lotesSub:'管理和监控所有活跃批次',
    reportesTitle:'报告与分析', reportesSub:'预测、盈利能力和导出',
    configTitle:'设置', configSub:'系统偏好',
    usuario:'用户', nombreUsuario:'用户名', cambiarNombre:'更改名称',
    apariencia:'外观', modoOscuro:'深色模式', modoClaro:'浅色模式',
    idioma:'语言', guardado:'已保存', guardar:'保存',
    rangoNormal:'正常范围', atencionRequerida:'需要关注',
    critico:'严重 — 检查批次', umbralPct:'阈值5%', mortalidadPct:'死亡率(%)',
    administrador:'管理员', lotesCrud:'批次',
    registrarBaja:'登记损失', cantBaja:'损失数量',
    causaBaja:'原因', notasBaja:'附加说明',
    causeEnfermedad:'疾病', causeAccidente:'事故',
    causeNatural:'自然', causeDesconocida:'未知',
    importarCSV:'导入CSV', proyeccionTitle:'盈利预测',
    diasRestantes:'距预计销售天数', rentabilidad:'盈利能力',
    roi:'预计ROI', onboardingSkip:'跳过导览',
    onboardingNext:'下一步', onboardingFin:'开始',
    pesoPromedio:'平均体重(kg)', alimentoDiario:'日饲料量(kg)',
  },
};

const LANG_NAMES: Record<LangCode, string> = {
  es:'Español', en:'English', pt:'Português', fr:'Français', de:'Deutsch', zh:'中文',
};

// ── Validator personalizado ────────────────────────────────────
function cantActualValidator(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const inicial = parent.get('cantidadInicial')?.value;
  if (inicial !== null && control.value > inicial) {
    return { cantActualExcede: true };
  }
  return null;
}

function fechaNoFuturaValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const fecha = new Date(control.value);
  if (fecha > hoy) return { fechaFutura: true };
  return null;
}

function precioMayorCostoValidator(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const costo = parent.get('costoUnitario')?.value;
  if (costo !== null && control.value <= costo) {
    return { precioMenorCosto: true };
  }
  return null;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {

  // ── UI State ──────────────────────────────────────────────
  sidebarOpen        = signal(true);
  activeNav          = signal<NavId>('dashboard');
  darkMode           = signal(false);
  alertasPanelOpen   = signal(false);
  modalAbierto       = signal(false);
  modalEdicion       = signal(false);
  loteEditandoId     = signal<number | null>(null);
  historialModalOpen = signal(false);
  bajaModalOpen      = signal(false);
  importModalOpen    = signal(false);
  chartTab           = signal<'mortalidad' | 'crecimiento'>('mortalidad');
  loteBajaActual     = signal<Lote | null>(null);

  // ── Onboarding ────────────────────────────────────────────
  onboardingActivo  = signal(false);
  onboardingStep    = signal(0);
  onboardingSteps: OnboardingStep[] = [
    { target:'nav-dashboard', title:'Dashboard Central',      icon:'dashboard',    desc:'Aquí ves todos tus KPIs en tiempo real: inversión, ganancia, mortalidad y aves vivas.' },
    { target:'nav-lotes',     title:'Gestión de Lotes',       icon:'inventory_2',  desc:'Crea, edita y elimina lotes. Importa desde CSV y registra bajas con causa detallada.' },
    { target:'nav-alertas',   title:'Sistema de Alertas',     icon:'notifications',desc:'Alertas automáticas cuando la mortalidad supera el 3% (aviso) o 5% (crítico).' },
    { target:'nav-reportes',  title:'Reportes y Proyecciones',icon:'bar_chart',     desc:'Proyección de rentabilidad, ROI estimado y exportación profesional a PDF y CSV.' },
    { target:'nav-config',    title:'Configuración',          icon:'settings',      desc:'Cambia tu nombre, activa el modo oscuro y elige entre 6 idiomas disponibles.' },
  ];

  // ── i18n ──────────────────────────────────────────────────
  lang      = signal<LangCode>('es');
  langNames = LANG_NAMES;
  langList: LangCode[] = ['es', 'en', 'pt', 'fr', 'de', 'zh'];

  t(key: string): string { return TRANSLATIONS[this.lang()][key] ?? key; }
  langFlag(c: LangCode): string {
    return ({es:'🇪🇸',en:'🇺🇸',pt:'🇧🇷',fr:'🇫🇷',de:'🇩🇪',zh:'🇨🇳'} as Record<LangCode,string>)[c] ?? '🌐';
  }

  // ── Usuario ───────────────────────────────────────────────
  userName    = signal('Juan Rodríguez');
  editingName = signal(false);
  nameDraft   = '';
  nameSaved   = signal(false);

  startEditName(): void { this.nameDraft = this.userName(); this.editingName.set(true); }
  saveUserName(): void {
    if (this.nameDraft.trim()) {
      this.userName.set(this.nameDraft.trim());
      this.registrarHistorial('editar','Nombre de usuario actualizado',`"${this.nameDraft.trim()}"`);
      this.saveToStorage();
    }
    this.editingName.set(false);
    this.nameSaved.set(true);
    setTimeout(() => this.nameSaved.set(false), 2000);
  }
  get userInitials(): string {
    return this.userName().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  }

  // ── ID counters ───────────────────────────────────────────
  private _nextId         = 4;
  private _nextHistId     = 0;
  private _nextBajaId     = 0;
  getNextId():     number { return this._nextId++; }
  getNextHistId(): number { return ++this._nextHistId; }
  getNextBajaId(): number { return ++this._nextBajaId; }

  // ── Datos ─────────────────────────────────────────────────
  lotes = signal<Lote[]>([
    { id:1, galpon:'Galpón A', cantidadInicial:5000, cantidadActual:4750, costoUnitario:2.50, precioVentaEstimado:5.00, fechaIngreso:'2025-01-15', pesoPromedio:1.8, alimentoDiario:320 },
    { id:2, galpon:'Galpón B', cantidadInicial:3000, cantidadActual:2820, costoUnitario:2.80, precioVentaEstimado:5.50, fechaIngreso:'2025-01-20', pesoPromedio:1.5, alimentoDiario:210 },
    { id:3, galpon:'Galpón C', cantidadInicial:4000, cantidadActual:3600, costoUnitario:3.00, precioVentaEstimado:6.00, fechaIngreso:'2025-02-01', pesoPromedio:1.2, alimentoDiario:280 },
  ]);
  alertas   = signal<Alerta[]>([]);
  historial = signal<HistorialItem[]>([]);
  bajas     = signal<Baja[]>([]);

  // ── Formulario lote ───────────────────────────────────────
  form!: FormGroup;

  // ── Formulario bajas ──────────────────────────────────────
  bajaForm!: FormGroup;
  causasBaja = ['enfermedad','accidente','natural','desconocida'] as const;

  // ── Importar CSV ──────────────────────────────────────────
  importError  = signal('');
  importPreview= signal<Partial<Lote>[]>([]);

  // ── Proyección dias a venta ───────────────────────────────
  diasVenta    = signal(30);
  diasVentaVal = 30;

  // ── KPIs ──────────────────────────────────────────────────
  totalInversion = computed(() =>
    this.lotes().reduce((s,l) => s + l.cantidadInicial * l.costoUnitario, 0)
  );
  mortalidadPromedio = computed(() => {
    const list = this.lotes();
    return list.length ? list.reduce((s,l)=>s+this.calcMortalidad(l),0)/list.length : 0;
  });
  gananciaEstimada = computed(() =>
    this.lotes().reduce((s,l) => s + l.cantidadActual*(l.precioVentaEstimado-l.costoUnitario), 0)
  );
  totalAves   = computed(() => this.lotes().reduce((s,l)=>s+l.cantidadActual, 0));
  totalBajas  = computed(() => this.bajas().reduce((s,b)=>s+b.cantidad, 0));
  alertasNoLeidas  = computed(() => this.alertas().filter(a=>!a.leida).length);
  alertasCriticas  = computed(() => this.alertas().filter(a=>a.tipo==='danger').length);
  alertasAvisos    = computed(() => this.alertas().filter(a=>a.tipo==='warning').length);
  alertasResueltas = computed(() => this.alertas().filter(a=>a.leida).length);

  // ── Proyección rentabilidad ───────────────────────────────
  proyeccionGanancia = computed(() => {
    const dias = this.diasVenta();
    return this.lotes().map(l => {
      const mort_diaria = this.calcMortalidad(l) / 100 / 42; // tasa diaria aprox
      const avesProyectadas = Math.floor(l.cantidadActual * Math.pow(1 - mort_diaria, dias));
      const ganancia = avesProyectadas * (l.precioVentaEstimado - l.costoUnitario);
      const inversion = l.cantidadInicial * l.costoUnitario;
      const roi = inversion > 0 ? ((ganancia / inversion) * 100) : 0;
      return { galpon: l.galpon, avesProyectadas, ganancia, roi, inversion };
    });
  });

  gananciaTotal = computed(() =>
    this.proyeccionGanancia().reduce((s,p)=>s+p.ganancia, 0)
  );
  roiPromedio = computed(() => {
    const list = this.proyeccionGanancia();
    return list.length ? list.reduce((s,p)=>s+p.roi,0)/list.length : 0;
  });

  // ── Nav ───────────────────────────────────────────────────
  get navItems() {
    return [
      { id:'dashboard' as NavId, label:this.t('dashboard'), icon:'dashboard'     },
      { id:'lotes'     as NavId, label:this.t('lotes'),     icon:'inventory_2'   },
      { id:'alertas'   as NavId, label:this.t('alertas'),   icon:'notifications' },
      { id:'reportes'  as NavId, label:this.t('reportes'),  icon:'bar_chart'     },
      { id:'config'    as NavId, label:this.t('config'),    icon:'settings'      },
    ];
  }

  constructor(private fb: FormBuilder) {
    effect(() => {
      document.documentElement.classList.toggle('dark', this.darkMode());
    });
  }

  ngOnInit(): void {
    this.loadFromStorage();
    this.initForm();
    this.initBajaForm();
    this.evaluarAlertas();
    // Mostrar onboarding si es primera vez
    const visto = localStorage.getItem('avi_onboarding_done');
    if (!visto) setTimeout(() => this.onboardingActivo.set(true), 800);
  }

  ngAfterViewInit(): void {}

  // ── localStorage ─────────────────────────────────────────
  saveToStorage(): void {
    try {
      localStorage.setItem('avi_lotes',    JSON.stringify(this.lotes()));
      localStorage.setItem('avi_historial',JSON.stringify(this.historial()));
      localStorage.setItem('avi_bajas',    JSON.stringify(this.bajas()));
      localStorage.setItem('avi_user',     this.userName());
      localStorage.setItem('avi_dark',     String(this.darkMode()));
      localStorage.setItem('avi_lang',     this.lang());
      localStorage.setItem('avi_nextId',   String(this._nextId));
      localStorage.setItem('avi_nextHistId',String(this._nextHistId));
      localStorage.setItem('avi_nextBajaId',String(this._nextBajaId));
    } catch(e) { console.warn('localStorage no disponible'); }
  }

  loadFromStorage(): void {
    try {
      const lotes    = localStorage.getItem('avi_lotes');
      const hist     = localStorage.getItem('avi_historial');
      const bajas    = localStorage.getItem('avi_bajas');
      const user     = localStorage.getItem('avi_user');
      const dark     = localStorage.getItem('avi_dark');
      const lang     = localStorage.getItem('avi_lang');
      const nextId   = localStorage.getItem('avi_nextId');
      const nextHist = localStorage.getItem('avi_nextHistId');
      const nextBaja = localStorage.getItem('avi_nextBajaId');

      if (lotes)    this.lotes.set(JSON.parse(lotes));
      if (hist)     this.historial.set(JSON.parse(hist).map((h:any)=>({...h,timestamp:new Date(h.timestamp)})));
      if (bajas)    this.bajas.set(JSON.parse(bajas));
      if (user)     this.userName.set(user);
      if (dark)     this.darkMode.set(dark === 'true');
      if (lang)     this.lang.set(lang as LangCode);
      if (nextId)   this._nextId    = +nextId;
      if (nextHist) this._nextHistId= +nextHist;
      if (nextBaja) this._nextBajaId= +nextBaja;
    } catch(e) { console.warn('Error cargando storage'); }
  }

  // ── Helpers ───────────────────────────────────────────────
  calcMortalidad(l: Lote): number {
    if (!l.cantidadInicial) return 0;
    return ((l.cantidadInicial - l.cantidadActual) / l.cantidadInicial) * 100;
  }
  calcInversion(l: Lote): number { return l.cantidadInicial * l.costoUnitario; }
  calcGanancia(l: Lote):  number { return l.cantidadActual * (l.precioVentaEstimado - l.costoUnitario); }

  getMortClass(l: Lote): string {
    const m = this.calcMortalidad(l);
    return m>=5 ? 'mort-red' : m>=3 ? 'mort-amber' : 'mort-green';
  }
  getMortKpiClass():  string { const m=this.mortalidadPromedio(); return m>=5?'kpi-red':m>=3?'kpi-amber':'kpi-emerald'; }
  getMortIconClass(): string { const m=this.mortalidadPromedio(); return m>=5?'red':m>=3?'amber':'emerald'; }
  getMortTrendClass():string { return this.mortalidadPromedio()>=3?'down':'up'; }
  getMortTrendMsg():  string { const m=this.mortalidadPromedio(); return m>=5?this.t('critico'):m>=3?this.t('atencionRequerida'):this.t('rangoNormal'); }

  trackById(_: number, item: any): number|string { return item.id; }

  // ── Form lote ─────────────────────────────────────────────
  initForm(lote?: Lote): void {
    this.form = this.fb.group({
      galpon:              [lote?.galpon              ?? '', [Validators.required, Validators.minLength(2)]],
      cantidadInicial:     [lote?.cantidadInicial     ?? null, [Validators.required, Validators.min(1)]],
      cantidadActual:      [lote?.cantidadActual      ?? null, [Validators.required, Validators.min(0), cantActualValidator]],
      costoUnitario:       [lote?.costoUnitario       ?? null, [Validators.required, Validators.min(0.01)]],
      precioVentaEstimado: [lote?.precioVentaEstimado ?? null, [Validators.required, Validators.min(0.01), precioMayorCostoValidator]],
      fechaIngreso:        [lote?.fechaIngreso        ?? new Date().toISOString().split('T')[0], [Validators.required, fechaNoFuturaValidator]],
      pesoPromedio:        [lote?.pesoPromedio        ?? null],
      alimentoDiario:      [lote?.alimentoDiario      ?? null],
    });
    // Cross-field: re-validar precioVenta cuando cambia costo
    this.form.get('costoUnitario')?.valueChanges.subscribe(() => {
      this.form.get('precioVentaEstimado')?.updateValueAndValidity();
    });
    this.form.get('cantidadInicial')?.valueChanges.subscribe(() => {
      this.form.get('cantidadActual')?.updateValueAndValidity();
    });
  }

  campoInvalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c?.invalid && c?.touched);
  }

  getError(campo: string): string {
    const c = this.form.get(campo);
    if (!c?.errors || !c.touched) return '';
    if (c.errors['required'])        return 'Campo obligatorio.';
    if (c.errors['minlength'])        return 'Mínimo 2 caracteres.';
    if (c.errors['min'])              return 'Debe ser mayor a 0.';
    if (c.errors['cantActualExcede']) return 'No puede superar la cantidad inicial.';
    if (c.errors['fechaFutura'])      return 'La fecha no puede ser futura.';
    if (c.errors['precioMenorCosto']) return 'El precio de venta debe ser mayor al costo.';
    return 'Valor inválido.';
  }

  // ── Form bajas ────────────────────────────────────────────
  initBajaForm(): void {
    this.bajaForm = this.fb.group({
      cantidad: [1, [Validators.required, Validators.min(1)]],
      causa:    ['enfermedad', Validators.required],
      notas:    [''],
      fecha:    [new Date().toISOString().split('T')[0], [Validators.required, fechaNoFuturaValidator]],
    });
  }

  abrirModalBaja(lote: Lote): void {
    this.loteBajaActual.set(lote);
    this.initBajaForm();
    this.bajaModalOpen.set(true);
  }

  guardarBaja(): void {
    if (this.bajaForm.invalid) { this.bajaForm.markAllAsTouched(); return; }
    const lote = this.loteBajaActual();
    if (!lote) return;
    const val = this.bajaForm.value;
    const nueva: Baja = {
      id:       this.getNextBajaId(),
      loteId:   lote.id,
      galpon:   lote.galpon,
      cantidad: val.cantidad,
      causa:    val.causa,
      notas:    val.notas,
      fecha:    val.fecha,
      usuario:  this.userName(),
    };
    this.bajas.update(list => [nueva, ...list]);
    this.lotes.update(list =>
      list.map(l => l.id === lote.id
        ? { ...l, cantidadActual: Math.max(0, l.cantidadActual - val.cantidad) }
        : l
      )
    );
    this.registrarHistorial('baja',
      `Baja: ${lote.galpon}`,
      `-${val.cantidad} aves | Causa: ${val.causa} | Total: ${lote.cantidadActual - val.cantidad}`
    );
    this.evaluarAlertas();
    this.saveToStorage();
    this.bajaModalOpen.set(false);
  }

  // ── Modal lote ────────────────────────────────────────────
  abrirModalNuevo(): void {
    this.modalEdicion.set(false); this.loteEditandoId.set(null);
    this.initForm(); this.modalAbierto.set(true);
  }
  abrirModalEditar(lote: Lote): void {
    this.modalEdicion.set(true); this.loteEditandoId.set(lote.id);
    this.initForm(lote); this.modalAbierto.set(true);
  }
  cerrarModal(): void { this.modalAbierto.set(false); }

  guardarLote(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const formVal = this.form.value as Omit<Lote,'id'>;
    if (this.modalEdicion()) {
      const prev = this.lotes().find(l=>l.id===this.loteEditandoId());
      this.lotes.update(list=>list.map(l=>l.id===this.loteEditandoId()?{...l,...formVal}:l));
      this.registrarHistorial('editar',`Editado: ${formVal.galpon}`,`${prev?.galpon} → ${formVal.galpon} | ${prev?.cantidadActual} → ${formVal.cantidadActual} aves`);
    } else {
      const nuevoId = this.getNextId();
      this.lotes.update(list=>[...list,{id:nuevoId,...formVal}]);
      this.registrarHistorial('crear',`Creado: ${formVal.galpon}`,`${formVal.cantidadInicial} aves | $${formVal.costoUnitario}/ave`);
    }
    this.evaluarAlertas();
    this.saveToStorage();
    this.cerrarModal();
  }

  eliminarLote(id: number): void {
    const lote = this.lotes().find(l=>l.id===id);
    if (!lote) return;
    this.lotes.update(list=>list.filter(l=>l.id!==id));
    this.registrarHistorial('eliminar',`Eliminado: ${lote.galpon}`,`${lote.cantidadActual} aves | $${this.calcInversion(lote).toFixed(0)}`);
    this.evaluarAlertas();
    this.saveToStorage();
  }

  // ── Importar CSV ──────────────────────────────────────────
  onFileImport(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(l=>l.trim());
        const headers = lines[0].split(',').map(h=>h.replace(/"/g,'').trim().toLowerCase());
        const preview: Partial<Lote>[] = [];
        for (let i=1; i<lines.length; i++) {
          const cols = lines[i].split(',').map(c=>c.replace(/"/g,'').trim());
          const row: any = {};
          headers.forEach((h,idx) => { row[h] = cols[idx]; });
          const lote: Partial<Lote> = {
            galpon:              row['galpon']              || row['galpón']  || `Galpón ${i}`,
            cantidadInicial:     +(row['cantidadinicial']  || row['inicial'] || 0),
            cantidadActual:      +(row['cantidadactual']   || row['actual']  || 0),
            costoUnitario:       +(row['costounitario']    || row['costo']   || 0),
            precioVentaEstimado: +(row['precioventaestimado']||row['precio'] || 0),
            fechaIngreso:        row['fechaingreso']        || row['fecha']  || new Date().toISOString().split('T')[0],
          };
          preview.push(lote);
        }
        this.importPreview.set(preview);
        this.importError.set('');
      } catch(err) {
        this.importError.set('Error al leer el archivo. Revisa el formato.');
        this.importPreview.set([]);
      }
    };
    reader.readAsText(file);
  }

  confirmarImport(): void {
    const preview = this.importPreview();
    const nuevos: Lote[] = preview.map(p => ({ id: this.getNextId(), ...p } as Lote));
    this.lotes.update(list => [...list, ...nuevos]);
    this.registrarHistorial('importar',`Importados ${nuevos.length} lotes desde CSV`,`${nuevos.map(l=>l.galpon).join(', ')}`);
    this.evaluarAlertas();
    this.saveToStorage();
    this.importPreview.set([]);
    this.importModalOpen.set(false);
  }

  // ── Historial ─────────────────────────────────────────────
  registrarHistorial(tipo: HistorialItem['tipo'], descripcion: string, detalle: string): void {
    this.historial.update(list => [{
      id: this.getNextHistId(), tipo, descripcion, detalle,
      timestamp: new Date(), usuario: this.userName(),
    }, ...list]);
  }

  historialIcono(tipo: HistorialItem['tipo']): string {
    return ({crear:'add_circle',editar:'edit',eliminar:'delete',baja:'remove_circle',importar:'upload_file'} as Record<string,string>)[tipo];
  }
  historialClass(tipo: HistorialItem['tipo']): string {
    return ({crear:'hist-green',editar:'hist-blue',eliminar:'hist-red',baja:'hist-amber',importar:'hist-violet'} as Record<string,string>)[tipo];
  }

  formatTime(d: Date): string {
    return new Date(d).toLocaleString('es-CL',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
  }

  // ── Alertas ───────────────────────────────────────────────
  readonly UMBRAL_PELIGRO = 5;
  readonly UMBRAL_AVISO   = 3;

  evaluarAlertas(): void {
    const nuevas: Alerta[] = [];
    this.lotes().forEach(l => {
      const m = this.calcMortalidad(l);
      if (m >= this.UMBRAL_PELIGRO)
        nuevas.push({ id:`${l.id}-danger`,  tipo:'danger',  titulo:`${this.t('critico')} — ${l.galpon}`,             mensaje:`Alcanzó ${m.toFixed(2)}%, umbral ${this.UMBRAL_PELIGRO}%.`, leida:false, timestamp:new Date() });
      else if (m >= this.UMBRAL_AVISO)
        nuevas.push({ id:`${l.id}-warning`, tipo:'warning', titulo:`${this.t('atencionRequerida')} — ${l.galpon}`, mensaje:`Alcanzó ${m.toFixed(2)}%, umbral ${this.UMBRAL_AVISO}%.`,   leida:false, timestamp:new Date() });
    });
    const leidasSet = new Set(this.alertas().filter(a=>a.leida).map(a=>a.id));
    this.alertas.set(nuevas.map(a=>({...a,leida:leidasSet.has(a.id)})));
  }

  marcarAlertaLeida(id: string):void { this.alertas.update(l=>l.map(a=>a.id===id?{...a,leida:true}:a)); }
  marcarTodasLeidas():void { this.alertas.update(l=>l.map(a=>({...a,leida:true}))); }

  // ── Onboarding ────────────────────────────────────────────
  nextOnboarding(): void {
    if (this.onboardingStep() < this.onboardingSteps.length - 1) {
      this.onboardingStep.update(s=>s+1);
    } else {
      this.finOnboarding();
    }
  }
  finOnboarding(): void {
    this.onboardingActivo.set(false);
    localStorage.setItem('avi_onboarding_done','1');
  }
  resetOnboarding(): void {
    localStorage.removeItem('avi_onboarding_done');
    this.onboardingStep.set(0);
    this.onboardingActivo.set(true);
  }

  // ── Exportar CSV ──────────────────────────────────────────
  exportarCSV(): void {
    const h = [this.t('galpon'),'Cant. Inicial','Cant. Actual','Mortalidad (%)','Costo Unitario',this.t('inversion'),this.t('ganancia'),this.t('fechaIngreso'),'Peso Prom. (kg)','Alimento Diario (kg)'];
    const f = this.lotes().map(l=>[l.galpon,l.cantidadInicial,l.cantidadActual,this.calcMortalidad(l).toFixed(2),l.costoUnitario.toFixed(2),this.calcInversion(l).toFixed(2),this.calcGanancia(l).toFixed(2),l.fechaIngreso,l.pesoPromedio??'',l.alimentoDiario??'']);
    const csv=[h,...f].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='reporte-avicola.csv'; a.click(); URL.revokeObjectURL(url);
  }

  exportarBajasCSV(): void {
    const h=['Fecha','Galpón','Cantidad','Causa','Notas','Usuario'];
    const f=this.bajas().map(b=>[b.fecha,b.galpon,b.cantidad,b.causa,b.notas,b.usuario]);
    const csv=[h,...f].map(r=>r.map(v=>`"${v}"`).join(',')).join('\n');
    const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='bajas-avicola.csv'; a.click(); URL.revokeObjectURL(url);
  }

  // ── PDF Profesional ───────────────────────────────────────
  exportarPDF(): void {
    const fecha=new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'});
    const filasLotes=this.lotes().map(l=>{
      const mc=this.calcMortalidad(l)>=5?'#c0392b':this.calcMortalidad(l)>=3?'#d35400':'#1a7a4a';
      return `<tr><td>${l.galpon}</td><td>${l.cantidadInicial.toLocaleString()}</td><td>${l.cantidadActual.toLocaleString()}</td><td style="color:${mc};font-weight:700">${this.calcMortalidad(l).toFixed(2)}%</td><td>$${l.costoUnitario.toFixed(2)}</td><td>$${this.calcInversion(l).toLocaleString('es-CL',{minimumFractionDigits:2})}</td><td style="color:#1a7a4a;font-weight:700">$${this.calcGanancia(l).toLocaleString('es-CL',{minimumFractionDigits:2})}</td><td>${l.fechaIngreso}</td><td>${l.pesoPromedio??'-'} kg</td></tr>`;
    }).join('');
    const filasProyeccion=this.proyeccionGanancia().map(p=>`<tr><td>${p.galpon}</td><td>${p.avesProyectadas.toLocaleString()}</td><td style="color:#1a7a4a;font-weight:700">$${p.ganancia.toLocaleString('es-CL',{minimumFractionDigits:0})}</td><td style="color:${p.roi>=0?'#1a7a4a':'#c0392b'};font-weight:700">${p.roi.toFixed(1)}%</td></tr>`).join('');
    this._abrirPDF(this._plantillaPDF(fecha,filasLotes,filasProyeccion));
  }

  exportarHistorialPDF(): void {
    const fecha=new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'long',year:'numeric'});
    const filas=this.historial().map(h=>`<tr><td>${this.formatTime(h.timestamp)}</td><td><span class="badge badge-${h.tipo}">${h.tipo.toUpperCase()}</span></td><td>${h.descripcion}</td><td>${h.detalle}</td><td>${h.usuario}</td></tr>`).join('');
    this._abrirPDF(this._plantillaHistorialPDF(fecha,filas));
  }

  private _abrirPDF(html:string):void {
    const w=window.open('','_blank');
    if(w){w.document.write(html);w.document.close();}
  }

  private _plantillaPDF(fecha:string,filasLotes:string,filasProyeccion:string):string {
    const mortColor=this.mortalidadPromedio()>=5?'#dc2626':'#d97706';
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Reporte — AviManager</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Plus Jakarta Sans','Segoe UI',sans-serif;background:#fff;color:#1e293b;font-size:11px}
      .cover{background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 50%,#7c3aed 100%);padding:40px 48px;color:#fff;position:relative;overflow:hidden;page-break-after:avoid}
      .cover::after{content:'';position:absolute;right:-80px;top:-80px;width:320px;height:320px;border-radius:50%;background:rgba(255,255,255,.05)}
      .cover::before{content:'';position:absolute;left:-40px;bottom:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,.04)}
      .cover-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:32px;position:relative;z-index:1}
      .brand{display:flex;align-items:center;gap:12px}
      .brand-ico{width:44px;height:44px;background:rgba(255,255,255,.15);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;border:1px solid rgba(255,255,255,.2)}
      .brand-name{font-size:20px;font-weight:800;letter-spacing:-.02em}
      .cover-meta{font-size:10px;opacity:.75;text-align:right;line-height:1.9}
      .cover-title{font-size:30px;font-weight:800;letter-spacing:-.03em;margin-bottom:8px;position:relative;z-index:1}
      .cover-sub{font-size:12px;opacity:.7;position:relative;z-index:1}
      .kpi-strip{display:flex;border-bottom:3px solid #1d4ed8;page-break-inside:avoid}
      .kpi-box{flex:1;padding:18px 20px;border-right:1px solid #e2e8f0;background:#fff}
      .kpi-box:last-child{border-right:none}
      .kpi-box .v{font-size:20px;font-weight:800;font-family:monospace}
      .kpi-box .l{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:6px}
      .section{padding:28px 48px;page-break-inside:avoid}
      .section-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#1d4ed8;margin-bottom:16px;padding-bottom:10px;border-bottom:2px solid #eff6ff;display:flex;align-items:center;gap:8px}
      table{width:100%;border-collapse:collapse;font-size:10.5px}
      thead tr{background:#1e3a8a;color:#fff}
      thead th{padding:10px 12px;text-align:left;font-weight:700;letter-spacing:.04em;font-size:9px;text-transform:uppercase}
      tbody tr{border-bottom:1px solid #f1f5f9}
      tbody tr:nth-child(even){background:#f8fafc}
      tbody td{padding:10px 12px;vertical-align:middle}
      .pdf-footer{padding:18px 48px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;color:#94a3b8;font-size:9px;background:#f8fafc}
      .alert-row{display:flex;gap:12px;padding:10px 14px;border-radius:7px;margin-bottom:8px;align-items:flex-start}
      .alert-danger{background:#fef2f2;border-left:4px solid #dc2626}
      .alert-warning{background:#fffbeb;border-left:4px solid #d97706}
      .alert-row strong{font-size:11px;display:block;margin-bottom:3px}
      .alert-row p{font-size:10.5px;color:#475569}
      .divider{height:1px;background:linear-gradient(90deg,#1d4ed8,transparent);margin:0 48px}
    </style></head><body>
    <div class="cover">
      <div class="cover-top">
        <div class="brand"><div class="brand-ico">🐔</div><span class="brand-name">AviManager</span></div>
        <div class="cover-meta">Generado el ${fecha}<br>Por: ${this.userName()}<br>Plataforma de Gestión Avícola<br>Proyección: ${this.diasVenta()} días</div>
      </div>
      <div class="cover-title">Reporte Integral de Producción</div>
      <div class="cover-sub">Datos operacionales en tiempo real • Período actual • Análisis de rentabilidad</div>
    </div>
    <div class="kpi-strip">
      <div class="kpi-box"><div class="l">Inversión Total</div><div class="v" style="color:#1d4ed8">$${this.totalInversion().toLocaleString('es-CL',{minimumFractionDigits:0})}</div></div>
      <div class="kpi-box"><div class="l">Ganancia Proyectada</div><div class="v" style="color:#059669">$${this.gananciaTotal().toLocaleString('es-CL',{minimumFractionDigits:0})}</div></div>
      <div class="kpi-box"><div class="l">Mortalidad Prom.</div><div class="v" style="color:${mortColor}">${this.mortalidadPromedio().toFixed(2)}%</div></div>
      <div class="kpi-box"><div class="l">ROI Promedio</div><div class="v" style="color:${this.roiPromedio()>=0?'#059669':'#dc2626'}">${this.roiPromedio().toFixed(1)}%</div></div>
      <div class="kpi-box"><div class="l">Lotes Activos</div><div class="v">${this.lotes().length}</div></div>
    </div>
    <div class="section">
      <div class="section-title">📋 Detalle de Lotes</div>
      <table>
        <thead><tr><th>Galpón</th><th>Inicial</th><th>Actual</th><th>Mortalidad</th><th>Costo/Ave</th><th>Inversión</th><th>Ganancia Est.</th><th>Fecha Ingreso</th><th>Peso Prom.</th></tr></thead>
        <tbody>${filasLotes}</tbody>
      </table>
    </div>
    <div class="divider"></div>
    <div class="section">
      <div class="section-title">📈 Proyección de Rentabilidad (${this.diasVenta()} días)</div>
      <table>
        <thead><tr><th>Galpón</th><th>Aves Proyectadas</th><th>Ganancia Proyectada</th><th>ROI</th></tr></thead>
        <tbody>${filasProyeccion}</tbody>
      </table>
    </div>
    ${this.alertas().length?`<div class="divider"></div><div class="section"><div class="section-title">⚠️ Alertas Activas</div>${this.alertas().map(a=>`<div class="alert-row alert-${a.tipo}"><div><strong>${a.titulo}</strong><p>${a.mensaje}</p></div></div>`).join('')}</div>`:''}
    <div class="pdf-footer">
      <span>AviManager — Plataforma de Gestión Avícola</span>
      <span>Generado: ${new Date().toISOString()} • ${this.userName()}</span>
    </div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
    </body></html>`;
  }

  private _plantillaHistorialPDF(fecha:string,filas:string):string {
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Historial — AviManager</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Segoe UI',sans-serif;background:#fff;color:#1e293b;font-size:11px}
      .cover{background:linear-gradient(135deg,#0f172a,#1e3a8a);padding:36px 48px;color:#fff}
      .cover-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
      .brand{font-size:18px;font-weight:800}.meta{font-size:10px;opacity:.6;text-align:right;line-height:1.8}
      .cover-title{font-size:24px;font-weight:800}.cover-sub{font-size:11px;opacity:.6;margin-top:5px}
      .section{padding:28px 48px}
      table{width:100%;border-collapse:collapse;font-size:10.5px}
      thead tr{background:#0f172a;color:#fff}
      thead th{padding:10px 12px;text-align:left;font-size:9px;text-transform:uppercase;font-weight:700;letter-spacing:.05em}
      tbody tr{border-bottom:1px solid #f1f5f9}
      tbody tr:nth-child(even){background:#f8fafc}
      tbody td{padding:10px 12px}
      .badge{padding:3px 9px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:.04em}
      .badge-crear{background:#dcfce7;color:#15803d}.badge-editar{background:#dbeafe;color:#1d4ed8}
      .badge-eliminar{background:#fee2e2;color:#dc2626}.badge-baja{background:#fef3c7;color:#d97706}
      .badge-importar{background:#f3e8ff;color:#7c3aed}
      .footer{padding:16px 48px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;color:#94a3b8;font-size:9px;background:#f8fafc}
    </style></head><body>
    <div class="cover">
      <div class="cover-top"><div class="brand">🐔 AviManager</div><div class="meta">Generado el ${fecha}<br>Por: ${this.userName()}</div></div>
      <div class="cover-title">Historial de Cambios</div>
      <div class="cover-sub">Registro completo de operaciones del sistema</div>
    </div>
    <div class="section">
      <table>
        <thead><tr><th>Fecha y Hora</th><th>Tipo</th><th>Descripción</th><th>Detalle</th><th>Usuario</th></tr></thead>
        <tbody>${filas||'<tr><td colspan="5" style="text-align:center;padding:20px;color:#94a3b8">Sin registros</td></tr>'}</tbody>
      </table>
    </div>
    <div class="footer"><span>AviManager — Historial de Operaciones</span><span>${new Date().toISOString()}</span></div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
    </body></html>`;
  }

  // ── Chart data ────────────────────────────────────────────
  get chartBarsMortalidad():{galpon:string;pct:number;color:string}[] {
    return this.lotes().map(l=>{
      const m=this.calcMortalidad(l);
      return{galpon:l.galpon,pct:Math.min(m,15),color:m>=5?'#f87171':m>=3?'#fbbf24':'#34d399'};
    });
  }
  get chartBarsCrecimiento():{galpon:string;kg:number}[] {
    return this.lotes().map(l=>({galpon:l.galpon,kg:l.pesoPromedio??0}));
  }
  get maxKg():number { return Math.max(...this.chartBarsCrecimiento.map(b=>b.kg),3); }

  get chartBajasXCausa():{causa:string;total:number;color:string}[] {
    const map: Record<string,number> = {enfermedad:0,accidente:0,natural:0,desconocida:0};
    this.bajas().forEach(b=>{ map[b.causa]=(map[b.causa]||0)+b.cantidad; });
    const colors: Record<string,string> = {enfermedad:'#f87171',accidente:'#fbbf24',natural:'#34d399',desconocida:'#a78bfa'};
    return Object.entries(map).map(([causa,total])=>({causa,total,color:colors[causa]}));
  }
  get maxBajaCausa():number { return Math.max(...this.chartBajasXCausa.map(b=>b.total),1); }

  @HostListener('document:keydown.escape')
  onEsc():void {
    this.cerrarModal();
    this.alertasPanelOpen.set(false);
    this.historialModalOpen.set(false);
    this.bajaModalOpen.set(false);
    this.importModalOpen.set(false);
    if(this.onboardingActivo()) this.finOnboarding();
  }
}