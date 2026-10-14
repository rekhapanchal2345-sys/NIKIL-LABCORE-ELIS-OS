import prisma from "../../../config/database";
import { hashPassword } from "../../utils/password";
import {
  assertStrongPassword,
  assertNotCommonPassword,
  assertNoPersonalInfo,
} from "../../utils/password-policy";
import { emailBlindIndex, normaliseEmail } from "../../utils/gmail";
import { UserRole, AccountStatus } from "@prisma/client";

interface CreateUserInput {
  employeeCode: string;
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
  specialization?: string;
}

interface UpdateUserInput {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  specialization?: string;
  status?: AccountStatus;
  // Profile settings
  firstName?: string;
  lastName?: string;
  designation?: string;
  department?: string;
  profileImage?: string;
  signature?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  timezone?: string;
  enableEmailNotifications?: boolean;
  enableSmsNotifications?: boolean;
  enablePushNotifications?: boolean;
  darkMode?: boolean;
  compactMode?: boolean;
  showTutorial?: boolean;
  // Lab-specific settings
  defaultReportTemplate?: string;
  autoApproveResults?: boolean;
  enableCriticalAlerts?: boolean;
  enableDailyDigest?: boolean;
  preferredCommunicationMethod?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  emergencyContact?: string;
  emergencyContactPhone?: string;
}

export const getUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      specialization: true,
      // Profile settings
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      profileImage: true,
      signature: true,
      language: true,
      dateFormat: true,
      timeFormat: true,
      timezone: true,
      enableEmailNotifications: true,
      enableSmsNotifications: true,
      enablePushNotifications: true,
      darkMode: true,
      compactMode: true,
      showTutorial: true,
      // Lab-specific settings
      defaultReportTemplate: true,
      autoApproveResults: true,
      enableCriticalAlerts: true,
      enableDailyDigest: true,
      preferredCommunicationMethod: true,
      workingHoursStart: true,
      workingHoursEnd: true,
      emergencyContact: true,
      emergencyContactPhone: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      specialization: true,
      // Profile settings
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      profileImage: true,
      signature: true,
      language: true,
      dateFormat: true,
      timeFormat: true,
      timezone: true,
      enableEmailNotifications: true,
      enableSmsNotifications: true,
      enablePushNotifications: true,
      darkMode: true,
      compactMode: true,
      showTutorial: true,
      // Lab-specific settings
      defaultReportTemplate: true,
      autoApproveResults: true,
      enableCriticalAlerts: true,
      enableDailyDigest: true,
      preferredCommunicationMethod: true,
      workingHoursStart: true,
      workingHoursEnd: true,
      emergencyContact: true,
      emergencyContactPhone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const createUser = async (data: CreateUserInput) => {
  assertStrongPassword(data.password);
  assertNotCommonPassword(data.password);
  assertNoPersonalInfo(data.password, data.email, data.fullName);

  const canonicalEmail = normaliseEmail(data.email);

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: canonicalEmail },
        { employeeCode: data.employeeCode },
      ],
    },
  });

  if (existingUser) {
    throw new Error(
      "User with this email or employee code already exists"
    );
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.user.create({
    data: {
      employeeCode: data.employeeCode,
      fullName: data.fullName,
      email: canonicalEmail,
      phone: data.phone,
      passwordHash,
      role: data.role,
      specialization: data.specialization,
      passwordChangedAt: new Date(),
      emailBlindIndex: emailBlindIndex(canonicalEmail),
    },
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      specialization: true,
      createdAt: true,
    },
  });

  await prisma.passwordHistory.create({
    data: { userId: user.id, passwordHash },
  });

  return user;
};

export const updateUser = async (
  id: string,
  data: UpdateUserInput
) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (data.email) {
    const emailExists = await prisma.user.findFirst({
      where: {
        email: data.email,
        NOT: { id },
      },
    });

    if (emailExists) {
      throw new Error("Email is already in use");
    }
  }

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      specialization: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const changeUserStatus = async (
  id: string,
  status: AccountStatus
) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status },
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (status !== "ACTIVE") {
    await prisma.userSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: {
        revokedAt: new Date(),
        revokeReason: `account_status_${status.toLowerCase()}`,
      },
    });
  }

  return updatedUser;
};

export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.user.delete({
    where: { id },
  });

  return {
    id,
    deleted: true,
  };
};

export const updateProfileSettings = async (
  id: string,
  data: Partial<UpdateUserInput>
) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Only allow updating profile-specific fields
  const allowedFields = [
    'firstName',
    'lastName',
    'fullName',
    'phone',
    'designation',
    'department',
    'profileImage',
    'signature',
    'language',
    'dateFormat',
    'timeFormat',
    'timezone',
    'enableEmailNotifications',
    'enableSmsNotifications',
    'enablePushNotifications',
    'darkMode',
    'compactMode',
    'showTutorial',
    // Lab-specific settings
    'defaultReportTemplate',
    'autoApproveResults',
    'enableCriticalAlerts',
    'enableDailyDigest',
    'preferredCommunicationMethod',
    'workingHoursStart',
    'workingHoursEnd',
    'emergencyContact',
    'emergencyContactPhone'
  ];

  const updateData: any = {};
  for (const field of allowedFields) {
    if (data[field as keyof UpdateUserInput] !== undefined && data[field as keyof UpdateUserInput] !== null && data[field as keyof UpdateUserInput] !== '') {
      updateData[field] = data[field as keyof UpdateUserInput];
    }
  }

  // Update fullName if firstName or lastName changed
  if (data.firstName || data.lastName) {
    const currentFirstName = user.firstName || '';
    const currentLastName = user.lastName || '';
    updateData.fullName = `${data.firstName || currentFirstName} ${data.lastName || currentLastName}`.trim();
  }

  console.log('Updating user profile with data:', updateData);

  return prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      specialization: true,
      // Profile settings
      firstName: true,
      lastName: true,
      designation: true,
      department: true,
      profileImage: true,
      signature: true,
      language: true,
      dateFormat: true,
      timeFormat: true,
      timezone: true,
      enableEmailNotifications: true,
      enableSmsNotifications: true,
      enablePushNotifications: true,
      darkMode: true,
      compactMode: true,
      showTutorial: true,
      // Lab-specific settings
      defaultReportTemplate: true,
      autoApproveResults: true,
      enableCriticalAlerts: true,
      enableDailyDigest: true,
      preferredCommunicationMethod: true,
      workingHoursStart: true,
      workingHoursEnd: true,
      emergencyContact: true,
      emergencyContactPhone: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};