import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/ui', timeout: 60000,
  use: { baseURL: 'http://localhost:8081', viewport: { width: 393, height: 852 }, permissions: ['geolocation'], geolocation: { latitude: -6.195, longitude: 106.838 } },
  webServer: { command: 'npx expo start --web --port 8081', url: 'http://localhost:8081', reuseExistingServer: true, timeout: 120000 },
});
