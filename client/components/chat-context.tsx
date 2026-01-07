"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatContextType {
  messages: Message[];
  addMessage: (message: Omit<Message, 'timestamp'>) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// 최대 저장 메시지 수
const MAX_MESSAGES = 100;
// 메시지 만료 기간 (7일)
const MESSAGE_EXPIRY_DAYS = 7;

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('chatMessages');
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages) as Message[];
        const now = Date.now();
        // 만료된 메시지 필터링
        return parsedMessages.filter(
          msg => now - msg.timestamp < MESSAGE_EXPIRY_DAYS * 24 * 60 * 60 * 1000
        );
      }
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const addMessage = (message: Omit<Message, 'timestamp'>) => {
    setMessages((prev) => {
      const newMessages = [...prev, { ...message, timestamp: Date.now() }];
      // 최대 메시지 수 제한
      if (newMessages.length > MAX_MESSAGES) {
        return newMessages.slice(-MAX_MESSAGES);
      }
      return newMessages;
    });
  };

  const clearMessages = () => {
    setMessages([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('chatMessages');
    }
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, clearMessages }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
} 