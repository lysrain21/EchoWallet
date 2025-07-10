/**
 * Echo Wallet - 联系人管理服务
 */

import { Contact } from '@/types/contacts'

class ContactsService {
  private storageKey = 'echo_contacts'

  /**
   * 获取所有联系人
   */
  getContacts(): Contact[] {
    try {
      // 检查是否在浏览器环境
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
   * 保存联系人
   */
  private saveContacts(contacts: Contact[]) {
    try {
      // 检查是否在浏览器环境
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(contacts))
      }
    } catch (error) {
      console.warn('保存联系人失败:', error)
    }
  }

  /**
   * 添加联系人
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
   * 智能查找联系人（支持模糊匹配）
   */
  findContact(query: string): Contact | undefined {
    const contacts = this.getContacts()
    const searchQuery = query.toLowerCase().trim()

    // 1. 精确匹配姓名
    let match = contacts.find(c => c.name.toLowerCase() === searchQuery)
    if (match) return match

    // 2. 精确匹配昵称
    match = contacts.find(c => c.nickname?.toLowerCase() === searchQuery)
    if (match) return match

    // 3. 模糊匹配姓名
    match = contacts.find(c => c.name.toLowerCase().includes(searchQuery))
    if (match) return match

    // 4. 模糊匹配昵称
    match = contacts.find(c => c.nickname?.toLowerCase().includes(searchQuery))
    if (match) return match

    // 5. 标签匹配
    match = contacts.find(c => 
      c.tags?.some(tag => tag.toLowerCase().includes(searchQuery))
    )

    return match
  }

  /**
   * 根据地址查找联系人
   */
  findContactByAddress(address: string): Contact | undefined {
    const contacts = this.getContacts()
    return contacts.find(c => c.address.toLowerCase() === address.toLowerCase())
  }

  /**
   * 获取常用联系人
   */
  getFrequentContacts(limit = 5): Contact[] {
    const contacts = this.getContacts()
    return contacts
      .filter(c => c.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  /**
   * 标记联系人被使用
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
   * 更新联系人
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
   * 删除联系人
   */
  removeContact(id: string) {
    const contacts = this.getContacts()
    const filtered = contacts.filter(c => c.id !== id)
    this.saveContacts(filtered)
  }
}

export const contactsService = new ContactsService()
