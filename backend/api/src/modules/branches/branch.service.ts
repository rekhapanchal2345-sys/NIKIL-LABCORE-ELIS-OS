import prisma from "../../../config/database";
import { HttpError } from "../../utils/http-error";

export interface CreateBranchDto {
  code: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  nablNumber?: string;
  gstin?: string;
  letterheadUrl?: string;
  isMainBranch?: boolean;
  isActive?: boolean;
  settings?: Record<string, any>;
}

export interface UpdateBranchDto {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  nablNumber?: string;
  gstin?: string;
  letterheadUrl?: string;
  isMainBranch?: boolean;
  isActive?: boolean;
  settings?: Record<string, any>;
}

export class BranchService {
  /**
   * Create a new branch with unique code and optional main branch designation.
   */
  static async createBranch(data: CreateBranchDto) {
    const code = data.code.trim().toUpperCase();

    const existing = await prisma.branch.findUnique({
      where: { code },
    });

    if (existing) {
      throw new HttpError(400, `Branch with code "${code}" already exists.`);
    }

    return await prisma.$transaction(async (tx) => {
      if (data.isMainBranch) {
        // Unset isMainBranch on all other branches
        await tx.branch.updateMany({
          where: { isMainBranch: true },
          data: { isMainBranch: false },
        });
      }

      return await tx.branch.create({
        data: {
          code,
          name: data.name.trim(),
          address: data.address?.trim() || null,
          city: data.city?.trim() || null,
          state: data.state?.trim() || null,
          pincode: data.pincode?.trim() || null,
          phone: data.phone?.trim() || null,
          email: data.email?.trim() || null,
          nablNumber: data.nablNumber?.trim() || null,
          gstin: data.gstin?.trim() || null,
          letterheadUrl: data.letterheadUrl?.trim() || null,
          isMainBranch: !!data.isMainBranch,
          isActive: data.isActive !== undefined ? data.isActive : true,
          settings: data.settings ? (data.settings as any) : undefined,
        },
      });
    });
  }

