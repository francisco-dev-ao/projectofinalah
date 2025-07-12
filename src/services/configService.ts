
import { supabase } from '@/lib/supabase';

interface SecureConfig {
  multicaixa_frame_token?: string;
  multicaixa_callback_url?: string;
  smtp_host?: string;
  smtp_port?: string;
  smtp_user?: string;
  smtp_password?: string;
}

class ConfigService {
  private cache: SecureConfig = {};
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getConfig(): Promise<SecureConfig> {
    // Return cached config if still valid
    if (Date.now() < this.cacheExpiry && Object.keys(this.cache).length > 0) {
      return this.cache;
    }

    try {
      // Get configuration from Supabase secrets or company_settings
      const { data: settings, error } = await supabase
        .from('company_settings')
        .select('multicaixa_express_config, smtp_config')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching secure config:', error);
        return this.cache; // Return cached config on error
      }

      // Build secure config object
      const config: SecureConfig = {};
      
      if (settings?.multicaixa_express_config) {
        config.multicaixa_frame_token = settings.multicaixa_express_config.frametoken;
        config.multicaixa_callback_url = settings.multicaixa_express_config.callback;
      }

      if (settings?.smtp_config) {
        config.smtp_host = settings.smtp_config.host;
        config.smtp_port = settings.smtp_config.port;
        config.smtp_user = settings.smtp_config.user;
        config.smtp_password = settings.smtp_config.password;
      }

      // Update cache
      this.cache = config;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return config;
    } catch (error) {
      console.error('Error in getConfig:', error);
      return this.cache;
    }
  }

  async getMulticaixaConfig() {
    const config = await this.getConfig();
    return {
      frametoken: config.multicaixa_frame_token || '',
      callback: config.multicaixa_callback_url || ''
    };
  }

  async getSmtpConfig() {
    const config = await this.getConfig();
    return {
      host: config.smtp_host || '',
      port: config.smtp_port || '',
      user: config.smtp_user || '',
      password: config.smtp_password || ''
    };
  }

  // Clear cache when configuration is updated
  clearCache() {
    this.cache = {};
    this.cacheExpiry = 0;
  }
}

export const configService = new ConfigService();
export default configService;
