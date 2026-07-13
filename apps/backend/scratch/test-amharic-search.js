const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const amharicHelper = require('../src/lib/amharicHelper');
const DoctorService = require('../src/services/doctor.service');
const EquipmentController = require('../src/controllers/equipment.controller');

async function testDoctorSearch(searchParams) {
  console.log(`\n🔍 [TEST] Searching Doctors with parameters: ${JSON.stringify(searchParams)}`);
  
  if (searchParams.name) {
    console.log(`   └─ Name Expanded Terms:`, amharicHelper.expandQuery(searchParams.name));
  }
  if (searchParams.specialty) {
    console.log(`   └─ Specialty Expanded Terms:`, amharicHelper.expandQuery(searchParams.specialty));
  }
  
  try {
    const results = await DoctorService.searchDoctors(searchParams);
    console.log(`   ✅ Found ${results.length} doctor(s):`);
    results.forEach(d => {
      console.log(`      - Full Profile:`, JSON.stringify(d, null, 2));
    });
  } catch (err) {
    console.error(`   ❌ Error searching doctors:`, err.message);
  }
}

async function testEquipmentSearch(searchParams) {
  console.log(`\n🔍 [TEST] Searching Equipment with parameters: ${JSON.stringify(searchParams)}`);
  
  if (searchParams.query) {
    console.log(`   └─ Query Expanded Terms:`, amharicHelper.expandQuery(searchParams.query));
  }
  
  // Mock req & res for equipment controller search
  const req = { query: searchParams };
  let responseData = null;
  const res = {
    status: function(code) {
      return this;
    },
    json: function(data) {
      responseData = data;
      return this;
    }
  };
  
  try {
    await EquipmentController.search(req, res);
    if (responseData && responseData.status === 'success') {
      const items = responseData.data;
      console.log(`   ✅ Found ${items.length} equipment item(s):`);
      items.forEach(e => {
        console.log(`      - Item: ${e.name} | Category: ${e.category} | Hospital: ${e.hospitalName} | City: ${e.city}`);
      });
    } else {
      console.error(`   ❌ Equipment search returned failure response:`, responseData);
    }
  } catch (err) {
    console.error(`   ❌ Error searching equipment:`, err.message);
  }
}

async function run() {
  console.log('🌱 Starting Amharic Query Search verification tests...');
  
  // 1. Doctor search with Amharic names
  await testDoctorSearch({ name: 'ዳዊት' }); // Should find Dawit
  await testDoctorSearch({ name: 'ዶ/ር ዳዊት' }); // Should find Dawit (with prefix)
  await testDoctorSearch({ name: 'ሄለን' }); // Should find Helen
  await testDoctorSearch({ name: 'ትግስት' }); // Should find Tigist
  
  // 2. Doctor search with Amharic specialties
  await testDoctorSearch({ specialty: 'ካርዲዮሎጂ' }); // Should find Cardiology doctor
  await testDoctorSearch({ specialty: 'ልብ' }); // Should find Cardiology doctor
  await testDoctorSearch({ specialty: 'ህፃናት' }); // Should find Pediatrics doctor
  
  // 3. Doctor search combining Amharic specialty and name
  await testDoctorSearch({ name: 'ዳዊት', specialty: 'ልብ' }); // Should find Dr. Dawit
  
  // 4. Equipment search with Amharic queries
  await testDoctorSearch({ name: 'Abebe' }); // Basic English query check
  
  // 5. Equipment search with Amharic names/categories
  await testEquipmentSearch({ query: 'ኤም አር አይ' }); // Should find Siemens Magnetom MRI (category MRI)
  await testEquipmentSearch({ query: 'ሲቲ ስካን' }); // Should find CT scan
  await testEquipmentSearch({ query: 'ጥቁር አንበሳ' }); // Should find Siemens Magnetom MRI (Black Lion Hospital)
  await testEquipmentSearch({ query: 'ጳውሎስ' }); // Should find GE Revolution CT (St. Paul Hospital)
  
  console.log('\n🏁 Verification tests completed.');
}

run()
  .catch(err => {
    console.error('Fatal test execution error:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
