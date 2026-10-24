import { UserRole } from "@prisma/client";
import prisma from "../../../config/database";
import { createAuditLog } from "../audit/audit.service";
import { HttpError } from "../../utils/http-error";
import { WebSocketService } from "../../lib/websocket";
import {
  signResultWithElectronicSeal,
  verifyResultSignature,
  getDoctorSealInfo,
} from "./digital-signature.service";

// =======================================================
// GET APPROVAL METRICS
// =======================================================

export const getApprovalMetrics = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    pendingApproval,
    criticalValues,
    approvedToday,
    rejectedRerun,
  ] = await Promise.all([
    // Count pending approvals (VERIFIED and ENTERED status for workflow flexibility)
    prisma.result.count({
      where: {
        status: { in: ["VERIFIED", "ENTERED"] },
      },
    }),

    // Count results with critical values
    prisma.resultValue.count({
      where: {
        flag: "CRITICAL",
        result: {
          status: { in: ["VERIFIED", "ENTERED"] },
        },
      },
    }),

    // Count results approved today
    prisma.result.count({
      where: {
        status: "APPROVED",
        approvedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),

    // Count rejected results (ENTERED status after being sent back)
    prisma.result.count({
      where: {
        status: "ENTERED",
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    }),
  ]);

  return {
    pendingApproval,
    criticalValues,
    approvedToday,
    rejectedRerun,
  };
};

// =======================================================
// GET PENDING APPROVALS
// =======================================================

export const getPendingApprovals = async (
  options: any
) => {
  const {
    orderId,
    search,
    status,
    filter,
    hasCritical,
    department,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = options;

  // Auto-heal: Ensure any recently registered orders without results get pending result records
  try {
    const ordersWithoutResults = await prisma.order.findMany({
      where: {
        results: { none: {} },
      },
      include: {
        items: {
          include: {
            test: {
              include: { parameters: true },
            },
          },
        },
      },
      take: 25,
    });

    for (const ord of ordersWithoutResults) {
      for (const it of ord.items) {
        if (!it.testId) continue;
        const exists = await prisma.result.findUnique({
          where: { orderId_testId: { orderId: ord.id, testId: it.testId } },
        });
        if (!exists) {
          await prisma.result.create({
            data: {
              orderId: ord.id,
              testId: it.testId,
              patientId: ord.patientId,
              status: "PENDING",
              enteredAt: new Date(),
              values: {
                create: (it.test?.parameters || []).map((p: any) => ({
                  parameterId: p.id,
                  value: "",
                  flag: "NORMAL",
                })),
              },
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("Auto-sync missing results error:", err);
  }

  const skip =
    (page - 1) * limit;

  const where: any = {};

  // Status filtering:
  // If user searched for a patient, OR status === "ALL", OR filter === "pipeline",
  // we do NOT restrict strictly to VERIFIED, so newly registered patients are immediately found!
  if (status && status !== "ALL") {
    where.status = status;
  } else if (!status && !search && filter !== "pipeline") {
    // Default approval queue shows results verified by lab tech
    // TEMPORARY FIX: Also show ENTERED results to help users see their completed results
    where.status = { in: ["VERIFIED", "ENTERED"] };
  } else if (filter === "pipeline") {
    // Show all active pipeline results (pending entry, entered, verified)
    where.status = { in: ["PENDING", "ENTERED", "VERIFIED"] };
  }

  // Critical / Normal filters
  if (filter === "critical" || hasCritical === "true" || hasCritical === true) {
    where.values = {
      some: {
        flag: "CRITICAL",
      },
    };
  } else if (filter === "normal") {
    where.values = {
      none: {
        flag: { in: ["HIGH", "LOW", "CRITICAL"] },
      },
    };
  } else if (filter === "abnormal") {
    where.values = {
      some: {
        flag: { in: ["HIGH", "LOW"] },
      },
    };
  }

  // Department filtering
  if (department) {
    where.test = {
      OR: [
        { processingDepartment: { contains: department, mode: "insensitive" } },
        { category: { department: { contains: department, mode: "insensitive" } } },
      ],
    };
  }

  if (orderId) {
    where.orderId = orderId;
  }

  // Search across patient name, order number, test name, result ID
  if (search) {
    where.OR = [
      {
        order: {
          patient: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { uhid: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      },
      {
        order: {
          orderNumber: { contains: search, mode: "insensitive" },
        },
      },
      {
        order: {
          barcode: { contains: search, mode: "insensitive" },
        },
      },
      {
        test: {
          testName: { contains: search, mode: "insensitive" },
        },
      },
      {
        test: {
          testCode: { contains: search, mode: "insensitive" },
        },
      },
      {
        id: { contains: search, mode: "insensitive" },
      },
    ];
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo);
    }
  }

  const [
    results,
    total,
  ] = await Promise.all([
    prisma.result.findMany({
      where,

      skip,
      take: limit,

      include: {
        test: {
          include: {
            category: true,
            parameters: true,
          },
        },

        values: {
          include: {
            parameter: {
              include: {
                referenceRanges: true,
              },
            },
          },
        },

        criticalAcknowledgments: {
          include: {
            acknowledgedByUser: {
              select: {
                fullName: true,
                employeeCode: true,
              },
            },
          },
        },

        order: {
          include: {
            patient: true,
            doctor: true,
            samples: true,
          },
        },

        enteredBy: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            role: true,
          },
        },

        approvedBy: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            role: true,
            signature: true,
            designation: true,
            specialization: true,
          },
        },
      },

      orderBy: [
        { status: "asc" },
        { verifiedAt: "asc" },
      ],
    }),

    prisma.result.count({
      where,
    }),
  ]);

  return {
    results,

    pagination: {
      page,
      limit,
      total,

      totalPages:
        Math.ceil(
          total / limit
        ),

      hasNextPage:
        page * limit < total,

      hasPreviousPage:
        page > 1,
    },
  };
};

// =======================================================
// GET APPROVAL DETAIL
// =======================================================

export const getApprovalById =
  async (id: string) => {
    const result =
      await prisma.result.findUnique({
        where: {
          id,
        },

        include: {
          test: {
            include: {
              parameters: {
                include: {
                  referenceRanges: true,
                },
              },
            },
          },

          values: {
            include: {
              parameter: true,
            },
          },

          order: {
            include: {
              patient: true,
              doctor: true,
              items: {
                include: {
                  test: true,
                },
              },
              samples: {
                include: {
                  test: true,
                },
              },
            },
          },

          enteredBy: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              role: true,
            },
          },

          approvedBy: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              role: true,
              signature: true,
              specialization: true,
              designation: true,
            },
          },
        },
      });

    if (!result) {
      throw new Error(
        "Approval record not found"
      );
    }

    return result;
  };

// =======================================================
// APPROVE RESULT
// =======================================================

export const approve =
  async (
    id: string,
    approvedById: string,
    options?: { ipAddress?: string; userAgent?: string; reason?: string }
  ) => {
    const user = await prisma.user.findUnique({ where: { id: approvedById } });
    if (!user || user.status !== "ACTIVE") {
      throw new HttpError("User account not found or inactive", 403);
    }

    const authorizedRoles: string[] = [
      UserRole.PATHOLOGIST,
      UserRole.ADMIN,
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_ADMIN,
      UserRole.DOCTOR,
    ];

    if (!authorizedRoles.includes(user.role)) {
      throw new HttpError(
        "Only active pathologists and authorized laboratory administrators can approve diagnostic results",
        403
      );
    }

    if (user.role === UserRole.PATHOLOGIST) {
      const doctor = await prisma.doctor.findFirst({
        where: {
          OR: [
            { email: user.email },
            { phone: user.phone },
            { doctorCode: user.employeeCode },
          ],
          isActive: true,
        },
      });
      if (doctor && !doctor.registrationNumber) {
        throw new HttpError(
          "Pathologist profile must have a valid medical council registration number to approve diagnostic results",
          403
        );
      }
    }

    const result =
      await prisma.result.findUnique({
        where: {
          id,
        },

        include: {
          values: true,
        },
      });

    if (!result) {
      throw new Error(
        "Result not found"
      );
    }

    if (
      !["VERIFIED", "ENTERED"].includes(result.status)
    ) {
      throw new Error(
        "Only VERIFIED or ENTERED results can be approved"
      );
    }

    if (
      result.values.length === 0
    ) {
      throw new Error(
        "Cannot approve result without result values"
      );
    }

    const approved =
      await prisma.result.update({
        where: {
          id,
        },

        data: {
          status: "APPROVED",

          approvedById,

          approvedAt: new Date(),
        },

        include: {
          test: true,

          values: {
            include: {
              parameter: true,
            },
          },

          order: {
            include: {
              patient: true,
              doctor: true,
            },
          },

          approvedBy: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              role: true,
              signature: true,
              specialization: true,
              designation: true,
            },
          },
        },
      });

    // Create audit log
    await createAuditLog({
      userId: approvedById,
      module: "APPROVALS",
      action: "APPROVE_RESULT",
      recordId: id,
      oldData: { status: result.status },
      newData: { status: "APPROVED", approvedById, approvedAt: new Date() },
    });

    // =======================================================
    // 7-STAGE SPECIMEN STATE MACHINE & ORDER AUTO-COMPLETION
    // =======================================================
    if (result.orderId) {
      try {
        const orderId = result.orderId;

        // 1. Record SampleTrackingHistory for this approved result
        const sample = await prisma.sample.findFirst({
          where: { orderId, testId: result.testId },
        });

        if (sample) {
          await prisma.sampleTrackingHistory.create({
            data: {
              sampleId: sample.id,
              orderId,
              patientId: sample.patientId,
              eventType: "RESULT_APPROVED" as any,
              status: "APPROVED",
              notes: `Pathologist signed off results for test: ${result.testId}`,
              performedById: approvedById,
              performedAt: new Date(),
            },
          });
        }

        // 2. Check if all results for this order are now approved or published
        const unapprovedCount = await prisma.result.count({
          where: {
            orderId,
            status: { notIn: ["APPROVED", "PUBLISHED"] },
          },
        });

        if (unapprovedCount === 0) {
          // All test results are approved! Transition order to COMPLETED
          await prisma.order.update({
            where: { id: orderId },
            data: {
              orderStatus: "COMPLETED" as any,
              reportedAt: new Date(),
            },
          });

          // Transition samples to COMPLETED
          await prisma.sample.updateMany({
            where: { orderId },
            data: {
              status: "COMPLETED" as any,
              completedAt: new Date(),
            },
          });

          if (sample) {
            await prisma.sampleTrackingHistory.create({
              data: {
                sampleId: sample.id,
                orderId,
                patientId: sample.patientId,
                eventType: "SAMPLE_COMPLETED" as any,
                status: "COMPLETED",
                notes: "Diagnostic order and all tests completed. Final NABL report available.",
                performedById: approvedById,
                performedAt: new Date(),
              },
            });
          }

          // 3. Automated ABDM Care-Context notification if patient has ABHA
          const patient = (approved as any).order?.patient;
          if (patient && (patient.abhaAddress || patient.abhaNumber)) {
            try {
              const { notifyCareContextAddition } = require("../abdm/hip.service");
              await notifyCareContextAddition(patient.id, orderId);
            } catch (abdmErr) {
              console.warn("[Approvals] ABDM care context notify non-fatal:", abdmErr);
            }
          }
        }
      } catch (lifecycleErr) {
        console.warn("[Approvals] Post-approval state machine non-fatal error:", lifecycleErr);
      }
    }

    // =======================================================
    // DIGITAL SIGNATURE & NABL ELECTRONIC DOCTOR SEAL
    // =======================================================
    try {
      const signatureResult = await signResultWithElectronicSeal({
        resultId: id,
        userId: approvedById,
        reason: options?.reason || "Diagnostic result certified and signed off by authorized pathologist",
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
      });
      (approved as any).digitalSignature = signatureResult;
    } catch (sigErr: any) {
      console.warn(`[Approvals] Digital signature creation warning for result ${id}:`, sigErr?.message || sigErr);
    }

    // ── Real-time WebSocket: Approval Sign-Off Broadcast ────────────
    try {
      const pat = (approved as any).order?.patient;
      const doc = (approved as any).approvedBy;
      WebSocketService.broadcastApprovalSignOff({
        approvalId:  approved.id,
        orderId:     approved.orderId,
        orderNumber: (approved as any).order?.orderNumber || '',
        patientName: pat ? `${pat.firstName} ${pat.lastName}`.trim() : '',
        doctorName:  doc?.fullName || user.fullName || 'Pathologist',
        status:      'APPROVED',
        timestamp:   new Date().toISOString(),
      });
      // Trigger dashboard KPI update
      WebSocketService.broadcastDashboardKpiUpdate({ pendingApprovals: -1 });
    } catch (wsErr) {
      // WebSocket broadcast is non-critical — never block the approval
      console.warn('[Approvals] WS broadcast non-fatal:', wsErr);
    }

    return approved;
  };

