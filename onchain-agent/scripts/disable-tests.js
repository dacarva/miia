#!/usr/bin/env node

/**
 * Script to disable test endpoints during deployment
 * This script checks if we're in a production build and disables test endpoints
 */

const fs = require('fs');
const path = require('path');

// Check if we're in production and tests should be skipped
const isProduction = process.env.NODE_ENV === 'production';
const skipTests = process.env.SKIP_TESTS === 'true';

if (isProduction && skipTests) {
  console.log('🚫 Production deployment detected - Test endpoints will be disabled');
  console.log('   Set SKIP_TESTS=false to enable tests');
} else {
  console.log('✅ Development mode - Test endpoints enabled');
}

// This script can be extended to modify test endpoints if needed
module.exports = {
  isProduction,
  skipTests,
  shouldDisableTests: isProduction && skipTests
};
