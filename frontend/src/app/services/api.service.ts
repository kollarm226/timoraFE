import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company, HolidayRequest, Notice, ApiUser } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://timorabe.azurewebsites.net/api';

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // Companies
  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/Companies`, { headers: this.getHeaders() });
  }

  getCompanyById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.baseUrl}/Companies/${id}`, { headers: this.getHeaders() });
  }

  // Holiday Requests
  getHolidayRequests(): Observable<HolidayRequest[]> {
    return this.http.get<HolidayRequest[]>(`${this.baseUrl}/HolidayRequests`, { headers: this.getHeaders() });
  }

  getHolidayRequestById(id: number): Observable<HolidayRequest> {
    return this.http.get<HolidayRequest>(`${this.baseUrl}/HolidayRequests/${id}`, { headers: this.getHeaders() });
  }

  // Notices
  getNotices(): Observable<Notice[]> {
    return this.http.get<Notice[]>(`${this.baseUrl}/Notices`, { headers: this.getHeaders() });
  }

  getNoticeById(id: number): Observable<Notice> {
    return this.http.get<Notice>(`${this.baseUrl}/Notices/${id}`, { headers: this.getHeaders() });
  }

  // Users
  getUsers(): Observable<ApiUser[]> {
    return this.http.get<ApiUser[]>(`${this.baseUrl}/Users`, { headers: this.getHeaders() });
  }

  getUserById(id: number): Observable<ApiUser> {
    return this.http.get<ApiUser>(`${this.baseUrl}/Users/${id}`, { headers: this.getHeaders() });
  }

  getUserByEmail(email: string): Observable<ApiUser> {
    return this.http.get<ApiUser>(`${this.baseUrl}/Users/by-email/${encodeURIComponent(email)}`, { headers: this.getHeaders() });
  }
}
