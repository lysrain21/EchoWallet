/**
 * Echo Wallet - Contact management service
 */

import { Contact } from '@/types/contacts'

class ContactsService {
  private storageKey = 'echo_contacts'

  /**
   * Retrieve all saved contacts from local storage.
   */
  getContacts(): Contact[] {
    try {
      // Ensure we are running in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return []
      }
      
      const stored = localStorage.getItem(this.storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Persist the contact array to storage.
   */
  private saveContacts(contacts: Contact[]) {
    try {
      // Ensure we are running in a browser environment
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(contacts))
      }
    } catch (error) {
      console.warn('Failed to save contacts:', error)
    }
  }

  /**
   * Add a new contact entry.
   */
  addContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'usageCount'>): Contact {
    const contacts = this.getContacts()
    
    const contact: Contact = {
      ...contactData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      usageCount: 0
    }

    contacts.push(contact)
    this.saveContacts(contacts)
    
    return contact
  }

  /**
   * Find a contact using fuzzy matching on name, nickname, or tags.
   */
  findContact(query: string): Contact | undefined {
    const contacts = this.getContacts()
    const searchQuery = query.toLowerCase().trim()

    // 1. Exact match on name
    let match = contacts.find(c => c.name.toLowerCase() === searchQuery)
    if (match) return match

    // 2. Exact match on nickname
    match = contacts.find(c => c.nickname?.toLowerCase() === searchQuery)
    if (match) return match

    // 3. Fuzzy match on name
    match = contacts.find(c => c.name.toLowerCase().includes(searchQuery))
    if (match) return match

    // 4. Fuzzy match on nickname
    match = contacts.find(c => c.nickname?.toLowerCase().includes(searchQuery))
    if (match) return match

    // 5. Tag match
    match = contacts.find(c => 
      c.tags?.some(tag => tag.toLowerCase().includes(searchQuery))
    )

    return match
  }

  /**
   * Locate a contact by address.
   */
  findContactByAddress(address: string): Contact | undefined {
    const contacts = this.getContacts()
    return contacts.find(c => c.address.toLowerCase() === address.toLowerCase())
  }

  /**
   * Return frequently used contacts ordered by usage.
   */
  getFrequentContacts(limit = 5): Contact[] {
    const contacts = this.getContacts()
    return contacts
      .filter(c => c.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  /**
   * Increment usage metadata for a contact.
   */
  markContactUsed(contactId: string) {
    const contacts = this.getContacts()
    const contact = contacts.find(c => c.id === contactId)
    
    if (contact) {
      contact.usageCount++
      contact.lastUsed = Date.now()
      this.saveContacts(contacts)
    }
  }

  /**
   * Update contact fields by id.
   */
  updateContact(id: string, updates: Partial<Contact>) {
    const contacts = this.getContacts()
    const index = contacts.findIndex(c => c.id === id)
    
    if (index !== -1) {
      contacts[index] = { ...contacts[index], ...updates }
      this.saveContacts(contacts)
    }
  }

  /**
   * Remove a contact by id.
   */
  removeContact(id: string) {
    const contacts = this.getContacts()
    const filtered = contacts.filter(c => c.id !== id)
    this.saveContacts(filtered)
  }
}

export const contactsService = new ContactsService()
