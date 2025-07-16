import React, { useState, useRef, useEffect } from 'react';
import { sendChat } from '../../../../utils/sendChat';
import Spacings from '@commercetools-uikit/spacings';
import { PrimaryButton, SecondaryButton } from '@commercetools-uikit/buttons';
import TextInput from '@commercetools-uikit/text-input';
import Text from '@commercetools-uikit/text';
import Card from '@commercetools-uikit/card';
import LoadingSpinner from '@commercetools-uikit/loading-spinner';

const AiChat = ({ customer, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionId = useRef(crypto.randomUUID());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize with customer context
  useEffect(() => {
    if (customer) {
      const welcomeMessage = {
        role: 'system',
        text: `AI Agent initialized for customer: ${customer.firstName} ${customer.lastName} (${customer.email})`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages([welcomeMessage]);
    }
  }, [customer]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      text: inputValue,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add customer context to the message
    const contextualMessage = `Customer Context: ${customer?.firstName} ${customer?.lastName} (${customer?.email})\n\nUser Query: ${inputValue}`;

    let assistantMessage = {
      role: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      await sendChat(contextualMessage, sessionId.current, (token, isFinal) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'assistant') {
            lastMessage.text += token;
            lastMessage.isStreaming = !isFinal;
          }
          return newMessages;
        });
      });
    } catch (error) {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.text = `Error: ${error.message}`;
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Card style={{ 
        width: '800px', 
        height: '600px', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        <Spacings.Stack scale="m">
          {/* Header */}
          <Spacings.Inline justifyContent="space-between" alignItems="center">
            <Text.Headline as="h3">AI Agent Chat</Text.Headline>
            <SecondaryButton 
              label="Close" 
              onClick={onClose}
              size="medium"
            />
          </Spacings.Inline>

          {/* Messages Container */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            border: '1px solid #e1e8ed',
            borderRadius: '4px',
            padding: '16px',
            backgroundColor: '#f7f9fc'
          }}>
            <Spacings.Stack scale="s">
              {messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: message.role === 'user' ? '#007acc' : 
                                   message.role === 'system' ? '#f0f0f0' : '#fff',
                    color: message.role === 'user' ? 'white' : '#333',
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    border: message.role !== 'user' ? '1px solid #e1e8ed' : 'none',
                    position: 'relative'
                  }}
                >
                  <Spacings.Stack scale="xs">
                    <Text.Detail tone={message.role === 'user' ? 'inverted' : 'secondary'}>
                      {message.role === 'user' ? 'You' : 
                       message.role === 'system' ? 'System' : 'AI Agent'} • {message.timestamp}
                    </Text.Detail>
                    <Text.Body tone={message.role === 'user' ? 'inverted' : 'primary'}>
                      {message.text}
                      {message.isStreaming && (
                        <span style={{ marginLeft: '4px' }}>
                          <LoadingSpinner size="s" />
                        </span>
                      )}
                    </Text.Body>
                  </Spacings.Stack>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </Spacings.Stack>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend}>
            <Spacings.Inline alignItems="flex-end" scale="s">
              <div style={{ flex: 1 }}>
                <TextInput
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message here..."
                  isDisabled={isLoading}
                  isMultilineText={true}
                  rows={2}
                />
              </div>
              <PrimaryButton
                type="submit"
                label={isLoading ? "Sending..." : "Send"}
                isDisabled={!inputValue.trim() || isLoading}
                size="medium"
              />
            </Spacings.Inline>
          </form>
        </Spacings.Stack>
      </Card>
    </div>
  );
};

export default AiChat;
