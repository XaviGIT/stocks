// Global test setup
export default async function globalSetup() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  
  // Add any global test setup here
  console.log('Setting up test environment...');
}
