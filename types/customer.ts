export type DocumentType = 'CC' | 'NIT' | 'CE' | 'TI' | 'PASAPORTE';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  documentType: DocumentType;
  documentNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  documentType: DocumentType;
  documentNumber: string;
}
