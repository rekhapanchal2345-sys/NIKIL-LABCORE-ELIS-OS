const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// The API applies a server-side HMAC pepper (PASSWORD_PEPPER) BEFORE bcrypt —
// see api/src/utils/password.ts. A hash generated without the pepper will never
// verify at login, so the identical transform is applied here.
const peppered = (pw) =>
  crypto.createHmac('sha256', process.env.PASSWORD_PEPPER || '').update(pw).digest('hex');

// Get the password from a command line argument or the environment.
// There is deliberately no fallback: a built-in default would be a published
// password, and echoing it below would write it into shell history and logs.
const password = process.argv[2] || process.env.ADMIN_PASSWORD;
const rounds = 12;

if (!password) {
  console.error('Usage: node generate-hash.js <your-password>');
  console.error('   or: set ADMIN_PASSWORD in backend/.env');
  process.exit(1);
}

bcrypt.hash(peppered(password), rounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    process.exit(1);
  }
  
  console.log('Rounds:', rounds);
  console.log('Hash:', hash);
  
  // Verify the hash
  bcrypt.compare(peppered(password), hash, (err, result) => {
    if (err) {
      console.error('Error verifying hash:', err);
      process.exit(1);
    }
    
    console.log('Verification:', result ? 'SUCCESS' : 'FAILED');
  });
});