import prisma from "../../../config/database";
import { getNextDailySequence } from "../../services/atomicSequence.service";

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

  // Generate atomic sequential order barcode
  const seqResult = await getNextDailySequence("ORD");
  const barcode = seqResult.formattedCode;

  // Update order with new barcode
  await prisma.order.update({
    where: { id: orderId },
    data: { barcode },
  });

  return barcode;
};

/**
 * Solves Bug 5.1: Sample ID / Barcode Collision Under High Concurrency.
 * Uses atomic PostgreSQL daily sequence generator. Zero collision under concurrent load.
 */
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

  // Atomic PostgreSQL daily sequence upsert (SMP-YYYYMMDD-XXXXX)
  const seqResult = await getNextDailySequence("SMP");
  const barcode = seqResult.formattedCode;

  await prisma.sample.update({
    where: { id: sampleId },
    data: {
      barcode,
      sampleNumber: barcode,
    },
  });

  // Calculate Checksum for validation logging (Level 1 Audit)
  const checksum = calculateCode128Checksum(barcode);
  console.log(`[Atomic Barcode Generator] Barcode: ${barcode}, Code128 Checksum: ${checksum}`);

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

  // ISS-010: Check if it's a patient UHID barcode.
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
  return {
    barcode,
    format,
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
    const seq = await getNextDailySequence("ORD");
    barcode = seq.formattedCode;

    await prisma.order.update({
      where: { id: entityId },
      data: { barcode },
    });
  } else if (entityType === 'SAMPLE') {
    const seq = await getNextDailySequence("SMP");
    barcode = seq.formattedCode;

    await prisma.sample.update({
      where: { id: entityId },
      data: {
        barcode,
        sampleNumber: barcode,
      },
    });
  } else {
    throw new Error("Invalid entity type");
  }

  return barcode;
};
