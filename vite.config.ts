import { defineConfig, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import { HttpsProxyAgent } from 'https-proxy-agent'

// Optional dev-only relay for sandboxed environments where the browser
// cannot reach Supabase directly but the dev-server process can (e.g.
// through a corporate/agent HTTPS proxy). Enable by setting:
//   SUPABASE_PROXY_TARGET=https://<project-ref>.supabase.co  (shell env)
//   VITE_SUPABASE_URL=http://localhost:5173/sb-proxy         (.env)
// Unset, the app talks to Supabase directly and this block is inert.
function supabaseDevProxy(): Record<string, ProxyOptions> | undefined {
  const target = process.env.SUPABASE_PROXY_TARGET
  if (!target) return undefined

  const outboundProxy = process.env.HTTPS_PROXY || process.env.https_proxy
  const agent = outboundProxy ? new HttpsProxyAgent(outboundProxy) : undefined

  return {
    '/sb-proxy': {
      target,
      changeOrigin: true,
      ws: true,
      rewrite: (path) => path.replace(/^\/sb-proxy/, ''),
      agent,
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: supabaseDevProxy(),
  },
})
