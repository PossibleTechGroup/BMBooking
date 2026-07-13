const CHAPA_SECRET_KEY = 'CHASECK_TEST-m61vBeBz6nMfBFMIz9qBZnWJVUTFEaCr';

async function testChapa() {
  console.log('Testing Chapa Initialization...');
  try {
    const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'ETB',
        email: 'test@gmail.com',
        first_name: 'Test',
        last_name: 'User',
        tx_ref: 'test-node-' + Date.now(),
        return_url: 'https://chapa.co',
        customization: {
          title: 'Test Title',
          description: 'Test Description'
        }
      })
    });

    const result = await response.json();
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testChapa();
