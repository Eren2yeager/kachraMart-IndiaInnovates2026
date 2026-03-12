// Test script to debug Roboflow API response
// Run with: node test-roboflow.js

const API_KEY = 'iFFDE6mLuRtrRR8tspsE';
const WORKSPACE = 'sanar-gautam';
const MODEL_ID = 'find-circuit-boards-concretes-papers-plastic-bottles-plastic-bags-cardboards-batteries-bricks-mobile-phones-fruit-peels-food-wastes-and-metal-cans';

// Test image URL (a plastic bottle image from Cloudinary)
// This is a real waste image that should be detected
const TEST_IMAGE_URL = 'https://res.cloudinary.com/dq5wsepyo/image/upload/v1773325074/waste-images/txscgxfmieafiinnyj7b.jpg';

async function testRoboflowAPI() {
  console.log('🧪 Testing Roboflow API...\n');
  console.log('API Key:', API_KEY ? '✓ Present' : '✗ Missing');
  console.log('Image URL:', TEST_IMAGE_URL);
  console.log('Workspace:', WORKSPACE);
  console.log('Model ID:', MODEL_ID);
  console.log('\n---\n');

  try {
    const requestBody = {
      api_key: API_KEY,
      inputs: {
        image: {
          type: 'url',
          value: TEST_IMAGE_URL,
        },
      },
    };

    console.log('📤 Sending request to Roboflow...');
    console.log('URL: https://serverless.roboflow.com/' + WORKSPACE + '/workflows/' + MODEL_ID);
    console.log('Body:', JSON.stringify(requestBody, null, 2));
    console.log('\n---\n');

    const response = await fetch(
      `https://serverless.roboflow.com/${WORKSPACE}/workflows/${MODEL_ID}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('📥 Response received:');
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('\n---\n');

    const result = await response.json();
    console.log('✅ Full Response JSON:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n---\n');

    // Try to find predictions in different possible locations
    console.log('🔍 Looking for predictions in response...\n');

    if (result.outputs) {
      console.log('✓ Found result.outputs');
      console.log('  outputs[0]:', JSON.stringify(result.outputs[0], null, 2));
    }

    if (result.predictions) {
      console.log('✓ Found result.predictions');
      console.log('  predictions:', JSON.stringify(result.predictions, null, 2));
    }

    if (result.detections) {
      console.log('✓ Found result.detections');
      console.log('  detections:', JSON.stringify(result.detections, null, 2));
    }

    if (result.results) {
      console.log('✓ Found result.results');
      console.log('  results:', JSON.stringify(result.results, null, 2));
    }

    // Check all top-level keys
    console.log('\n📋 All top-level keys in response:');
    Object.keys(result).forEach((key) => {
      console.log(`  - ${key}: ${typeof result[key]}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testRoboflowAPI();