// =======================================================
// REJECT / SEND BACK RESULT
// =======================================================

export const reject =
  async (
    id: string,
    remarks: string,
    rejectedById?: string
  ) => {
    const result =
      await prisma.result.findUnique({
        where: {
          id,
        },
      });

    if (!result) {
      throw new Error(
        "Result not found"
      );
    }

    if (
      !["VERIFIED", "ENTERED"].includes(result.status)
    ) {
      throw new Error(
        "Only VERIFIED or ENTERED results can be sent back"
      );
    }

    const updated =
      await prisma.result.update({
        where: {
          id,
        },

        data: {
          status: "ENTERED",

          remarks,
          
          // Track rejection information
          approvedById: rejectedById,
          approvedAt: new Date(),
        },

        include: {
          test: true,

          values: {
            include: {
              parameter: true,
            },
          },

          order: {
            include: {
              patient: true,
            },
          },

          approvedBy: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              role: true,
            },
          },
        },
      });

    // Create audit log
    await createAuditLog({
      userId: rejectedById,
      module: "APPROVALS",
      action: "REJECT_RESULT",
      recordId: id,
      oldData: { status: result.status },
      newData: { status: "ENTERED", remarks, approvedById: rejectedById, approvedAt: new Date() },
    });

    return updated;
  };

