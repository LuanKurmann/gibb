// Simple script to apply database migrations to Supabase
// Run this with: node apply-migration.js

const fs = require('fs');
const path = require('path');

console.log('Database Migration Script');
console.log('========================');
console.log('');
console.log('To apply the database migrations for the scheduled_tests table:');
console.log('');
console.log('1. Go to your Supabase dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Copy and paste the following SQL:');
console.log('');

// Read the latest migration file
const migrationPath = path.join(__dirname, 'database', 'migrations', '003_create_scheduled_tests_table.sql');

try {
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  console.log('--- SQL MIGRATION ---');
  console.log(migrationSQL);
  console.log('--- END MIGRATION ---');
  console.log('');
  console.log('4. Click "Run" to execute the migration');
  console.log('5. Restart your Angular development server');
  console.log('');
  console.log('This will create the scheduled_tests table for the test calendar feature.');
} catch (error) {
  console.error('Error reading migration file:', error.message);
  console.log('Please manually copy the content from database/migrations/003_create_scheduled_tests_table.sql');
}
