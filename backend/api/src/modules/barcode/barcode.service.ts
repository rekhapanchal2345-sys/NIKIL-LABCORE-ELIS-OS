import prisma from "../../../config/database";

// =======================================================
// CODE 128 CHECKSUM (Modulo 103)
// =======================================================
export const calculateCode128Checksum = (data: string): number => {
  let sum = 104; // Start Code B
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    const value = charCode >= 32 ? charCode - 32 : charCode + 64; // standard mapping B
    sum += value * (i + 1);
  }
  return sum % 103;
};

// =======================================================
// BARCODE GENERATION SERVICE
// =======================================================

export const generateOrderBarcode = async (orderId: string): Promise<string> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // If barcode already exists, return it
  if (order.barcode) {
    return order.barcode;
  }

  // Generate new barcode with timestamp and random suffix
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  const barcode = `ORD-${timestamp}-${randomSuffix}`;

  // Update order with new barcode
  await prisma.order.update({
    where: { id: orderId },
    data: { barcode },
  });

  return barcode;
};

export const generateSampleBarcode = async (sampleId: string): Promise<string> => {
  const sample = await prisma.sample.findUnique({
    where: { id: sampleId },
  });

  if (!sample) {
    throw new Error("Sample not found");
  }

  // If barcode already exists, return it
  if (sample.barcode) {
    return sample.barcode;
  }

  // Generate YYYYMMDD
  const dateStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }).split(",")[0];
  const d = new Date(dateStr);
  const yyyy = d.getFullYear().toString();
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const prefix = `SMP-${yyyy}${mm}${dd}`;

  // Atomic retry loop for uniqueness
  let barcode = "";
  let maxRetries = 10;
  
  while (maxRetries > 0) {
    try {
      const todayCount = await prisma.sample.count({
        where: { barcode: { startsWith: `${prefix}-` } },
      });
      const seq = (todayCount + (11 - maxRetries)).toString().padStart(5, "0");
      barcode = `${prefix}-${seq}`;

      // Update sample with new barcode (will fail if not unique)
      await prisma.sample.update({
        where: { id: sampleId },
        data: { barcode },
      });
      break;
    } catch (err: any) {
      if (err.code === "P2002") { // Unique constraint violation
        maxRetries--;
        continue;
      }
      throw err;
    }
  }

  if (maxRetries === 0) {
    throw new Error("Failed to generate unique sample barcode after multiple attempts.");
  }

  // Calculate Checksum for validation logging (Level 1 Audit)
  const checksum = calculateCode128Checksum(barcode);
  console.log(`Generated Barcode: ${barcode}, Code128 Checksum: ${checksum}`);

  return barcode;
};

export const generatePatientBarcode = async (patientId: string): Promise<string> => {
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
  });

  if (!patient) {
    throw new Error("Patient not found");
  }

  // Use UHID as patient barcode
  return patient.uhid;
};

export const validateBarcode = async (barcode: string): Promise<{
  type: 'ORDER' | 'SAMPLE' | 'PATIENT' | 'INVALID';
  data?: any;
}> => {
  // Check if it's an order barcode
  if (barcode.startsWith('ORD-')) {
    const order = await prisma.order.findUnique({
      where: { barcode },
      include: {
        patient: true,
        items: {
          include: {
            test: true,
          },
        },
      },
    });

    if (order) {
      return {
        type: 'ORDER',
        data: order,
      };
    }
  }

  // Check if it's a sample barcode
  if (barcode.startsWith('SMP-')) {
    const sample = await prisma.sample.findUnique({
      where: { barcode },
      include: {
        order: {
          include: {
            patient: true,
          },
        },
        test: true,
      },
    });

    if (sample) {
      return {
        type: 'SAMPLE',
        data: sample,
      };
    }
  }

  // Check if it's a patient UHID
  if (barcode.startsWith('UHID-') || barcode.startsWith('LC-')) {
    const patient = await prisma.patient.findUnique({
      where: { uhid: barcode },
    });

    if (patient) {
      return {
        type: 'PATIENT',
        data: patient,
      };
    }
  }

  return {
    type: 'INVALID',
  };
};

export const generateBarcodeData = (barcode: string, format: 'CODE128' | 'QR' | 'DATAMATRIX' = 'CODE128') => {
  // This would integrate with a barcode generation library
  // For now, we'll return the basic structure
  return {
    barcode,
    format,
    // In a real implementation, this would generate the actual barcode image/data
    // Using libraries like bwip-js, qrcode, etc.
  };
};

export const getBarcodePrintData = async (barcode: string) => {
  const validation = await validateBarcode(barcode);

  if (validation.type === 'INVALID') {
    throw new Error("Invalid barcode");
  }

  let printData: any = {
    barcode,
    type: validation.type,
    generatedAt: new Date().toISOString(),
  };

  if (validation.type === 'ORDER') {
    const order = validation.data;
    printData = {
      ...printData,
      orderNumber: order.orderNumber,
      patientName: [order.patient?.title, order.patient?.firstName, order.patient?.middleName, order.patient?.lastName].filter(Boolean).join(' ').trim() || 'Patient',
      patientUHID: order.patient.uhid,
      tests: order.items.map((item: any) => item.test?.testName).filter(Boolean).join(', '),
      priority: order.priority,
      collectionType: order.collectionType,
    };
  } else if (validation.type === 'SAMPLE') {
    const sample = validation.data;
    printData = {
      ...printData,
      sampleNumber: sample.sampleNumber,
      patientName: [sample.order?.patient?.title, sample.order?.patient?.firstName, sample.order?.patient?.middleName, sample.order?.patient?.lastName].filter(Boolean).join(' ').trim() || 'Patient',
      patientUHID: sample.order.patient.uhid,
      testName: sample.test.testName,
      sampleType: sample.sampleType,
      status: sample.status,
    };
  } else if (validation.type === 'PATIENT') {
    const patient = validation.data;
    printData = {
      ...printData,
      uhid: patient.uhid,
      patientName: [patient.title, patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ').trim() || 'Patient',
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
    };
  }

  return printData;
};

export const generateBatchBarcodes = async (orderIds: string[]): Promise<string[]> => {
  const barcodes: string[] = [];

  for (const orderId of orderIds) {
    try {
      const barcode = await generateOrderBarcode(orderId);
      barcodes.push(barcode);
    } catch (error) {
      console.error(`Failed to generate barcode for order ${orderId}:`, error);
    }
  }

  return barcodes;
};

export const regenerateBarcode = async (entityType: 'ORDER' | 'SAMPLE', entityId: string): Promise<string> => {
  let barcode: string;

  if (entityType === 'ORDER') {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    barcode = `ORD-${timestamp}-${randomSuffix}`;

    await prisma.order.update({
      where: { id: entityId },
      data: { barcode },
    });
  } else if (entityType === 'SAMPLE') {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    barcode = `SMP-${timestamp}-${randomSuffix}`;

    await prisma.sample.update({
      where: { id: entityId },
      data: { barcode },
    });
  } else {
    throw new Error("Invalid entity type");
  }

  return barcode;
};