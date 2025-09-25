/**
 * Echo Wallet - Contact type definitions
 */

export interface Contact {
  id: string
  name: string
  address: string
  nickname?: string
  tags?: string[]
  createdAt: number
  lastUsed?: number
  usageCount: number
}

export interface ContactsState {
  contacts: Contact[]
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'usageCount'>) => void
  removeContact: (id: string) => void
  updateContact: (id: string, updates: Partial<Contact>) => void
  findContact: (query: string) => Contact | undefined
  getFrequentContacts: (limit?: number) => Contact[]
  markContactUsed: (id: string) => void
}
