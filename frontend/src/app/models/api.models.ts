/**
 * API modely pre komunikaciu s backendom
 * Tieto interfacy zodpovedaju strukturam z Azure API
 */

// ===== COMPANY =====

export interface Company {
  id: number;
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt?: Date;
}

// ===== HOLIDAY REQUEST =====

export interface HolidayRequest {
  id: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  requestDate: Date;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
  approvedBy?: number;
  approvedDate?: Date;
  rejectionReason?: string;
}

// ===== NOTICE =====

export interface Notice {
  id: number;
  title: string;
  content: string;
  createdBy: number;
  createdAt: Date;
  isActive: boolean;
  priority?: 'Low' | 'Medium' | 'High';
}

// ===== USER (API) =====

/**
 * ApiUser - uzivatel z backendu
 * Pozor: toto je iny model ako User v user.model.ts (ten je pre localStorage)
 */
export interface ApiUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyId: number;
  role?: string;
  isActive?: boolean;
  createdAt?: Date;
}
