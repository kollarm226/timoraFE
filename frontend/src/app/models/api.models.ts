// Company model
export interface Company {
  id: number;
  name: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt?: Date;
}

// Holiday Request model
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

// Notice model
export interface Notice {
  id: number;
  title: string;
  content: string;
  createdBy: number;
  createdAt: Date;
  isActive: boolean;
  priority?: 'Low' | 'Medium' | 'High';
}

// User model (rozšírený)
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
