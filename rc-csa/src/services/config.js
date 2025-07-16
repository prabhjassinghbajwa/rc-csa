/**
 * Configuration service for MCP WebSocket connections
 * Handles environment-based configuration similar to the reference architecture
 */

class ConfigService {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    const mode = process.env.REACT_APP_BACKEND_MODE || 'local';
    const localWsUrl = process.env.REACT_APP_LOCAL_WS_URL || 'ws://localhost:3003';
    const cloudWsUrl = process.env.REACT_APP_CLOUD_WS_URL || 'wss://your-cloud-server.com';
    const httpFallbackUrl = process.env.REACT_APP_HTTP_FALLBACK_URL || 'http://localhost:3005';
    
    console.log('🔧 [Config] Loading MCP configuration:', {
      mode,
      localWsUrl,
      cloudWsUrl,
      httpFallbackUrl
    });
    
    let wsUrl;
    let httpUrl;
    
    switch (mode) {
      case 'local':
        wsUrl = localWsUrl; // ws://localhost:3003
        httpUrl = httpFallbackUrl; // http://localhost:3005
        break;
      case 'cloud':
        wsUrl = cloudWsUrl; // wss://your-cloud-server.com
        httpUrl = cloudWsUrl.replace('wss://', 'https://');
        break;
      default:
        wsUrl = localWsUrl;
        httpUrl = httpFallbackUrl;
    }
    
    const config = {
      mode,
      wsUrl,
      httpUrl,
      isLocal: mode === 'local',
      isCloud: mode === 'cloud'
    };
    
    console.log('✅ [Config] MCP configuration loaded:', config);
    return config;
  }

  getConfig() {
    return this.config;
  }

  getMode() {
    return this.config.mode;
  }

  getWebSocketUrl() {
    return this.config.wsUrl;
  }

  getHttpFallbackUrl() {
    return this.config.httpUrl;
  }

  isLocalMode() {
    return this.config.isLocal;
  }

  isCloudMode() {
    return this.config.isCloud;
  }

  // Reload configuration (useful for dynamic changes)
  reload() {
    this.config = this.loadConfig();
    return this.config;
  }
}

// Export singleton instance
export const configService = new ConfigService();
export default configService;
