export type DocumentType = 'CC' | 'NIT' | 'CE' | 'TI' | 'PASAPORTE';
export type CustomerType = 'NATURAL' | 'JURIDICA';

export interface Customer {
  id: string;
  customerType: CustomerType;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email?: string;
  phoneNumber?: string;
  documentType: DocumentType;
  documentNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerDto {
  customerType: CustomerType;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email?: string;
  phoneNumber?: string;
  documentType: DocumentType;
  documentNumber: string;
}
