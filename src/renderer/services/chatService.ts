// src/renderer/services/chatService.ts
import axios from 'axios';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatSession {
  id: string;
  context: any;
  history: ChatMessage[];
  createdAt: Date;
}

class ChatService {
  private baseURL = 'http://localhost:5000/api/chat';

  async initializeChat(sessionId: string, systemPrompt: string, results: any): Promise<string> {
    try {
      const response = await axios.post(`${this.baseURL}/initialize`, {
        sessionId,
        systemPrompt,
        results
      });
      return response.data.message;
    } catch (error) {
      console.error('Chat initialization error:', error);
      throw error;
    }
  }

  async sendMessage(
    sessionId: string,
    message: string,
    history: ChatMessage[],
    context: any
  ): Promise<string> {
    try {
      const response = await axios.post(`${this.baseURL}/message`, {
        sessionId,
        message,
        history,
        context
      });
      return response.data.message;
    } catch (error) {
      console.error('Chat message error:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();