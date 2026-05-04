
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
  console.error('No key');
  process.exit(1);
}

try {
  const decoded = jwt.decode(key);
  console.log('JWT Payload:', JSON.stringify(decoded, null, 2));
} catch (e) {
  console.error('Failed to decode', e);
}
