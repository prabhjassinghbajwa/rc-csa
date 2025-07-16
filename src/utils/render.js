/**
 * render.js
 * HTML rendering utilities for customer service chat responses
 * Provides consistent styling for MCP server HTML responses
 */

// Global flag to inject CSS only once
let customerStylesInjected = false;

/**
 * Inline CSS for customer cards and chat responses (no external dependency)
 */
const customerCardCSS = `
.customer-card{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;max-width:56rem;margin:2rem auto;background:#fff;border-radius:0.75rem;box-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -2px rgba(0,0,0,.05);overflow:hidden}
.customer-card section{padding:2rem;border-bottom:1px solid #e2e8f0}
.customer-card section:last-child{border-bottom:none}
.customer-card h2{font-size:1.25rem;line-height:1.75rem;font-weight:600;color:#1e293b;margin-bottom:1.5rem}
.summary-grid{display:grid;gap:1.5rem}
@media(min-width:640px){.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:1024px){.summary-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
.summary-item p.label{font-size:.75rem;text-transform:uppercase;letter-spacing:.025em;color:#64748b;margin-bottom:.25rem;font-weight:500}
.summary-item p.val{font-weight:500;color:#1e293b;word-break:break-all}
.order-table{width:100%;border-collapse:collapse;font-size:.875rem;margin-top:1rem}
.order-table th{background:#f8fafc;text-align:left;padding:.75rem;color:#475569;font-size:.75rem;font-weight:600;text-transform:uppercase;border-bottom:2px solid #e2e8f0}
.order-table td{padding:.75rem;border-top:1px solid #f1f5f9;color:#334155}
.order-table a.action{display:inline-block;background:#2563eb;color:#fff;font-size:.75rem;font-weight:600;padding:.375rem .75rem;border-radius:.375rem;text-decoration:none;transition:background-color 0.2s}
.order-table a.action:hover{background:#1d4ed8}
.order-table button{display:inline-block;background:#2563eb;color:#fff;font-size:.75rem;font-weight:600;padding:.375rem .75rem;border-radius:.375rem;border:none;cursor:pointer;text-decoration:none;transition:background-color 0.2s}
.order-table button:hover{background:#1d4ed8}
.no-orders{text-align:center;padding:2rem;color:#64748b;font-style:italic}

/* Chat-specific styles */
.chat-html-content {
  max-width: 100%;
  overflow-x: auto;
}

.chat-html-content .customer-card {
  margin: 1rem 0;
  max-width: 100%;
}

.chat-html-content table {
  font-size: 0.8rem;
}

.chat-html-content .summary-grid {
  gap: 1rem;
}

@media (max-width: 640px) {
  .chat-html-content .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .chat-html-content .order-table {
    font-size: 0.7rem;
  }
  
  .chat-html-content .order-table th,
  .chat-html-content .order-table td {
    padding: 0.5rem;
  }
}
`;

/**
 * Inject CSS styles once into the document head
 */
export function injectCustomerStyles() {
  if (customerStylesInjected) return;
  
  try {
    // Check if styles already exist
    const existingStyle = document.querySelector('style[data-mcp-styles]');
    if (existingStyle) {
      customerStylesInjected = true;
      return;
    }
    
    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-mcp-styles', 'true');
    styleElement.textContent = customerCardCSS;
    document.head.appendChild(styleElement);
    customerStylesInjected = true;
    
    console.log('MCP CSS styles injected successfully');
  } catch (error) {
    console.error('Failed to inject MCP styles:', error);
  }
}

/**
 * Check if content looks like HTML
 */
export function looksLikeHtml(content) {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  // Check for HTML tags and common HTML patterns
  return trimmed.startsWith('<') && trimmed.includes('>') && 
         (trimmed.includes('</') || trimmed.includes('/>') || 
          trimmed.includes('<div') || trimmed.includes('<table') || 
          trimmed.includes('<p') || trimmed.includes('<span'));
}

/**
 * Beautify HTML content from MCP server
 * Ensures CSS is injected and content is properly wrapped
 */
export function beautifyMcpHtml(htmlContent) {
  // Inject CSS styles into document head
  injectCustomerStyles();
  
  // Clean and process the HTML content
  let processedContent = htmlContent;
  
  // Add responsive wrapper class for chat display
  if (!processedContent.includes('chat-html-content')) {
    processedContent = `<div class="chat-html-content">${processedContent}</div>`;
  }
  
  return processedContent;
}

/**
 * Process and enhance HTML content for chat display
 * Fixes button interactions and ensures proper styling
 */
export function processHtmlForChat(htmlContent) {
  // Ensure CSS is injected first
  injectCustomerStyles();
  
  // Clean and process the HTML content
  let processedHtml = htmlContent;
  
  // Fix button onclick handlers to work with our chat input field
  processedHtml = processedHtml.replace(
    /onclick="[^"]*"/g,
    (match) => {
      // Extract the value from onclick handlers
      const valueMatch = match.match(/value\s*=\s*['"]([^'"]*)['"]/);
      if (valueMatch) {
        const value = valueMatch[1];
        return `onclick="(function(){const input=document.getElementById('messageInput');if(input){input.value='${value}';const form=document.querySelector('form');if(form){const submitEvent=new Event('submit',{bubbles:true,cancelable:true});form.dispatchEvent(submitEvent);}}})()" style="cursor:pointer;"`;
      }
      return match;
    }
  );
  
  // Wrap content in chat-specific container for responsive styling
  if (!processedHtml.includes('chat-html-content')) {
    processedHtml = `<div class="chat-html-content">${processedHtml}</div>`;
  }
  
  return processedHtml;
}
