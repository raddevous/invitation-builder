import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.instavow.app',
  appName: 'InstaVow',
  webDir: 'out',
  server: {
    url: 'https://instavow.com',
    cleartext: true
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    CapacitorUpdater: {
      appId: 'com.instavow.app',
      version: '0.0.0',
      autoUpdate: 'atBackground'
    }
  }
};

export default config;