  /**
   * List all branches with summary counts
   */
  static async getBranches(filter?: { isActive?: boolean; search?: string }) {
    const where: any = {};
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }
    if (filter?.search) {
      const q = filter.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { code: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }

    return await prisma.branch.findMany({
      where,
      orderBy: [{ isMainBranch: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            users: true,
            patients: true,
            orders: true,
          },
        },
      },
    });
  }

  /**
   * Get single branch by ID or Code
   */
  static async getBranchById(idOrCode: string) {
    const branch = await prisma.branch.findFirst({
      where: {
        OR: [{ id: idOrCode }, { code: idOrCode.toUpperCase() }],
      },
      include: {
        _count: {
          select: {
            users: true,
            patients: true,
            orders: true,
          },
        },
      },
    });

    if (!branch) {
      throw new HttpError(404, `Branch "${idOrCode}" not found.`);
    }

    return branch;
  }

  /**
   * Update existing branch
   */
  static async updateBranch(id: string, data: UpdateBranchDto) {
    const branch = await prisma.branch.findUnique({ where: { id } });
    if (!branch) {
      throw new HttpError(404, `Branch with id "${id}" not found.`);
    }

    return await prisma.$transaction(async (tx) => {
      if (data.isMainBranch) {
        await tx.branch.updateMany({
          where: { isMainBranch: true, id: { not: id } },
          data: { isMainBranch: false },
        });
      }

      return await tx.branch.update({
        where: { id },
        data: {
          name: data.name !== undefined ? data.name.trim() : undefined,
          address: data.address !== undefined ? data.address?.trim() || null : undefined,
          city: data.city !== undefined ? data.city?.trim() || null : undefined,
          state: data.state !== undefined ? data.state?.trim() || null : undefined,
          pincode: data.pincode !== undefined ? data.pincode?.trim() || null : undefined,
          phone: data.phone !== undefined ? data.phone?.trim() || null : undefined,
          email: data.email !== undefined ? data.email?.trim() || null : undefined,
          nablNumber: data.nablNumber !== undefined ? data.nablNumber?.trim() || null : undefined,
          gstin: data.gstin !== undefined ? data.gstin?.trim() || null : undefined,
          letterheadUrl: data.letterheadUrl !== undefined ? data.letterheadUrl?.trim() || null : undefined,
          isMainBranch: data.isMainBranch !== undefined ? data.isMainBranch : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
          settings: data.settings !== undefined ? (data.settings as any) : undefined,
        },
      });
    });
  }

  /**
   * Assign a user to a specific branch
   */
  static async assignUserToBranch(userId: string, branchId: string | null) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpError(404, `User with id "${userId}" not found.`);
    }

    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (!branch) {
        throw new HttpError(404, `Branch with id "${branchId}" not found.`);
      }
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { branchId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        branchId: true,
      },
    });
  }

  /**
   * Cross-Branch HQ Aggregated Analytics
   */
  static async getCrossBranchAggregates(startDate?: Date, endDate?: Date) {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      orderBy: [{ isMainBranch: "desc" }, { name: "asc" }],
    });

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    const branchAnalytics = await Promise.all(
      branches.map(async (branch) => {
        const [patientCount, orders, orderStatusCounts] = await Promise.all([
          prisma.patient.count({
            where: {
              branchId: branch.id,
              ...dateFilter,
            },
          }),
          prisma.order.findMany({
            where: {
              branchId: branch.id,
              ...dateFilter,
            },
            select: {
              id: true,
              grandTotal: true,
              paidAmount: true,
              paymentStatus: true,
              orderStatus: true,
            },
          }),
          prisma.order.groupBy({
            by: ["orderStatus"],
            where: {
              branchId: branch.id,
              ...dateFilter,
            },
            _count: { _all: true },
          }),
        ]);

        const totalOrders = orders.length;
        const totalBilled = orders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
        const totalCollected = orders.reduce((sum, o) => sum + (Number(o.paidAmount) || 0), 0);
        const totalOutstanding = Math.max(0, totalBilled - totalCollected);

        return {
          branchId: branch.id,
          branchCode: branch.code,
          branchName: branch.name,
          city: branch.city,
          isMainBranch: branch.isMainBranch,
          nablNumber: branch.nablNumber,
          metrics: {
            patientCount,
            totalOrders,
            totalBilled: Math.round(totalBilled * 100) / 100,
            totalCollected: Math.round(totalCollected * 100) / 100,
            totalOutstanding: Math.round(totalOutstanding * 100) / 100,
            statusBreakdown: orderStatusCounts.reduce((acc, curr) => {
              acc[curr.orderStatus] = curr._count._all;
              return acc;
            }, {} as Record<string, number>),
          },
        };
      })
    );

    // Consolidated HQ totals
    const consolidated = branchAnalytics.reduce(
      (acc, curr) => {
        acc.totalPatients += curr.metrics.patientCount;
        acc.totalOrders += curr.metrics.totalOrders;
        acc.totalBilled += curr.metrics.totalBilled;
        acc.totalCollected += curr.metrics.totalCollected;
        acc.totalOutstanding += curr.metrics.totalOutstanding;
        return acc;
      },
      {
        totalBranches: branches.length,
        totalPatients: 0,
        totalOrders: 0,
        totalBilled: 0,
        totalCollected: 0,
        totalOutstanding: 0,
      }
    );

    return {
      consolidated,
      branches: branchAnalytics,
    };
  }

  /**
   * Get effective branch settings for report generation (letterhead, NABL, address)
   */
  static async getEffectiveBranchSettings(branchId?: string | null) {
    if (branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: branchId } });
      if (branch) {
        return {
          branchId: branch.id,
          branchCode: branch.code,
          branchName: branch.name,
          nablNumber: branch.nablNumber,
          letterheadUrl: branch.letterheadUrl,
          address: branch.address,
          city: branch.city,
          phone: branch.phone,
          email: branch.email,
          gstin: branch.gstin,
          settings: branch.settings || {},
        };
      }
    }

    // Fallback to main branch
    const mainBranch = await prisma.branch.findFirst({
      where: { isMainBranch: true, isActive: true },
    });

    if (mainBranch) {
      return {
        branchId: mainBranch.id,
        branchCode: mainBranch.code,
        branchName: mainBranch.name,
        nablNumber: mainBranch.nablNumber,
        letterheadUrl: mainBranch.letterheadUrl,
        address: mainBranch.address,
        city: mainBranch.city,
        phone: mainBranch.phone,
        email: mainBranch.email,
        gstin: mainBranch.gstin,
        settings: mainBranch.settings || {},
      };
    }

    return null;
  }
}