// =======================================================
// PUBLISH APPROVED RESULT
// =======================================================

export const publish =
  async (id: string) => {
    const result =
      await prisma.result.findUnique({
        where: {
          id,
        },
      });

    if (!result) {
      throw new Error(
        "Result not found"
      );
    }

    if (
      result.status !== "APPROVED"
    ) {
      throw new Error(
        "Only APPROVED results can be published"
      );
    }

    const published = await prisma.result.update({
      where: {
        id,
      },

      data: {
        status: "PUBLISHED",

        publishedAt: new Date(),
      },
    });

    // Create audit log
    await createAuditLog({
      module: "APPROVALS",
      action: "PUBLISH_RESULT",
      recordId: id,
      oldData: { status: result.status },
      newData: { status: "PUBLISHED", publishedAt: new Date() },
    });

    return published;
  };

// =======================================================
// BATCH APPROVE RESULTS
// =======================================================

export const batchApprove = async (
  ids: string[],
  approvedById: string,
  remarks?: string,
  options?: { ipAddress?: string; userAgent?: string }
) => {
  const user = await prisma.user.findUnique({ where: { id: approvedById } });
  if (!user || user.status !== "ACTIVE") {
    throw new HttpError("User account not found or inactive", 403);
  }

  const authorizedRoles: string[] = [
    UserRole.PATHOLOGIST,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.BRANCH_ADMIN,
    UserRole.DOCTOR,
  ];

  if (!authorizedRoles.includes(user.role)) {
    throw new HttpError(
      "Only active pathologists and authorized laboratory administrators can approve diagnostic results",
      403
    );
  }

  if (user.role === UserRole.PATHOLOGIST) {
    const doctor = await prisma.doctor.findFirst({
      where: {
        OR: [
          { email: user.email },
          { phone: user.phone },
          { doctorCode: user.employeeCode },
        ],
        isActive: true,
      },
    });
    if (doctor && !doctor.registrationNumber) {
      throw new HttpError(
        "Pathologist profile must have a valid medical council registration number to approve diagnostic results",
        403
      );
    }
  }
  if (!ids || ids.length === 0) {
    throw new Error("No result IDs provided for batch approval");
  }

  // Fetch all target results with values and critical acknowledgments
  const results = await prisma.result.findMany({
    where: {
      id: { in: ids },
    },
    include: {
      values: true,
      criticalAcknowledgments: true,
    },
  });

  const approvableIds: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const res of results) {
    if (!["VERIFIED", "ENTERED"].includes(res.status)) {
      skipped.push({ id: res.id, reason: `Status is ${res.status}, must be VERIFIED or ENTERED` });
      continue;
    }
    if (!res.values || res.values.length === 0) {
      skipped.push({ id: res.id, reason: "No result values present" });
      continue;
    }
    const hasCritical = res.values.some((v: any) => v.flag === "CRITICAL");
    const hasCriticalAck = res.criticalAcknowledgments && res.criticalAcknowledgments.length > 0;

    if (hasCritical && !hasCriticalAck) {
      skipped.push({
        id: res.id,
        reason: "Contains unacknowledged critical/panic values. Doctor call log required before approval.",
      });
      continue;
    }

    approvableIds.push(res.id);
  }

  if (approvableIds.length === 0) {
    return {
      success: false,
      approvedCount: 0,
      skipped,
      message: "No results qualified for batch approval",
    };
  }

  const now = new Date();

  await prisma.$transaction(
    approvableIds.map((id) =>
      prisma.result.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById,
          approvedAt: now,
          remarks: remarks || undefined,
        },
      })
    )
  );

  // Audit log for batch
  await createAuditLog({
    userId: approvedById,
    module: "APPROVALS",
    action: "BATCH_APPROVE_RESULTS",
    recordId: approvableIds.join(","),
    newData: { count: approvableIds.length, approvedIds: approvableIds, remarks },
  });

  // Lifecycle advance for completed orders in batch
  try {
    const batchResults = await prisma.result.findMany({
      where: { id: { in: approvableIds } },
      select: { orderId: true, testId: true },
    });
    const orderIds = Array.from(new Set(batchResults.map((r) => r.orderId).filter(Boolean))) as string[];

    for (const ordId of orderIds) {
      const remaining = await prisma.result.count({
        where: {
          orderId: ordId,
          status: { notIn: ["APPROVED", "PUBLISHED"] },
        },
      });

      if (remaining === 0) {
        await prisma.order.update({
          where: { id: ordId },
          data: {
            orderStatus: "COMPLETED" as any,
            reportedAt: new Date(),
          },
        });

        await prisma.sample.updateMany({
          where: { orderId: ordId },
          data: {
            status: "COMPLETED" as any,
            completedAt: new Date(),
          },
        });
      }
    }
  } catch (batchLifecycleErr) {
    console.warn("[Approvals] Batch lifecycle advance non-fatal:", batchLifecycleErr);
  }

  // Sign all approved results with digital signature & seal
    const signedSignatures: Array<{ resultId: string; signatureHash: string }> = [];
    for (const approvableId of approvableIds) {
      try {
        const sig = await signResultWithElectronicSeal({
          resultId: approvableId,
          userId: approvedById,
          reason: remarks || "Batch certified and approved by authorized pathologist",
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
        });
        signedSignatures.push({
          resultId: approvableId,
          signatureHash: sig.signatureHash,
        });
      } catch (batchSigErr: any) {
        console.warn(`[BatchApprove] Digital seal signing error for ${approvableId}:`, batchSigErr?.message || batchSigErr);
      }
    }

    return {
      success: true,
      approvedCount: approvableIds.length,
      approvedIds: approvableIds,
      signedSignatures,
      skipped,
    };
  };

