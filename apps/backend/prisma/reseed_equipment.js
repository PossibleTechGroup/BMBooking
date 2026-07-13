const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Reseeding Equipment from Admin Screenshot...');

  const equipment = [
    {
      name: "Philips ClearVue Ultrasound",
      category: "ULTRASOUND",
      hospitalName: "Zewditu Memorial Hospital",
      hospitalPhone: "+251111551234",
      address: "Addis Ababa, Filwoha St",
      city: "Addis Ababa",
      latitude: 9.0160,
      longitude: 38.7404,
      description: "High-resolution imaging for abdominal and OB/GYN exams.",
      isOperational: true
    },
    {
      name: "GE Revolution CT",
      category: "CT_SCAN",
      hospitalName: "St. Paul's Hospital",
      hospitalPhone: "+251112750125",
      address: "Addis Ababa, Swaziland St",
      city: "Addis Ababa",
      latitude: 9.0196,
      longitude: 38.7539,
      description: "Fast, high-definition 64-slice CT scanning.",
      isOperational: true
    },
    {
      name: "Siemens Magnetom MRI",
      category: "MRI",
      hospitalName: "Black Lion Hospital",
      hospitalPhone: "+251111550000",
      address: "Addis Ababa, Tichet St",
      city: "Addis Ababa",
      latitude: 9.0153,
      longitude: 38.7546,
      description: "State-of-the-art 3T MRI for specialized neuro and cardiac imaging.",
      isOperational: true
    }
  ];

  for (const item of equipment) {
    await prisma.medicalEquipment.create({ data: item });
  }

  console.log('✅ Equipment reseeded successfully!');
}

main();
