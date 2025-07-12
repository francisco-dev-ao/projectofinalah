
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/functions/v1/:path*',
        destination: 'https://qitelgupnfdszpioxmnm.supabase.co/functions/v1/:path*',
      },
      {
        source: '/multicaixa/callback',
        destination: '/api/multicaixa/callback',
      }
    ];
  },
  // Adicionar cabeçalhos para permitir CORS para endpoints específicos
  async headers() {
    return [
      {
        source: '/api/multicaixa/callback',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