// =======================================================
// RECORD CRITICAL / PANIC CALL ACKNOWLEDGMENT
// =======================================================

export const recordCriticalAck = async (
  resultId: string,
  data: {
    notifiedPerson: string;
    notifiedPersonContact?: string;
    notificationMode?: string;
    notificationTime?: string;
    notes?: string;
    readBackConfirmed?: boolean;
  },
  userId: string
) => {
  const result = await prisma.result.findUnique({
    where: { id: resultId },
  });

  if (!result) {
    throw new Error("Result record not found");
  }

  const ack = await prisma.criticalValueAcknowledgment.create({
    data: {
      resultId,
      acknowledgedBy: userId,
      notifiedPerson: data.notifiedPerson,
      notifiedPersonContact: data.notifiedPersonContact || null,
      notificationMode: data.notificationMode || "PHONE",
      notificationTime: data.notificationTime ? new Date(data.notificationTime) : new Date(),
      notes: data.notes || null,
      acknowledgmentReason: data.readBackConfirmed
        ? "Verbal read-back confirmation received from recipient"
        : "Direct verbal notification completed",
    },
    include: {
      acknowledgedByUser: {
        select: {
          fullName: true,
          employeeCode: true,
        },
      },
    },
  });

  await createAuditLog({
    userId,
    module: "APPROVALS",
    action: "CRITICAL_VALUE_ACKNOWLEDGED",
    recordId: resultId,
    newData: { ackId: ack.id, notifiedPerson: data.notifiedPerson },
  });

  return ack;
};

