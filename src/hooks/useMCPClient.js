/**
 * WebSocket MCP Client Hook
 * Similar to the reference architecture's useMCPClient.js
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { configService } from '../services/config.js';

const useMCPClient = (customServerUrl = null) => {
  const [state, setState] = useState({
    isConnected: false,
    isConnecting: false,
    error: null,
    tools: [],
    messages: [],
    aiEnabled: false,
  });
  
  const wsRef = useRef(null);
  const messageCallbacksRef = useRef(new Map()); // Store callbacks for pending requests
  const reconnectTimeoutRef = useRef(null);
  
  // Get server URL from config or use custom URL
  const serverUrl = customServerUrl || configService.getWebSocketUrl();
  
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('🔗 [MCP Client] Already connected to:', serverUrl);
      return;
    }
    
    console.log('🔗 [MCP Client] Connecting to WebSocket:', serverUrl);
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const ws = new WebSocket(serverUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('✅ [MCP Client] Connected to MCP server:', serverUrl);
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null
        }));
        
        // Load available tools after connection
        listTools();
      };
      
      ws.onclose = (event) => {
        console.log('🔌 [MCP Client] Disconnected from MCP server:', { code: event.code, reason: event.reason });
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));
        
        // Auto-reconnect if not intentionally closed
        if (event.code !== 1000) {
          console.log('🔄 [MCP Client] Auto-reconnecting in 3 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => connect(), 3000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ [MCP Client] WebSocket error:', error);
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection failed',
          isConnecting: false
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('❌ [MCP Client] Failed to parse message:', error, event.data);
        }
      };
    } catch (error) {
      console.error('❌ [MCP Client] Failed to create WebSocket connection:', error);
      setState(prev => ({
        ...prev,
        error: `Failed to connect: ${error.message}`,
        isConnecting: false
      }));
    }
  }, [serverUrl]);

  const disconnect = useCallback(() => {
    console.log('🔌 [MCP Client] Manually disconnecting...');
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close WebSocket connection
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    // Clear callbacks
    messageCallbacksRef.current.clear();
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      error: null
    }));
  }, []);

  const handleMessage = useCallback((data) => {
    console.log('📥 [MCP Client] Received message:', data);
    
    // Handle JSON-RPC response
    if (data.id && messageCallbacksRef.current.has(data.id)) {
      const callback = messageCallbacksRef.current.get(data.id);
      messageCallbacksRef.current.delete(data.id);
      
      if (data.error) {
        console.error('❌ [MCP Client] Request failed:', data.error);
        callback(null, data.error);
      } else {
        callback(data.result, null);
      }
    }
    
    // Handle notifications or other messages
    if (!data.id) {
      console.log('📢 [MCP Client] Received notification:', data);
    }
  }, []);

  const sendMessage = useCallback((message, callback = null) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('📤 [MCP Client] Sending message:', message);
      
      // Store callback if provided
      if (callback && message.id) {
        messageCallbacksRef.current.set(message.id, callback);
      }
      
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('⚠️ [MCP Client] Cannot send message - WebSocket not connected');
      if (callback) {
        callback(null, { code: -32003, message: 'WebSocket not connected' });
      }
      return false;
    }
  }, []);

  const listTools = useCallback(() => {
    const id = crypto.randomUUID();
    const message = {
      jsonrpc: '2.0',
      id,
      method: 'tools/list',
      params: {}
    };
    
    sendMessage(message, (result, error) => {
      if (error) {
        console.error('❌ [MCP Client] Failed to list tools:', error);
      } else {
        console.log('🔧 [MCP Client] Available tools:', result?.tools || []);
        setState(prev => ({
          ...prev,
          tools: result?.tools || []
        }));
      }
    });
  }, [sendMessage]);

  const sendChatMessage = useCallback((content, callback = null) => {
    const id = crypto.randomUUID();
    const message = {
      jsonrpc: '2.0',
      id,
      method: 'chat/message',
      params: { text: content }
    };
    
    console.log('💬 [MCP Client] Sending chat message:', content);
    
    sendMessage(message, (result, error) => {
      if (error) {
        console.error('❌ [MCP Client] Chat message failed:', error);
        if (callback) callback(null, error);
      } else {
        console.log('✅ [MCP Client] Chat response received:', result);
        if (callback) callback(result, null);
      }
    });
  }, [sendMessage]);

  const callTool = useCallback((toolName, args = {}, callback = null) => {
    const id = crypto.randomUUID();
    const message = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };
    
    console.log('🔧 [MCP Client] Calling tool:', toolName, args);
    
    sendMessage(message, (result, error) => {
      if (error) {
        console.error('❌ [MCP Client] Tool call failed:', error);
        if (callback) callback(null, error);
      } else {
        console.log('✅ [MCP Client] Tool result:', result);
        if (callback) callback(result, null);
      }
    });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    // Connection state
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    
    // Available tools
    tools: state.tools,
    
    // Connection management
    connect,
    disconnect,
    
    // Communication methods
    sendChatMessage,
    callTool,
    listTools,
    sendMessage, // Low-level message sending
    
    // Server info
    serverUrl,
    config: configService.getConfig()
  };
};

export default useMCPClient;
