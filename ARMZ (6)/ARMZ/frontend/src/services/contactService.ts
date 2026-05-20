import apiClient from '@/src/api/client';
import { API_ENDPOINTS } from '@/src/api/endpoints';

export interface ContactPayload {
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

class ContactService {
  async submitContact(payload: ContactPayload): Promise<void> {
    await apiClient.post(API_ENDPOINTS.CONTACT.SUBMIT, payload);
  }
}

export const contactService = new ContactService();
