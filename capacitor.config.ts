import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plainly.app',
  appName: 'Plainly',
  webDir: 'out',
  server: {
    url: 'https://plainlyapp.app',
    cleartext: false,
  },
};

export default config;
