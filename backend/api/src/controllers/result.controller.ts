import type {
  Request,
  Response,
  NextFunction,
} from "express";
import prisma from "../../config/database";

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
  };
};

type ResultValueInput = {
  parameterId: string;
  value: string;
  remark?: string | null;
};

type EnterResultBody = {
  orderId: string;
  testId: string;
  values: ResultValueInput[];
  remarks?: string | null;
  interpretation?: string | null;
};

type TestParameter = {
  id: string;
  parameterName: string;
  unit: any;
  dataType: string;
  displayOrder: number;
  isRequired: boolean;
  referenceRanges: Array<{
    id: string;
    gender: "MALE" | "FEMALE" | "OTHER" | null;
    minAge: number | null;
    maxAge: number | null;
    criticalLow: unknown;
    normalLow: unknown;
    normalHigh: unknown;
    criticalHigh: unknown;
    interpretation: string | null;
  }>;
};

type CalculatedResultValue = {
  parameter: any;
  value: string;
  flag: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | null;
  remark: string | null;
  interpretation: string | null;
};

const getUserId = (req: Request): string | undefined => {
  return (req as AuthenticatedRequest).user?.id;
};

const parseNumericValue = (
  value: string
): number | null => {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const numberValue = Number(normalized);

  if (
    !Number.isFinite(numberValue)
  ) {
    return null;
  }

  return numberValue;
};

const toNumber = (
  value: unknown
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
};

type CalculatedFlag =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

const calculateFlag = (
  value: number,
  range: {
    criticalLow: unknown;
    normalLow: unknown;
    normalHigh: unknown;
    criticalHigh: unknown;
  }
): CalculatedFlag => {
  const criticalLow = toNumber(
    range.criticalLow
  );

  const normalLow = toNumber(
    range.normalLow
  );

  const normalHigh = toNumber(
    range.normalHigh
  );

  const criticalHigh = toNumber(
    range.criticalHigh
  );

  /*
   * Panic / critical values:
   * <= criticalLow
   * >= criticalHigh
   */
  if (
    criticalLow !== null &&
    value <= criticalLow
  ) {
    return "CRITICAL";
  }

  if (
    criticalHigh !== null &&
    value >= criticalHigh
  ) {
    return "CRITICAL";
  }

  if (
    normalLow !== null &&
    value < normalLow
  ) {
    return "LOW";
  }

  if (
    normalHigh !== null &&
    value > normalHigh
  ) {
    return "HIGH";
  }

  return "NORMAL";
};

const calculateAgeInYears = (
  dateOfBirth: Date | null,
  storedAge: number | null
): number | null => {
  if (dateOfBirth) {
    const today = new Date();

    let age =
      today.getFullYear() -
      dateOfBirth.getFullYear();

    const monthDifference =
      today.getMonth() -
      dateOfBirth.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 &&
        today.getDate() <
          dateOfBirth.getDate())
    ) {
      age--;
    }

    return Math.max(age, 0);
  }

  return storedAge;
};

const getBestReferenceRange = (
  ranges: Array<{
    id: string;
    gender:
      | "MALE"
      | "FEMALE"
      | "OTHER"
      | null;
    minAge: number | null;
    maxAge: number | null;
    criticalLow: unknown;
    normalLow: unknown;
    normalHigh: unknown;
    criticalHigh: unknown;
    interpretation: string | null;
  }>,
  patientGender:
    | "MALE"
    | "FEMALE"
    | "OTHER",
  patientAge: number | null
) => {
  const matching = ranges.filter(
    (range) => {
      const genderMatches =
        range.gender === null ||
        range.gender === patientGender;

      const minAgeMatches =
        range.minAge === null ||
        patientAge === null ||
        patientAge >= range.minAge;

      const maxAgeMatches =
        range.maxAge === null ||
        patientAge === null ||
        patientAge <= range.maxAge;

      return (
        genderMatches &&
        minAgeMatches &&
        maxAgeMatches
      );
    }
  );

  if (matching.length === 0) {
    return null;
  }

  /*
   * Prefer:
   * 1. Exact gender over generic range
   * 2. Age-specific range over generic age range
   */
  matching.sort((a, b) => {
    const aGender =
      a.gender === patientGender ? 1 : 0;

    const bGender =
      b.gender === patientGender ? 1 : 0;

    if (aGender !== bGender) {
      return bGender - aGender;
    }

    const aAge =
      a.minAge !== null ||
      a.maxAge !== null
        ? 1
        : 0;

    const bAge =
      b.minAge !== null ||
      b.maxAge !== null
        ? 1
        : 0;

    return bAge - aAge;
  });

  return matching[0];
};

