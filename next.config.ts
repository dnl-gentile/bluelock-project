import type { NextConfig } from 'next';

// Firebase App Hosting injects FIREBASE_WEBAPP_CONFIG at BUILD time only.
// We parse it here and expose each field as NEXT_PUBLIC_* so they get
// baked into the client bundle by Next.js.
let webappConfig: Record<string, string> = {};
if (process.env.FIREBASE_WEBAPP_CONFIG) {
  try {
    webappConfig = JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
  } catch (e) {
    console.error('Failed to parse FIREBASE_WEBAPP_CONFIG', e);
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: { ignoreBuildErrors: true },
  turbopack: {
    resolveAlias: {
      '@views': './src/views',
      '@components': './src/components',
      '@lib': './src/lib',
      '@store': './src/store',
    },
  },
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || webappConfig.apiKey || '',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || webappConfig.authDomain || '',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || webappConfig.projectId || '',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || webappConfig.storageBucket || '',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || webappConfig.messagingSenderId || '',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || webappConfig.appId || '',
  },
};

export default nextConfig;


