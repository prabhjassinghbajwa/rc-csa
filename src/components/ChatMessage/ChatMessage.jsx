/**
 * ChatMessage.jsx
 * Component for rendering chat messages with proper HTML formatting
 * Handles both plain text and HTML content from MCP server
 */

import React from 'react';
import { looksLikeHtml, processHtmlForChat } from '../../utils/render';

export default function ChatMessage({ msg }) {
  const isHtmlContent = looksLikeHtml(msg.text);

  return isHtmlContent ? (
    // Render HTML content with beautification and styling
    <div 
      dangerouslySetInnerHTML={{ 
        __html: processHtmlForChat(msg.text) 
      }} 
    />
  ) : (
    // Render plain text with proper whitespace handling
    <p style={{ whiteSpace: 'pre-wrap', margin: 0, wordWrap: 'break-word' }}>
      {msg.text}
    </p>
  );
}
