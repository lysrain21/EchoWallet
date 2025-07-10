/**
 * Echo Wallet - 联系人管理组件
 * 为盲人用户提供无障碍的联系人管理界面
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
    // 不再自动添加测试联系人，需要用户手动点击按钮
  }, [])

  const loadContacts = () => {
    setContacts(contactsService.getContacts())
  }

  const handleAddContact = () => {
    if (!newContact.name || !newContact.address) {
      voiceService.speak('请填写联系人姓名和地址')
      return
    }

    try {
      contactsService.addContact({
        name: newContact.name,
        address: newContact.address,
        nickname: newContact.nickname || undefined
      })
      
      voiceService.speak(`联系人 ${newContact.name} 添加成功`)
      setNewContact({ name: '', address: '', nickname: '' })
      setIsAddingContact(false)
      loadContacts()
    } catch (error) {
      voiceService.speak('添加联系人失败')
    }
  }

  const handleRemoveContact = (contact: Contact) => {
    contactsService.removeContact(contact.id)
    voiceService.speak(`已删除联系人 ${contact.name}`)
    loadContacts()
  }

  const speakContactInfo = (contact: Contact) => {
    const info = `${contact.name}，地址：${contact.address.slice(0, 10)}...${contact.address.slice(-6)}`
    if (contact.usageCount > 0) {
      voiceService.speak(`${info}，使用了 ${contact.usageCount} 次`)
    } else {
      voiceService.speak(info)
    }
  }

  return (
    <div className="space-y-6" role="region" aria-label="联系人管理">
      <AccessibleText text="联系人管理" level="h2" />
      
      {/* 添加联系人按钮 */}
      <AccessibleButton
        onClick={() => setIsAddingContact(!isAddingContact)}
        className="w-full p-4 bg-blue-600 text-white rounded-lg"
        ariaLabel="添加新联系人"
      >
        {isAddingContact ? '取消添加' : '添加联系人'}
      </AccessibleButton>

      {/* 添加联系人表单 */}
      {isAddingContact && (
        <form
          className="space-y-4 p-4 bg-gray-50 rounded-lg"
          onSubmit={(e) => {
            e.preventDefault()
            handleAddContact()
          }}
          aria-label="新联系人信息"
        >
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium mb-2">
              联系人姓名 *
            </label>
            <input
              id="contact-name"
              type="text"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="例如：小明"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="contact-address" className="block text-sm font-medium mb-2">
              钱包地址 *
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
              昵称（可选）
            </label>
            <input
              id="contact-nickname"
              type="text"
              value={newContact.nickname}
              onChange={(e) => setNewContact({ ...newContact, nickname: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="例如：老板、朋友"
            />
          </div>

          <AccessibleButton
            type="submit"
            className="w-full p-3 bg-green-600 text-white rounded-lg"
            ariaLabel="确认添加联系人"
          >
            添加联系人
          </AccessibleButton>
        </form>
      )}

      {/* 联系人列表 */}
      <div className="space-y-3">
        <AccessibleText text={`联系人列表 (${contacts.length})`} level="h3" />
        
        {contacts.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            暂无联系人，请添加您的第一个联系人
          </div>
        ) : (
          <div className="space-y-2" role="list" aria-label="联系人列表">
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
                      <p className="text-sm text-gray-600">昵称: {contact.nickname}</p>
                    )}
                    <p className="text-sm text-gray-500 font-mono break-all mt-1">
                      {contact.address}
                    </p>
                    {contact.usageCount > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        使用了 {contact.usageCount} 次
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <AccessibleButton
                      onClick={() => speakContactInfo(contact)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded"
                      ariaLabel={`播报 ${contact.name} 的信息`}
                    >
                      播报
                    </AccessibleButton>
                    
                    <AccessibleButton
                      onClick={() => handleRemoveContact(contact)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded"
                      ariaLabel={`删除联系人 ${contact.name}`}
                    >
                      删除
                    </AccessibleButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 常用联系人 */}
      {contacts.filter(c => c.usageCount > 0).length > 0 && (
        <div className="space-y-3">
          <AccessibleText text="常用联系人" level="h3" />
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
                      使用了 {contact.usageCount} 次
                    </span>
                  </div>
                  <AccessibleButton
                    onClick={() => speakContactInfo(contact)}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded"
                    ariaLabel={`播报常用联系人 ${contact.name}`}
                  >
                    播报
                  </AccessibleButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 语音提示 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AccessibleText text="语音转账提示" level="h4" />
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          <li>• "转账0.1ETH给小明" - 给联系人转账</li>
          <li>• "快速转账0.05ETH" - 给最近使用的联系人转账</li>
          <li>• "给老板转0.2ETH" - 使用昵称转账</li>
          <li>• "显示联系人" - 语音播报所有联系人</li>
        </ul>
      </div>
    </div>
  )
}
