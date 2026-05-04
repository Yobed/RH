
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

async function testUpload() {
  const testPath = `test_${Date.now()}.txt`;
  const content = Buffer.from('Hello Supabase');
  
  console.log(`Testing upload to 'documents' bucket at path: ${testPath}`);
  
  const { data, error } = await supabase.storage
    .from('documents')
    .upload(testPath, content, {
      contentType: 'text/plain',
      upsert: true
    });

  if (error) {
    console.error('Upload failed:', JSON.stringify(error, null, 2));
  } else {
    console.log('Upload successful:', data);
  }
}

testUpload();
