/**
 * sendChat.js
 * WebSocket-based MCP client for customer service chat
 * Refactored to use WebSocket instead of HTTP/SSE
 */

import { configService } from '../services/config.js';

/**
 * WebSocket MCP Client Manager
 * Manages WebSocket connections and provides chat functionality
 */
class MCPWebSocketClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.messageCallbacks = new Map();
    this.reconnectTimeout = null;
    this.config = configService.getConfig();
    
    console.log('🔧 [MCP WebSocket] Initializing client with config:', this.config);
  }

  async connect() {
    if (this.isConnected || this.isConnecting) {
      console.log('🔗 [MCP WebSocket] Already connected/connecting');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      console.log('🔗 [MCP WebSocket] Connecting to:', this.config.wsUrl);
      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.config.wsUrl);

        this.ws.onopen = () => {
          console.log('✅ [MCP WebSocket] Connected successfully');
          this.isConnected = true;
          this.isConnecting = false;
          resolve();
        };

        this.ws.onclose = (event) => {
          console.log('🔌 [MCP WebSocket] Disconnected:', { code: event.code, reason: event.reason });
          this.isConnected = false;
          this.isConnecting = false;
          
          // Auto-reconnect if not intentionally closed
          if (event.code !== 1000) {
            console.log('🔄 [MCP WebSocket] Auto-reconnecting in 3 seconds...');
            this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ [MCP WebSocket] Connection error:', error);
          this.isConnecting = false;
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('❌ [MCP WebSocket] Failed to parse message:', error);
          }
        };
      } catch (error) {
        console.error('❌ [MCP WebSocket] Failed to create connection:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  handleMessage(data) {
    console.log('📥 [MCP WebSocket] Received message:', data);
    
    // Handle JSON-RPC response
    if (data.id && this.messageCallbacks.has(data.id)) {
      const callback = this.messageCallbacks.get(data.id);
      this.messageCallbacks.delete(data.id);
      
      if (data.error) {
        console.error('❌ [MCP WebSocket] Request failed:', data.error);
        callback(null, data.error);
      } else {
        callback(data.result, null);
      }
    }
  }

  sendMessage(message, callback = null) {
    if (!this.isConnected || !this.ws) {
      console.warn('⚠️ [MCP WebSocket] Not connected - attempting to connect first');
      this.connect().then(() => {
        this.sendMessage(message, callback);
      }).catch(error => {
        if (callback) callback(null, error);
      });
      return;
    }

    console.log('📤 [MCP WebSocket] Sending message:', message);
    
    // Store callback if provided
    if (callback && message.id) {
      this.messageCallbacks.set(message.id, callback);
    }
    
    this.ws.send(JSON.stringify(message));
  }

  sendChatMessage(text, callback = null) {
    const id = crypto.randomUUID();
    const message = {
      jsonrpc: '2.0',
      id,
      method: 'chat/message',
      params: { text }
    };
    
    console.log('💬 [MCP WebSocket] Sending chat message:', text);
    this.sendMessage(message, callback);
  }

  disconnect() {
    console.log('🔌 [MCP WebSocket] Disconnecting...');
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.messageCallbacks.clear();
  }
}

// Global WebSocket client instance
const mcpClient = new MCPWebSocketClient();

/**
 * Send chat message to MCP server via WebSocket
 * @param {string} message - The chat message to send
 * @param {string} sessionId - Session ID for the conversation
 * @param {function} callback - Callback function to handle response
 */
export async function sendChat(message, sessionId, callback) {
  console.log('💬 [sendChat] Starting chat via WebSocket:', { message, sessionId });
  
  // Support both callback-based and Promise-based usage
  const useCallback = typeof callback === 'function';
  
  if (!useCallback) {
    // Promise-based usage (dashboard chat)
    return new Promise(async (resolve, reject) => {
      try {
        // Ensure connection is established
        if (!mcpClient.isConnected) {
          console.log('🔗 [sendChat] Connecting to MCP server...');
          await mcpClient.connect();
        }
        
        // Send chat message
        mcpClient.sendChatMessage(message, (result, error) => {
          if (error) {
            console.error('❌ [sendChat] Chat failed:', error);
            reject(new Error(error.message || 'Failed to communicate with MCP server'));
          } else {
            console.log('✅ [sendChat] Chat response received:', result);
            
            // Extract response text from result
            let responseText = '';
            if (result && result.response) {
              responseText = result.response;
            } else if (result && typeof result === 'string') {
              responseText = result;
            } else {
              responseText = JSON.stringify(result, null, 2);
            }
            
            console.log('🔄 [sendChat] Resolving Promise with response:', responseText.substring(0, 100) + '...');
            resolve(responseText);
          }
        });
      } catch (error) {
        console.error('❌ [sendChat] Connection error:', error);
        reject(error);
      }
    });
  } else {
    // Callback-based usage (AI chat streaming)
    try {
      // Ensure connection is established
      if (!mcpClient.isConnected) {
        console.log('🔗 [sendChat] Connecting to MCP server...');
        await mcpClient.connect();
      }
      
      // Send chat message
      mcpClient.sendChatMessage(message, (result, error) => {
        if (error) {
          console.error('❌ [sendChat] Chat failed:', error);
          const errorMessage = `Error: ${error.message || 'Failed to communicate with MCP server'}`;
          callback(errorMessage, true);
        } else {
          console.log('✅ [sendChat] Chat response received:', result);
          
          // Extract response text from result
          let responseText = '';
          if (result && result.response) {
            responseText = result.response;
          } else if (result && typeof result === 'string') {
            responseText = result;
          } else {
            responseText = JSON.stringify(result, null, 2);
          }
          
          console.log('🔄 [sendChat] Calling UI callback with response:', responseText.substring(0, 100) + '...');
          
          // Send the complete response to the callback
          // The UI expects (token, isFinal) - we send the full response as the token
          callback(responseText, true);
        }
      });
    } catch (error) {
      console.error('❌ [sendChat] Connection error:', error);
      const errorMessage = `Connection error: ${error.message}`;
      callback(errorMessage, true);
    }
  }
}

/**
 * Legacy function for customer lookup - now uses WebSocket
 * @param {string} customerId - Customer email or ID
 * @param {function} append - Callback function to handle streaming response
 */
export async function lookupCustomer(customerId, append) {
  console.log('🔍 [lookupCustomer] Looking up customer via WebSocket:', customerId);
  
  const lookupMessage = `customer lookup for ${customerId}`;
  const sessionId = crypto.randomUUID();
  
  await sendChat(lookupMessage, sessionId, (responseText, isFinal) => {
    append(responseText, isFinal);
  });
}

// Export the global WebSocket client for advanced usage
export { mcpClient };

// Export configuration service for external access
export { configService };
