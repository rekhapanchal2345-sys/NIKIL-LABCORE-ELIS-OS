import prisma from "../../lib/prisma";

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

export const createNotificationTemplate = async (data: CreateTemplateInput) => {
  return prisma.$queryRaw`
    INSERT INTO notification_templates (id, name, description, "eventType", channel, "subjectTemplate", "bodyTemplate", variables, "createdBy")
    VALUES (
      gen_random_uuid()::text,
      ${data.name},
      ${data.description || null},
      ${data.eventType},
      ${data.channel},
      ${data.subjectTemplate || null},
      ${data.bodyTemplate},
      ARRAY[${data.variables}]::text[],
      ${data.createdBy || null}
    )
    RETURNING *
  `;
};

export const getNotificationTemplates = async (eventType?: string, channel?: string) => {
  let query = 'SELECT * FROM notification_templates WHERE 1=1';
  const params: any[] = [];
  
  if (eventType) {
    query += ' AND "eventType" = $' + (params.length + 1);
    params.push(eventType);
  }
  
  if (channel) {
    query += ' AND channel = $' + (params.length + 1);
    params.push(channel);
  }
  
  query += ' ORDER BY "createdAt" DESC';
  
  const templates = await prisma.$queryRawUnsafe(query, ...params);
  
  // Convert snake_case to camelCase
  return (Array.isArray(templates) ? templates : [templates]).map((t: any) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    eventType: t.eventType,
    channel: t.channel,
    subjectTemplate: t.subjectTemplate,
    bodyTemplate: t.bodyTemplate,
    variables: t.variables,
    isActive: t.isActive,
    createdBy: t.createdBy,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
};

export const getNotificationTemplateById = async (id: string) => {
  const templates = await prisma.$queryRaw`
    SELECT * FROM notification_templates WHERE id = ${id}
  `;
  
  const templateArray = Array.isArray(templates) ? templates : [templates];
  const template = templateArray[0];
  
  if (!template) {
    throw new Error("Notification template not found");
  }
  
  // Convert snake_case to camelCase
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    eventType: template.eventType,
    channel: template.channel,
    subjectTemplate: template.subjectTemplate,
    bodyTemplate: template.bodyTemplate,
    variables: template.variables,
    isActive: template.isActive,
    createdBy: template.createdBy,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
};

export const updateNotificationTemplate = async (id: string, data: UpdateTemplateInput) => {
  const result = await prisma.$queryRaw`
    UPDATE notification_templates
    SET 
      name = COALESCE(${data.name || null}, name),
      description = COALESCE(${data.description || null}, description),
      "eventType" = COALESCE(${data.eventType || null}, "eventType"),
      channel = COALESCE(${data.channel || null}, channel),
      "subjectTemplate" = COALESCE(${data.subjectTemplate || null}, "subjectTemplate"),
      "bodyTemplate" = COALESCE(${data.bodyTemplate || null}, "bodyTemplate"),
      variables = COALESCE(${data.variables ? `ARRAY[${data.variables}]::text[]` : null}, variables),
      "isActive" = COALESCE(${data.isActive !== undefined ? data.isActive : null}, "isActive"),
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ${id}
    RETURNING *
  `;
  
  const resultArray = Array.isArray(result) ? result : [result];
  const template = resultArray[0];
  
  // Convert snake_case to camelCase
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    eventType: template.eventType,
    channel: template.channel,
    subjectTemplate: template.subjectTemplate,
    bodyTemplate: template.bodyTemplate,
    variables: template.variables,
    isActive: template.isActive,
    createdBy: template.createdBy,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
};

export const deleteNotificationTemplate = async (id: string) => {
  await prisma.$queryRaw`
    DELETE FROM notification_templates WHERE id = ${id}
  `;
  
  return { id, deleted: true };
};

export const applyTemplate = async (templateId: string, variables: Record<string, string>) => {
  const template = await getNotificationTemplateById(templateId);
  
  let subject = template.subjectTemplate || '';
  let body = template.bodyTemplate;
  
  // Replace variables in the template
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), value || '');
    body = body.replace(new RegExp(placeholder, 'g'), value || '');
  });
  
  return {
    subject,
    body,
    template,
  };
};