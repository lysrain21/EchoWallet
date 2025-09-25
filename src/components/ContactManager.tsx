/**
 * Echo Wallet - Contact management component
 * Accessible contact manager for voice-first interactions.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { contactsService } from '@/services/contactsService'
import { voiceService } from '@/services/voiceService'
import { AccessibleButton, AccessibleText } from './AccessibilityComponents'
import { Contact } from '@/types/contacts'

export function ContactManager() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isAddingContact, setIsAddingContact] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', address: '', nickname: '' })

  useEffect(() => {
    loadContacts()
    // Contacts must be added manually by the user now
  }, [])

  const loadContacts = () => {
    setContacts(contactsService.getContacts())
  }

  const handleAddContact = () => {
    if (!newContact.name || !newContact.address) {
      voiceService.speak('Please provide the contact name and address.')
      return
    }

    try {
      contactsService.addContact({
        name: newContact.name,
        address: newContact.address,
        nickname: newContact.nickname || undefined
      })
      
      voiceService.speak(`Contact ${newContact.name} added successfully.`)
      setNewContact({ name: '', address: '', nickname: '' })
      setIsAddingContact(false)
      loadContacts()
    } catch (error) {
      console.error('Failed to add contact:', error)
      voiceService.speak('Failed to add contact.')
    }
  }

  const handleRemoveContact = (contact: Contact) => {
    contactsService.removeContact(contact.id)
    voiceService.speak(`Deleted contact ${contact.name}.`)
    loadContacts()
  }

  const speakContactInfo = (contact: Contact) => {
    const info = `${contact.name}, address ${contact.address.slice(0, 10)}...${contact.address.slice(-6)}`
    if (contact.usageCount > 0) {
      voiceService.speak(`${info}, used ${contact.usageCount} times`)
    } else {
      voiceService.speak(info)
    }
  }

  return (
    <div className="space-y-6" role="region" aria-label="Contact management">
      <AccessibleText text="Contact Management" level="h2" />
      
      {/* Toggle add contact form */}
      <AccessibleButton
        onClick={() => setIsAddingContact(!isAddingContact)}
        className="w-full p-4 bg-blue-600 text-white rounded-lg"
        ariaLabel="Add new contact"
      >
        {isAddingContact ? 'Cancel' : 'Add contact'}
      </AccessibleButton>

      {/* Add contact form */}
      {isAddingContact && (
        <form
          className="space-y-4 p-4 bg-gray-50 rounded-lg"
          onSubmit={(e) => {
            e.preventDefault()
            handleAddContact()
          }}
          aria-label="New contact details"
        >
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium mb-2">
              Contact name *
            </label>
            <input
              id="contact-name"
              type="text"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Alice"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="contact-address" className="block text-sm font-medium mb-2">
              Wallet address *
            </label>
            <input
              id="contact-address"
              type="text"
              value={newContact.address}
              onChange={(e) => setNewContact({ ...newContact, address: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0x..."
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="contact-nickname" className="block text-sm font-medium mb-2">
              Nickname (optional)
            </label>
            <input
              id="contact-nickname"
              type="text"
              value={newContact.nickname}
              onChange={(e) => setNewContact({ ...newContact, nickname: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., boss, friend"
            />
          </div>

          <AccessibleButton
            type="submit"
            className="w-full p-3 bg-green-600 text-white rounded-lg"
            ariaLabel="Confirm add contact"
          >
            Save contact
          </AccessibleButton>
        </form>
      )}

      {/* Contact list */}
      <div className="space-y-3">
        <AccessibleText text={`Contacts (${contacts.length})`} level="h3" />
        
        {contacts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No contacts yet. Add your first contact.
          </div>
        ) : (
          <div className="space-y-2" role="list" aria-label="Contact list">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="p-4 bg-white border border-gray-200 rounded-lg"
                role="listitem"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{contact.name}</h4>
                    {contact.nickname && (
                      <p className="text-sm text-gray-600">Nickname: {contact.nickname}</p>
                    )}
                    <p className="text-sm text-gray-500 font-mono break-all mt-1">
                      {contact.address}
                    </p>
                    {contact.usageCount > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        Used {contact.usageCount} times
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <AccessibleButton
                      onClick={() => speakContactInfo(contact)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded"
                      ariaLabel={`Announce contact ${contact.name}`}
                    >
                      Announce
                    </AccessibleButton>

                    <AccessibleButton
                      onClick={() => handleRemoveContact(contact)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded"
                      ariaLabel={`Delete contact ${contact.name}`}
                    >
                      Delete
                    </AccessibleButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Frequent contacts */}
      {contacts.filter(c => c.usageCount > 0).length > 0 && (
        <div className="space-y-3">
          <AccessibleText text="Frequent Contacts" level="h3" />
          <div className="space-y-2">
            {contactsService.getFrequentContacts().map((contact) => (
              <div
                key={contact.id}
                className="p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{contact.name}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      Used {contact.usageCount} times
                    </span>
                  </div>
                  <AccessibleButton
                    onClick={() => speakContactInfo(contact)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                    ariaLabel={`Announce frequent contact ${contact.name}`}
                  >
                    Announce
                  </AccessibleButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice transfer tips */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AccessibleText text="Voice Transfer Tips" level="h4" />
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          <li>• "Transfer 0.1 ETH to Alice" – send funds to a contact</li>
          <li>• "Quick transfer 0.05 ETH" – send to the most recent contact</li>
          <li>• "Transfer 0.2 ETH to boss" – use nicknames for transfers</li>
          <li>• "Show contacts" – list all saved contacts</li>
        </ul>
      </div>
    </div>
  )
}
