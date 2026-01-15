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
  status: 'Pending' | 'Approved' | 'Rejected' | 'Denied' | 'Cancelled' | number;
  reason?: string;
  approvedBy?: number;
  approvedDate?: Date;
  rejectionReason?: string;
}

// ===== NOTICE =====

export interface Notice {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: Date;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface CreateNoticeRequest {
  userId: number;
  title: string;
  content: string;
}

export interface UpdateNoticeRequest {
  title?: string;
  content?: string;
}

// ===== USER (API) =====

/**
 * ApiUser - uzivatel z backendu
 * Pozor: toto je iny model ako User v user.model.ts (ten je pre localStorage)
 */
export interface ApiUser {
  [key: string]: unknown;
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  companyId: number;
  role?: number;
  isActive?: boolean;
  createdAt?: Date;
}

// ===== DOCUMENT =====

export interface Document {
  id: number;
  title: string;
  description?: string;
  fileUrl: string;
  uploadedBy: number;
  companyId: number;
  createdAt: Date;
  updatedAt?: Date;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export interface CreateDocumentRequest {
  title: string;
  description?: string;
  fileUrl: string;
  uploadedBy: number;
  companyId: number;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  fileUrl?: string;
}
