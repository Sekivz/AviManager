import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Lote {
  id?: number;
  codigo_lote: string;
  raza: string;
  cantidad_inicial: number;
  cantidad_actual: number;
  cantidad_bajas: number;
  costo_unidad: number;
  gastos_alimento: number;
  fecha_ingreso?: string;
  notas?: string;
  vacunado: boolean;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class InventarioService {
  private apiUrl = 'http://127.0.0.1:8000/api/lotes/';
  constructor(private http: HttpClient) { }

  getLotes(): Observable<Lote[]> { return this.http.get<Lote[]>(this.apiUrl); }
  crearLote(lote: Lote): Observable<Lote> { return this.http.post<Lote>(this.apiUrl, lote); }
  actualizarLote(id: number, lote: Lote): Observable<Lote> { return this.http.put<Lote>(`${this.apiUrl}${id}/`, lote); }
  eliminarLote(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}${id}/`); }
}