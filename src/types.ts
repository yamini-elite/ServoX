export interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'customer';
  location?: string;
  createdAt: any;
}

export interface WorkerData {
  id: string;
  name: string;
  email: string;
  skill: 'Plumber' | 'Electrician' | 'Carpenter' | 'Painter' | 'Ironing';
  rating: number;
  location: string;
  availability: string;
  imageUrl: string;
  experience: string;
  phone: string;
}

export interface BookingData {
  id: string;
  customerId: string;
  workerId: string;
  serviceType: string;
  visitDate: string;
  visitTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface NotificationData {
  id: string;
  userId: string;
  message: string;
  read: boolean;
  createdAt: any;
}
