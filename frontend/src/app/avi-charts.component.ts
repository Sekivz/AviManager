import {
  Component, OnInit, OnDestroy, OnChanges,
  Input, AfterViewInit, ViewChild, ElementRef,
  signal, effect, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

// Registrar todos los componentes de Chart.js
Chart.register(...registerables);

export interface LoteChart {
  id: number;
  galpon: string;
  cantidadInicial: number;
  cantidadActual: number;
  costoUnitario: number;
  precioVentaEstimado: number;
  pesoPromedio?: number;
  alimentoDiario?: number;
}

export interface BajaChart {
  causa: 'enfermedad' | 'accidente' | 'natural' | 'desconocida';
  cantidad: number;
}

export type ChartType = 'mortalidad' | 'crecimiento' | 'bajas' | 'inversion';

@Component({
  selector: 'app-avi-charts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-container">
      <div class="chart-tabs">
        <button
          *ngFor="let tab of tabs"
          class="chart-tab"
          [class.chart-tab--active]="activeTab() === tab.id"
          (click)="cambiarTab(tab.id)">
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <div class="chart-wrap">
        <!-- Mortalidad -->
        <div *ngIf="activeTab() === 'mortalidad'" class="canvas-wrap">
          <canvas #mortChart></canvas>
        </div>
        <!-- Crecimiento / Peso -->
        <div *ngIf="activeTab() === 'crecimiento'" class="canvas-wrap">
          <canvas #crecChart></canvas>
        </div>
        <!-- Bajas por causa -->
        <div *ngIf="activeTab() === 'bajas'" class="canvas-wrap canvas-wrap--doughnut">
          <canvas #bajasChart></canvas>
          <div class="doughnut-legend">
            <div *ngFor="let item of bajasLegend" class="legend-item">
              <span class="legend-dot" [style.background]="item.color"></span>
              <span class="legend-label">{{ item.label }}</span>
              <span class="legend-val">{{ item.value }}</span>
            </div>
          </div>
        </div>
        <!-- Inversión vs Ganancia -->
        <div *ngIf="activeTab() === 'inversion'" class="canvas-wrap">
          <canvas #invChart></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display:block; }

    .chart-container { display:flex; flex-direction:column; height:100%; }

    .chart-tabs {
      display:flex; gap:4px; padding:12px 16px 0;
      border-bottom:1px solid var(--border);
      flex-wrap:wrap;
    }
    .chart-tab {
      display:inline-flex; align-items:center; gap:5px;
      padding:7px 13px; border-radius:7px 7px 0 0;
      border:1px solid transparent; border-bottom:none;
      background:transparent; cursor:pointer;
      font-family:'Plus Jakarta Sans',sans-serif;
      font-size:.75rem; font-weight:600;
      color:var(--text-2);
      transition:all .15s;
      position:relative; bottom:-1px;
    }
    .chart-tab:hover { background:var(--bg); color:var(--text-1); }
    .chart-tab--active {
      background:var(--bg-card);
      border-color:var(--border);
      color:var(--blue);
      border-bottom-color:var(--bg-card);
    }
    .tab-icon  { font-size:.9rem; }
    .tab-label { white-space:nowrap; }

    .chart-wrap { flex:1; padding:16px; min-height:0; }

    .canvas-wrap {
      position:relative; height:240px;
      display:flex; align-items:center; justify-content:center;
    }
    .canvas-wrap--doughnut {
      gap:20px; height:260px;
      flex-direction:row; align-items:center;
    }
    .canvas-wrap canvas { max-height:100%; max-width:100%; }
    .canvas-wrap--doughnut canvas { max-width:220px; max-height:220px; }

    .doughnut-legend {
      display:flex; flex-direction:column; gap:10px;
      min-width:130px;
    }
    .legend-item {
      display:flex; align-items:center; gap:8px;
      font-size:.78rem;
    }
    .legend-dot {
      width:10px; height:10px; border-radius:50%; flex-shrink:0;
    }
    .legend-label { flex:1; color:var(--text-2); text-transform:capitalize; }
    .legend-val   { font-weight:700; color:var(--text-1); font-family:'JetBrains Mono',monospace; }

    @media (max-width:540px) {
      .canvas-wrap--doughnut { flex-direction:column; height:auto; gap:12px; }
      .canvas-wrap--doughnut canvas { max-width:180px; max-height:180px; }
    }
  `]
})
export class AviChartsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {

  @Input() lotes:  LoteChart[] = [];
  @Input() bajas:  BajaChart[] = [];
  @Input() darkMode = false;

  @ViewChild('mortChart')  mortRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('crecChart')  crecRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('bajasChart') bajasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('invChart')   invRef!:   ElementRef<HTMLCanvasElement>;

  activeTab = signal<ChartType>('mortalidad');

  private charts: Map<string, Chart> = new Map();

  tabs = [
    { id: 'mortalidad' as ChartType, icon: '📉', label: 'Mortalidad'      },
    { id: 'crecimiento'as ChartType, icon: '⚖️', label: 'Peso Promedio'   },
    { id: 'bajas'      as ChartType, icon: '🥧', label: 'Bajas por Causa' },
    { id: 'inversion'  as ChartType, icon: '💰', label: 'Inv. vs Ganancia' },
  ];

  // Para la leyenda del doughnut
  get bajasLegend() {
    const map: Record<string,{color:string;label:string}> = {
      enfermedad: { color:'#f87171', label:'Enfermedad' },
      accidente:  { color:'#fbbf24', label:'Accidente'  },
      natural:    { color:'#34d399', label:'Natural'    },
      desconocida:{ color:'#a78bfa', label:'Desconocida'},
    };
    const totals: Record<string,number> = {enfermedad:0,accidente:0,natural:0,desconocida:0};
    this.bajas.forEach(b => { totals[b.causa] = (totals[b.causa]||0) + b.cantidad; });
    return Object.entries(totals).map(([causa, value]) => ({
      color: map[causa].color, label: map[causa].label, value,
    }));
  }

  // ── colores según dark mode ─────────────────────────────────
  private get gridColor()  { return this.darkMode ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'; }
  private get textColor()  { return this.darkMode ? '#8b949e' : '#64748b'; }
  private get tooltipBg()  { return this.darkMode ? '#1c2128' : '#0f172a'; }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    // Pequeño delay para que el *ngIf renderice el canvas
    setTimeout(() => this.renderTab(this.activeTab()), 80);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['lotes'] || changes['bajas'] || changes['darkMode']) && !changes['lotes']?.firstChange) {
      this.destroyAll();
      setTimeout(() => this.renderTab(this.activeTab()), 80);
    }
  }

  ngOnDestroy(): void { this.destroyAll(); }

  cambiarTab(tab: ChartType): void {
    this.destroyTab(this.activeTab());
    this.activeTab.set(tab);
    setTimeout(() => this.renderTab(tab), 80);
  }

  // ── Render dispatcher ───────────────────────────────────────
  private renderTab(tab: ChartType): void {
    switch(tab) {
      case 'mortalidad':  this.renderMortalidad(); break;
      case 'crecimiento': this.renderCrecimiento(); break;
      case 'bajas':       this.renderBajas();       break;
      case 'inversion':   this.renderInversion();   break;
    }
  }

  // ── Chart: Mortalidad ───────────────────────────────────────
  private renderMortalidad(): void {
    const el = this.mortRef?.nativeElement;
    if (!el) return;
    this.destroyTab('mortalidad');

    const labels = this.lotes.map(l => l.galpon);
    const data   = this.lotes.map(l =>
      +((( l.cantidadInicial - l.cantidadActual ) / l.cantidadInicial * 100).toFixed(2))
    );
    const colors = data.map(v => v >= 5 ? '#f87171' : v >= 3 ? '#fbbf24' : '#34d399');

    const chart = new Chart(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Mortalidad (%)',
          data,
          backgroundColor: colors.map(c => c + 'cc'),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: this.tooltipBg,
            padding: 10,
            callbacks: {
              label: (ctx: import('chart.js').TooltipItem<'bar'>) => ` ${(ctx.parsed.y ?? 0).toFixed(2)}% mortalidad`,
            }
          },
          annotation: {} as any,
        } as any,
        scales: {
          x: { grid: { color: this.gridColor }, ticks: { color: this.textColor, font: { family: "'Plus Jakarta Sans'" } } },
          y: {
            grid: { color: this.gridColor },
            ticks: { color: this.textColor, callback: v => v + '%', font: { family: "'Plus Jakarta Sans'" } },
            min: 0,
            suggestedMax: Math.max(...data, 6),
          }
        }
      }
    });
    this.charts.set('mortalidad', chart);

    // Línea de umbral 5% via plugin inline
    this.drawUmbralLine(chart, 5, '#f87171', 'Umbral 5%');
  }

  // ── Chart: Crecimiento / Peso promedio ──────────────────────
  private renderCrecimiento(): void {
    const el = this.crecRef?.nativeElement;
    if (!el) return;
    this.destroyTab('crecimiento');

    const labels = this.lotes.map(l => l.galpon);
    const data   = this.lotes.map(l => l.pesoPromedio ?? 0);

    const chart = new Chart(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Peso Promedio (kg)',
          data,
          backgroundColor: 'rgba(99,102,241,.7)',
          borderColor: '#6366f1',
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: this.tooltipBg,
            padding: 10,
            callbacks: { label: ctx => ` ${ctx.parsed.x} kg promedio` }
          }
        },
        scales: {
          x: {
            grid: { color: this.gridColor },
            ticks: { color: this.textColor, callback: v => v + ' kg', font: { family: "'Plus Jakarta Sans'" } },
            min: 0,
          },
          y: { grid: { color: 'transparent' }, ticks: { color: this.textColor, font: { family: "'Plus Jakarta Sans'", weight: 600 } } }
        }
      }
    });
    this.charts.set('crecimiento', chart);
  }

  // ── Chart: Bajas por causa (Doughnut) ──────────────────────
  private renderBajas(): void {
    const el = this.bajasRef?.nativeElement;
    if (!el) return;
    this.destroyTab('bajas');

    const totals: Record<string,number> = {enfermedad:0,accidente:0,natural:0,desconocida:0};
    this.bajas.forEach(b => { totals[b.causa] = (totals[b.causa]||0) + b.cantidad; });

    const labels = ['Enfermedad','Accidente','Natural','Desconocida'];
    const data   = [totals['enfermedad'], totals['accidente'], totals['natural'], totals['desconocida']];
    const colors = ['#f87171','#fbbf24','#34d399','#a78bfa'];

    const chart = new Chart(el, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors.map(c => c + 'cc'),
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 8,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: this.tooltipBg,
            padding: 10,
            callbacks: {
              label: ctx => {
                const total = (ctx.dataset.data as number[]).reduce((a,b)=>a+b,0);
                const pct = total ? ((ctx.parsed / total)*100).toFixed(1) : '0';
                return ` ${ctx.parsed} aves (${pct}%)`;
              }
            }
          }
        }
      }
    });
    this.charts.set('bajas', chart);
  }

  // ── Chart: Inversión vs Ganancia (Grouped Bar) ─────────────
  private renderInversion(): void {
    const el = this.invRef?.nativeElement;
    if (!el) return;
    this.destroyTab('inversion');

    const labels    = this.lotes.map(l => l.galpon);
    const inversion = this.lotes.map(l => +(l.cantidadInicial * l.costoUnitario).toFixed(0));
    const ganancia  = this.lotes.map(l => +(l.cantidadActual * (l.precioVentaEstimado - l.costoUnitario)).toFixed(0));

    const chart = new Chart(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Inversión',
            data: inversion,
            backgroundColor: 'rgba(99,102,241,.7)',
            borderColor: '#6366f1',
            borderWidth: 2,
            borderRadius: 5,
          },
          {
            label: 'Ganancia Est.',
            data: ganancia,
            backgroundColor: 'rgba(52,211,153,.7)',
            borderColor: '#34d399',
            borderWidth: 2,
            borderRadius: 5,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: this.textColor,
              font: { family: "'Plus Jakarta Sans'", weight: 600 },
              boxWidth: 12, boxHeight: 12, borderRadius: 3,
            }
          },
          tooltip: {
            backgroundColor: this.tooltipBg,
            padding: 10,
            callbacks: { label: ctx => ` $${(ctx.parsed.y as number).toLocaleString('es-CL')}` }
          }
        },
        scales: {
          x: { grid: { color: this.gridColor }, ticks: { color: this.textColor, font: { family: "'Plus Jakarta Sans'" } } },
          y: {
            grid: { color: this.gridColor },
            ticks: {
              color: this.textColor,
              callback: v => '$' + (+v).toLocaleString('es-CL'),
              font: { family: "'Plus Jakarta Sans'" }
            },
            min: 0,
          }
        }
      }
    });
    this.charts.set('inversion', chart);
  }

  // ── Plugin inline: línea de umbral ─────────────────────────
  private drawUmbralLine(chart: Chart, value: number, color: string, label: string): void {
    const plugin = {
      id: 'umbralLine',
      afterDraw(chart: Chart) {
        const { ctx, chartArea, scales } = chart as any;
        if (!chartArea || !scales.y) return;
        const y = scales.y.getPixelForValue(value);
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(chartArea.left, y);
        ctx.lineTo(chartArea.right, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.font = "bold 10px 'Plus Jakarta Sans'";
        ctx.fillText(label, chartArea.right - 58, y - 5);
        ctx.restore();
      }
    };
    chart.config.plugins = [plugin];
    chart.update();
  }

  // ── Helpers ─────────────────────────────────────────────────
  private destroyTab(tab: string): void {
    const c = this.charts.get(tab);
    if (c) { c.destroy(); this.charts.delete(tab); }
  }
  private destroyAll(): void {
    this.charts.forEach(c => c.destroy());
    this.charts.clear();
  }
}