// =======================================================
// GET HISTORICAL DELTA CHECK TREND
// =======================================================

export const getHistoricalTrend = async (resultId: string) => {
  const currentResult = await prisma.result.findUnique({
    where: { id: resultId },
    include: {
      order: {
        include: {
          patient: true,
        },
      },
      test: true,
      values: {
        include: {
          parameter: {
            include: {
              referenceRanges: true,
            },
          },
        },
      },
    },
  });

  if (!currentResult) {
    throw new Error("Result not found");
  }

  const patientId = currentResult.order?.patientId || currentResult.patientId;

  if (!patientId) {
    return {
      currentResultId: resultId,
      patient: currentResult.order?.patient,
      parameters: currentResult.values.map((v: any) => ({
        parameterId: v.parameterId,
        parameterName: v.parameter?.parameterName,
        currentValue: v.value,
        unit: v.parameter?.unit,
        flag: v.flag,
        history: [],
      })),
    };
  }

  // Find up to 5 prior completed/approved results for the same patient
  const priorResults = await prisma.result.findMany({
    where: {
      id: { not: resultId },
      OR: [
        { patientId },
        { order: { patientId } },
      ],
      status: { in: ["APPROVED", "PUBLISHED", "VERIFIED"] },
    },
    include: {
      values: {
        include: {
          parameter: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const parametersTrend = currentResult.values.map((curVal: any) => {
    const history: Array<{
      resultId: string;
      date: Date;
      value: string;
      numericValue: number | null;
      deltaPercent: number | null;
      flag: string | null;
    }> = [];

    const curNum = parseFloat(curVal.value);

    for (const prior of priorResults) {
      const matchingVal = prior.values.find(
        (pv: any) => pv.parameterId === curVal.parameterId
      );

      if (matchingVal) {
        const priorNum = parseFloat(matchingVal.value);
        let deltaPercent: number | null = null;
        if (!isNaN(curNum) && !isNaN(priorNum) && priorNum !== 0) {
          deltaPercent = Math.round(((curNum - priorNum) / priorNum) * 100);
        }

        history.push({
          resultId: prior.id,
          date: prior.createdAt,
          value: matchingVal.value,
          numericValue: isNaN(priorNum) ? null : priorNum,
          deltaPercent,
          flag: matchingVal.flag,
        });
      }
    }

    return {
      parameterId: curVal.parameterId,
      parameterName: curVal.parameter?.parameterName || "Parameter",
      currentValue: curVal.value,
      unit: curVal.parameter?.unit || "",
      flag: curVal.flag,
      referenceRanges: curVal.parameter?.referenceRanges || [],
      latestPrior: history[0] || null,
      history,
    };
  });

  return {
    currentResultId: resultId,
    patient: currentResult.order?.patient,
    testName: currentResult.test?.testName,
    parameters: parametersTrend,
  };
};

// =======================================================
// DIGITAL SIGNATURE VERIFICATION
// =======================================================

export const getApprovalSignature = async (resultId: string) => {
  return verifyResultSignature(resultId);
};

export const verifyApprovalSignature = async (resultId: string) => {
  return verifyResultSignature(resultId);
};