export const enterResult = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const body =
      req.body as EnterResultBody;

    if (!body.orderId) {
      res.status(400).json({
        success: false,
        message: "orderId is required.",
      });
      return;
    }

    if (!body.testId) {
      res.status(400).json({
        success: false,
        message: "testId is required.",
      });
      return;
    }

    if (
      !Array.isArray(body.values) ||
      body.values.length === 0
    ) {
      res.status(400).json({
        success: false,
        message:
          "At least one result value is required.",
      });
      return;
    }

    const order =
      await prisma.order.findUnique({
        where: {
          id: body.orderId,
        },

        select: {
          id: true,
          orderNumber: true,
          patient: {
            select: {
              id: true,
              gender: true,
              age: true,
              dateOfBirth: true,
            },
          },

          items: {
            where: {
              testId: body.testId,
            },
            select: {
              id: true,
              testId: true,
            },
          },
        },
      });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found.",
      });
      return;
    }

    if (order.items.length === 0) {
      res.status(400).json({
        success: false,
        message:
          "The selected test does not belong to this order.",
      });
      return;
    }

    const test =
      await prisma.test.findUnique({
        where: {
          id: body.testId,
        },

        select: {
          id: true,
          testCode: true,
          testName: true,

          parameters: {
            orderBy: {
              displayOrder: "asc",
            },

            select: {
              id: true,
              parameterName: true,
              unit: true,
              dataType: true,
              displayOrder: true,
              isRequired: true,

              referenceRanges: {
                select: {
                  id: true,
                  gender: true,
                  minAge: true,
                  maxAge: true,

                  criticalLow: true,
                  normalLow: true,
                  normalHigh: true,
                  criticalHigh: true,

                  interpretation: true,
                },
              },
            },
          },
        },
      });

    if (!test) {
      res.status(404).json({
        success: false,
        message: "Test not found.",
      });
      return;
    }

    const parameterMap = new Map(
      test.parameters.map((parameter: any) => [
        parameter.id,
        parameter,
      ])
    ) as Map<string, any>;

    const submittedParameterIds =
      body.values.map(
        (item) => item.parameterId
      );

    const uniqueParameterIds = [
      ...new Set(
        submittedParameterIds
      ),
    ];

    if (
      uniqueParameterIds.length !==
      submittedParameterIds.length
    ) {
      res.status(400).json({
        success: false,
        message:
          "A parameter cannot be submitted more than once.",
      });
      return;
    }

    for (const item of body.values) {
      if (!item.parameterId) {
        res.status(400).json({
          success: false,
          message:
            "Every result value requires parameterId.",
        });
        return;
      }

      if (
        typeof item.value !== "string" ||
        item.value.trim() === ""
      ) {
        res.status(400).json({
          success: false,
          message:
            `Value is required for parameter ${item.parameterId}.`,
        });
        return;
      }

      if (
        !parameterMap.has(item.parameterId)
      ) {
        res.status(400).json({
          success: false,
          message:
            `Parameter ${item.parameterId} does not belong to this test.`,
        });
        return;
      }
    }

    /*
     * Required parameter validation.
     */
    const submittedIds = new Set(
      submittedParameterIds
    );

    const missingRequiredParameters =
      test.parameters
        .filter(
          (parameter: any) =>
            parameter.isRequired &&
            !submittedIds.has(
              parameter.id
            )
        )
        .map(
          (parameter: any) =>
            parameter.parameterName
        );

    if (
      missingRequiredParameters.length > 0
    ) {
      res.status(400).json({
        success: false,
        message:
          "One or more required test parameters are missing.",
        missingParameters:
          missingRequiredParameters,
      });
      return;
    }

    const patientAge =
      calculateAgeInYears(
        order.patient.dateOfBirth,
        order.patient.age
      );

    const calculatedValues =
      body.values.map((item) => {
        const parameter =
          parameterMap.get(
            item.parameterId
          ) as any;

        if (!parameter) {
          throw new Error(
            "Parameter not found."
          );
        }

        /*
         * Only NUMERIC parameters can be
         * automatically compared against
         * numeric reference ranges.
         */
        if (
          (parameter as any).dataType !==
          "NUMERIC"
        ) {
          return {
            parameter,
            value: item.value.trim(),
            flag: null as
              | "LOW"
              | "NORMAL"
              | "HIGH"
              | "CRITICAL"
              | null,
            remark:
              item.remark?.trim() ||
              null,
            interpretation: null,
          };
        }

        const numericValue =
          parseNumericValue(
            item.value
          );

        if (numericValue === null) {
          throw new Error(
            `Parameter "${(parameter as any).parameterName}" requires a valid numeric value.`
          );
        }

        const range =
          getBestReferenceRange(
            (parameter as any).referenceRanges,
            order.patient.gender,
            patientAge
          );

        if (!range) {
          return {
            parameter,
            value: item.value.trim(),
            flag: null as
              | "LOW"
              | "NORMAL"
              | "HIGH"
              | "CRITICAL"
              | null,
            remark:
              item.remark?.trim() ||
              null,
            interpretation: null,
          };
        }

        const flag =
          calculateFlag(
            numericValue,
            range
          );

        return {
          parameter,
          value: item.value.trim(),
          flag,
          remark:
            item.remark?.trim() ||
            null,
          interpretation:
            range.interpretation,
        } as CalculatedResultValue;
      }) as CalculatedResultValue[];

    const hasCritical =
      calculatedValues.some(
        (item) =>
          item.flag === "CRITICAL"
      );

    const hasAbnormal =
      calculatedValues.some(
        (item) =>
          item.flag === "LOW" ||
          item.flag === "HIGH"
      );

    const interpretation =
      body.interpretation?.trim() ||
      calculatedValues
        .map(
          (item) =>
            item.interpretation
        )
        .filter(
          (
            value
          ): value is string =>
            Boolean(value)
        )
        .join(" ");

    const userId = getUserId(req);

    if (userId) {
      const user =
        await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            id: true,
          },
        });

      if (!user) {
        res.status(401).json({
          success: false,
          message:
            "Authenticated user was not found.",
        });
        return;
      }
    }

    const result =
      await prisma.$transaction(
        async (tx: any) => {
          const existing =
            await tx.result.findUnique({
              where: {
                orderId_testId: {
                  orderId: body.orderId,
                  testId: body.testId,
                },
              },
              select: {
                id: true,
              },
            });

          const resultRecord =
            existing
              ? await tx.result.update({
                  where: {
                    id: existing.id,
                  },

                  data: {
                    status: "ENTERED",

                    remarks:
                      body.remarks?.trim() ||
                      null,

                    interpretation:
                      interpretation ||
                      null,

                    enteredById:
                      userId ?? null,

                    enteredAt:
                      new Date(),
                  },
                })
              : await tx.result.create({
                  data: {
                    orderId:
                      body.orderId,

                    testId:
                      body.testId,

                    status: "ENTERED",

                    remarks:
                      body.remarks?.trim() ||
                      null,

                    interpretation:
                      interpretation ||
                      null,

                    enteredById:
                      userId ?? null,

                    enteredAt:
                      new Date(),
                  },
                });

          /*
           * Upsert every parameter value.
           */
          // ⚡ Bolt: Execute upserts concurrently using Promise.all to avoid N+1 query bottlenecks in transaction
          await Promise.all(
            calculatedValues.map((item) =>
              tx.resultValue.upsert({
                where: {
                  resultId_parameterId: {
                    resultId:
                      resultRecord.id,
                    parameterId:
                      (item.parameter as TestParameter).id,
                  },
                },

                create: {
                  resultId:
                    resultRecord.id,

                  parameterId:
                    (item.parameter as TestParameter).id,

                  value: item.value,

                  flag: item.flag,

                  remark: item.remark,
                },

                update: {
                  value: item.value,
                  flag: item.flag,
                  remark: item.remark,
                },
              })
            )
          );

          const completeResult =
            await tx.result.findUnique({
              where: {
                id: resultRecord.id,
              },

              include: {
                test: {
                  select: {
                    id: true,
                    testCode: true,
                    testName: true,
                  },
                },

                order: {
                  select: {
                    id: true,
                    orderNumber: true,
                    patient: {
                      select: {
                        id: true,
                        uhid: true,
                        firstName: true,
                        middleName: true,
                        lastName: true,
                        gender: true,
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

                values: {
                  include: {
                    parameter: {
                      select: {
                        id: true,
                        parameterName: true,
                        unit: true,
                        dataType: true,
                        displayOrder: true,
                      },
                    },
                  },
                },
              },
            });

          return completeResult;
        }
      );

    res.status(200).json({
      success: true,

      message:
        "Test result entered and automatically validated.",

      data: result,

      validation: {
        hasCritical,
        hasAbnormal,
        status:
          hasCritical
            ? "CRITICAL"
            : hasAbnormal
              ? "ABNORMAL"
              : "NORMAL",
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getResultById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const resultId = Array.isArray(id) ? id[0] : id;

    if (!resultId) {
      res.status(400).json({
        success: false,
        message: "Result id is required.",
      });
      return;
    }

    const result =
      await prisma.result.findUnique({
        where: {
          id: resultId,
        },

        include: {
          order: {
            include: {
              patient: true,
              doctor: {
                select: {
                  id: true,
                  doctorCode: true,
                  fullName: true,
                  specialization: true,
                },
              },
            },
          },

          test: {
            include: {
              category: true,
              parameters: {
                orderBy: {
                  displayOrder: "asc",
                },
                include: {
                  referenceRanges: true,
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
            },
          },

          values: {
            orderBy: {
              parameter: {
                displayOrder: "asc",
              },
            },

            include: {
              parameter: true,
            },
          },

          approvals: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

    if (!result) {
      res.status(404).json({
        success: false,
        message: "Result not found.",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};