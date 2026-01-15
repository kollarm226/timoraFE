import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Company, HolidayRequest, Notice, ApiUser, CreateNoticeRequest, UpdateNoticeRequest } from '../models/api.models';
import { environment } from '../../environments/environment';

/**
 * Servis pre komunikaciu s backend API
 * Obsahuje metody pre vsetky endpointy (Companies, HolidayRequests, Notices, Users)
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl || 'https://timorabe.azurewebsites.net/api';

  /**
   * Vrati HTTP headers pre API requesty
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // ===== COMPANIES =====
  
  /**
   * Nacita zoznam vsetkych firiem
   */
  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/Companies`, { headers: this.getHeaders() });
  }

  /**
   * Nacita detaily konkretnej firmy podla ID
   */
  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.baseUrl}/Companies/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Vytvori novu firmu
   */
  createCompany(company: { name: string }): Observable<Company> {
    return this.http.post<Company>(`${this.baseUrl}/Companies`, company, { headers: this.getHeaders() });
  }

  // ===== HOLIDAY REQUESTS =====
  
  /**
   * Nacita vsetky ziadosti o dovolenky
   */
  getHolidayRequests(): Observable<HolidayRequest[]> {
    return this.http.get<Record<string, unknown>[]>(`${this.baseUrl}/HolidayRequests`, { headers: this.getHeaders() })
      .pipe(
        map(data => data.map(item => ({
          id: item['id'] as number,
          userId: (item['userId'] || item['UserId']) as number, // Handle both camelCase and PascalCase
          startDate: new Date((item['startDate'] || item['StartDate']) as string),
          endDate: new Date((item['endDate'] || item['EndDate']) as string),
          requestDate: new Date((item['requestDate'] || item['RequestDate']) as string),
          status: (item['status'] || item['Status']) as 'Pending' | 'Approved' | 'Rejected' | 'Denied' | 'Cancelled' | number,
          reason: (item['reason'] || item['Reason']) as string,
          approvedBy: (item['approvedBy'] || item['ApprovedBy']) as number | undefined,
          approvedDate: item['approvedDate'] || item['ApprovedDate'] ? new Date((item['approvedDate'] || item['ApprovedDate']) as string) : undefined,
          rejectionReason: (item['rejectionReason'] || item['RejectionReason']) as string | undefined
        })))
      );
  }

  /**
   * Nacita detaily konkretnej ziadosti o dovolenku
   */
  getHolidayRequestById(id: number): Observable<HolidayRequest> {
    return this.http.get<HolidayRequest>(`${this.baseUrl}/HolidayRequests/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Vytvori novu ziadost o dovolenku
   */
  createHolidayRequest(request: { userId: number; startDate: Date | string; endDate: Date | string; reason: string }): Observable<HolidayRequest> {
    // Konvertuj Date objekty na ISO datetime format pre backend
    const payload = {
      userId: request.userId,
      startDate: typeof request.startDate === 'string' 
        ? request.startDate.includes('T') 
          ? request.startDate 
          : `${request.startDate}T00:00:00.000Z`
        : request.startDate.toISOString(),
      endDate: typeof request.endDate === 'string' 
        ? request.endDate.includes('T') 
          ? request.endDate 
          : `${request.endDate}T23:59:59.999Z`
        : request.endDate.toISOString(),
      reason: request.reason
    };
    return this.http.post<HolidayRequest>(`${this.baseUrl}/HolidayRequests`, payload, { headers: this.getHeaders() });
  }

  /**
   * Aktualizuje dovolenku (napr. zmena statusu)
   */
  updateHolidayRequestStatus(id: number, payload: { status: number; resolvedByUserId?: number; resolverComment?: string }): Observable<HolidayRequest> {
    return this.http.patch<HolidayRequest>(`${this.baseUrl}/HolidayRequests/${id}`, payload, { headers: this.getHeaders() });
  }

  // ===== NOTICES =====
  
  /**
   * Nacita vsetky oznamenia
   */
  getNotices(): Observable<Notice[]> {
    return this.http.get<Notice[]>(`${this.baseUrl}/Notices`, { headers: this.getHeaders() });
  }

  /**
   * Nacita detaily konkretneho oznamenia
   */
  getNoticeById(id: number): Observable<Notice> {
    return this.http.get<Notice>(`${this.baseUrl}/Notices/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Vytvori nove oznamenie
   */
  createNotice(notice: CreateNoticeRequest): Observable<Notice> {
    return this.http.post<Notice>(`${this.baseUrl}/Notices`, notice, { headers: this.getHeaders() });
  }

  /**
   * Aktualizuje existujuce oznamenie
   */
  updateNotice(id: number, notice: UpdateNoticeRequest): Observable<Notice> {
    return this.http.patch<Notice>(`${this.baseUrl}/Notices/${id}`, notice, { headers: this.getHeaders() });
  }

  /**
   * Vymaze oznamenie
   */
  deleteNotice(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Notices/${id}`, { headers: this.getHeaders() });
  }

  // ===== USERS =====
  
  /**
   * Nacita zoznam vsetkych uzivatelov
   */
  getUsers(): Observable<ApiUser[]> {
    return this.http.get<ApiUser[]>(`${this.baseUrl}/Users`, { headers: this.getHeaders() });
  }

  /**
   * Nacita detaily konkretneho uzivatela podla ID
   */
  getUserById(id: number): Observable<ApiUser> {
    return this.http.get<ApiUser>(`${this.baseUrl}/Users/${id}`, { headers: this.getHeaders() });
  }

  /**
   * Nacita uzivatela podla emailovej adresy
   */
  getUserByEmail(email: string): Observable<ApiUser> {
    return this.http.get<ApiUser>(`${this.baseUrl}/Users/by-email/${encodeURIComponent(email)}`, { headers: this.getHeaders() });
  }

  /**
   * Vytvori noveho uzivatela v backend databaze
   */
  createUser(user: { firebaseId: string; companyId: number; firstName: string; lastName: string; email: string; userName: string; role: number }): Observable<ApiUser> {
    return this.http.post<ApiUser>(`${this.baseUrl}/Users`, user, { headers: this.getHeaders() });
  }

  /**
   * Vymaze uzivatela z systemu
   */
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Users/${id}`, { headers: this.getHeaders() });
  }
}
