import prisma from "../../lib/prisma";
import { NotificationEventType, CommunicationType } from "@prisma/client";

interface CreateTemplateInput {
  name: string;
  description?: string;
  eventType: string;
  channel: string;
  subjectTemplate?: string;
  bodyTemplate: string;
  variables: string[];
  createdBy?: string;
}

interface UpdateTemplateInput {
  name?: string;
  description?: string;
  eventType?: string;
  channel?: string;
  subjectTemplate?: string;
  bodyTemplate?: string;
  variables?: string[];
  isActive?: boolean;
}

/**
 * SQL-BUG-001: Refactored to native Prisma ORM queries to fix broken raw SQL array
 * binding (ARRAY[...]::text[]) and literal type mismatch exceptions on PostgreSQL.
 */
export const createNotificationTemplate = async (data: CreateTemplateInput) => {
  return await prisma.notificationTemplate.create({
    data: {
      name: data.name,
      description: data.description || null,
      eventType: data.eventType as NotificationEventType,
      channel: data.channel as CommunicationType,
      subjectTemplate: data.subjectTemplate || null,
      bodyTemplate: data.bodyTemplate,
      variables: Array.isArray(data.variables) ? data.variables : [],
      createdBy: data.createdBy || null,
    },
  });
};

export const getNotificationTemplates = async (eventType?: string, channel?: string) => {
  const where: any = {};
  if (eventType) where.eventType = eventType as NotificationEventType;
  if (channel) where.channel = channel as CommunicationType;

  return await prisma.notificationTemplate.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
};

export const getNotificationTemplateById = async (id: string) => {
  const template = await prisma.notificationTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    throw new Error("Notification template not found");
  }

  return template;
};

export const updateNotificationTemplate = async (id: string, data: UpdateTemplateInput) => {
  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.eventType !== undefined) updateData.eventType = data.eventType as NotificationEventType;
  if (data.channel !== undefined) updateData.channel = data.channel as CommunicationType;
  if (data.subjectTemplate !== undefined) updateData.subjectTemplate = data.subjectTemplate;
  if (data.bodyTemplate !== undefined) updateData.bodyTemplate = data.bodyTemplate;
  if (data.variables !== undefined) updateData.variables = Array.isArray(data.variables) ? data.variables : [];
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return await prisma.notificationTemplate.update({
    where: { id },
    data: updateData,
  });
};

export const deleteNotificationTemplate = async (id: string) => {
  await prisma.notificationTemplate.delete({
    where: { id },
  });

  return { id, deleted: true };
};

export const applyTemplate = async (templateId: string, variables: Record<string, string>) => {
  const template = await getNotificationTemplateById(templateId);

  let subject = template.subjectTemplate || "";
  let body = template.bodyTemplate;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, "g"), value || "");
    body = body.replace(new RegExp(placeholder, "g"), value || "");
  });

  return {
    subject,
    body,
    template,
  };
};