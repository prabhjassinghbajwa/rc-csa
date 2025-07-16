import React, { useState, useRef, useEffect } from 'react';
import { IconButton, Text } from '@commercetools-frontend/ui-kit';
import { BackIcon, ArrowUpIcon, PaperclipIcon, BrainIcon } from '@commercetools-uikit/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendChat } from '../../../../utils/sendChat.js';
import CustomerCard from '../../../CustomerCard/CustomerCard.jsx';
import styles from './GenericChat.module.css';

const GenericChat = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingBotReply, setLoadingBotReply] = useState(false);
  const [sessionId, setSessionId] = useState(crypto.randomUUID());
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  // Initialize chat with greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greetingMessage = {
        id: Date.now(),
        text: "Hi there! 👋 I'm your AI Assistant 🤖\n\nLet me know how I can help you today 😊\n\nI can assist you with:\n• **Product Lookup** 🔍 (even across multiple scenarios!)\n• **Order-related queries** 📦🧾\n• **Customer information** 👤\n• **General support** 💬\n\nJust type in what you need! ✨",
        sender: "Bot",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        loading: false
      };
      setMessages([greetingMessage]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!newMessage.trim() || loadingBotReply) return;

    const userMessage = newMessage.trim();
    setMessages(prev => [...prev, { 
      id: Date.now(),
      text: userMessage,
      sender: "User",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loading: false
    }]);
    setNewMessage("");
    setLoadingBotReply(true);

    // Generate a loading message ID to track and remove later
    const loadingMessageId = Date.now() + 1;
    const loadingMessage = {
      id: loadingMessageId,
      text: "",
      sender: "Bot",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      loading: true
    };

    setMessages(prev => [...prev, loadingMessage]);
    
    try {
      const botResponse = await sendChat(userMessage, sessionId);
      
      // Remove the loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      
      // Try to parse customer data first
      const customerData = parseCustomerData(botResponse);
      
      if (customerData) {
        // Add customer card message
        setMessages(prev => [...prev, { 
          id: Date.now() + 1,
          text: '',
          sender: 'Bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          loading: false,
          customerData: customerData 
        }]);
      } else {
        // Add regular bot message
        setMessages(prev => [...prev, { 
          id: Date.now() + 1,
          text: botResponse,
          sender: 'Bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          loading: false
        }]);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => {
        const newMessages = prev.filter(msg => msg.id !== loadingMessageId);
        const errorMessage = {
          id: Date.now() + 2,
          text: "Sorry, I'm having trouble connecting right now. Please try again.",
          sender: "Bot",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          loading: false
        };
        return [...newMessages, errorMessage];
      });
    } finally {
      setLoadingBotReply(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const parseCustomerData = (response) => {
    // No longer parsing customer data - let responses display as raw text
    return null;
  };

  // Custom image component for product thumbnails
  const ChatImage = ({ alt, src }) => {
    return (
      <img
        src={src}
        alt={alt || 'Product image'}
        style={{
          width: '50px',
          height: '50px',
          objectFit: 'cover',
          borderRadius: '4px',
          display: 'inline-block',
          verticalAlign: 'middle',
          border: '1px solid #e5e7eb',
          margin: '0 4px'
        }}
      />
    );
  };

  const formatContent = (content) => {
    // Try to parse JSON and format it nicely
    try {
      const parsed = JSON.parse(content);
      return (
        <pre style={{
          fontSize: '1rem',
          backgroundColor: '#f9fafb',
          padding: '0.75rem',
          border: '1px solid #e5e7eb',
          overflowX: 'auto',
          fontFamily: 'system-ui, sans-serif',
          borderRadius: '0.375rem'
        }}>
          <code>{JSON.stringify(parsed, null, 2)}</code>
        </pre>
      );
    } catch {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ node, ...props }) => <ChatImage {...props} />,
            table: ({ node, ...props }) => (
              <table style={{
                minWidth: '100%',
                fontSize: '1rem',
                borderCollapse: 'collapse',
                fontFamily: 'system-ui, sans-serif',
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                overflow: 'hidden'
              }} {...props} />
            ),
            th: ({ node, ...props }) => (
              <th style={{
                borderBottom: '1px solid #e5e7eb',
                padding: '0.75rem 1rem',
                textAlign: 'left',
                fontWeight: '600',
                fontFamily: 'system-ui, sans-serif',
                backgroundColor: '#f9fafb'
              }} {...props} />
            ),
            td: ({ node, ...props }) => (
              <td style={{
                borderBottom: '1px solid #f3f4f6',
                padding: '0.75rem 1rem',
                fontFamily: 'system-ui, sans-serif'
              }} {...props} />
            ),
            code: ({ node, inline, ...props }) => (
              inline ? 
                <code style={{
                  backgroundColor: '#f3f4f6',
                  padding: '0.125rem 0.25rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }} {...props} /> :
                <code style={{
                  display: 'block',
                  backgroundColor: '#f3f4f6',
                  padding: '0.5rem',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto'
                }} {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote style={{
                borderLeft: '4px solid #3b82f6',
                paddingLeft: '1rem',
                fontStyle: 'italic',
                color: '#6b7280'
              }} {...props} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles['chat-overlay']}>
      <div className={styles['chat-modal']}>
        {/* Chat Header */}
        <div className={styles['chat-header']}>
          <div className={styles['chat-header-content']}>
            <div className={styles['chat-title-section']}>
              <Text.Subheadline as="h2" isBold={true} className={styles['chat-title']}>
                Generic Chat Assistant
              </Text.Subheadline>
              <Text.Detail tone="secondary" className={styles['chat-subtitle']}>
                Ask me anything about products, orders, and more!
              </Text.Detail>
            </div>
            <IconButton
              icon={<BackIcon />}
              label="Close Chat"
              onClick={onClose}
              className={styles['close-button']}
            />
          </div>
        </div>

        {/* Messages Container */}
        <div className={styles['messages-container']}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.sender === "User" ? styles['user-message'] : styles['bot-message']}`}
            >
              {msg.sender === "User" ? (
                <div className={styles['user-message-content']}>
                  <div className={styles['user-text']}>{msg.text}</div>
                  <div className={styles['message-time']}>{msg.time}</div>
                </div>
              ) : (
                <div className={styles['bot-message-content']}>
                  <div className={styles['bot-avatar']}>
                    <div className={styles['bot-icon']}>
                      <BrainIcon size="medium" />
                    </div>
                  </div>
                  <div className={styles['bot-text-container']}>
                    {msg.loading ? (
                      <div className={styles['loading-message']}>
                        <div className={styles['loading-spinner']}></div>
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <div className={styles['bot-text']}>
                        {msg.customerData ? (
                          <div className={styles['customer-card-container']}>
                            <CustomerCard
                              customer={msg.customerData.customer}
                              orders={msg.customerData.orders}
                              onViewOrder={(orderId) => {
                                setNewMessage(`Show me details for order ${orderId}`);
                              }}
                            />
                          </div>
                        ) : (
                          formatContent(msg.text)
                        )}
                      </div>
                    )}
                    <div className={styles['message-time']}>{msg.time}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Container */}
        <div className={styles['input-container']}>
          <form 
            className={styles['input-form']}
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          >
            <textarea
              ref={textareaRef}
              className={styles['message-input']}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              disabled={loadingBotReply}
            />
            <div className={styles['input-buttons']}>
              <button
                type="button"
                className={styles['attach-button']}
                aria-label="Attach file"
              >
                <PaperclipIcon />
              </button>
              <button
                type="submit"
                className={styles['send-button']}
                disabled={loadingBotReply || !newMessage.trim()}
                aria-label="Send message"
              >
                <ArrowUpIcon />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GenericChat; 