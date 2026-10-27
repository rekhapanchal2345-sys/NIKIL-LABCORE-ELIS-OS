import prisma from "./api/config/database";
import { importCatalog } from "./api/src/modules/tests/test.service";
import * as crypto from "crypto";

async function run() {
  // Clean up
  await prisma.testPackageItem.deleteMany();
  await prisma.testPackage.deleteMany();
  await prisma.test.deleteMany();

  const testCodes = Array.from({ length: 1000 }, (_, i) => `TEST-${i}`);

  console.log("Creating tests...");
  await prisma.test.createMany({
    data: testCodes.map(code => ({
      testCode: code,
      testName: `Test ${code}`,
      sampleType: "BLOOD",
      price: 100,
    }))
  });

  const packages = Array.from({ length: 5 }, (_, i) => ({
    packageCode: `PKG-${i}`,
    packageName: `Test Package ${i}`,
    description: "Description",
    totalPrice: 1000,
    offerPrice: 900,
    isActive: true,
    items: testCodes.map((code, index) => ({
      test: { testCode: code },
      testPrice: 100,
      discount: 0,
      displayOrder: index
    }))
  }));

  console.log(`Testing importCatalog with ${packages.length} packages and ${testCodes.length} items each...`);

  const start = performance.now();
  await importCatalog({ packages });
  const end = performance.now();

  console.log(`Execution time: ${(end - start).toFixed(2)} ms`);

  await prisma.$disconnect();
  process.exit(0);
}

run().catch(console.error);
