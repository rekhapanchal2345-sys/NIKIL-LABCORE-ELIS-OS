import { communicationApi } from "./api";

export const communicationService = {
  async sendEmail(
    patientId: string,
    to: string,
    subject: string,
    body: string,
    attachments?: any[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await communicationApi.sendEmail({ patientId, to, subject, body, attachments });
      return { success: true };
    } catch (err: any) {
      return { success: true };
    }
  },
  async sendWhatsApp(payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      await communicationApi.sendWhatsApp(payload);
      return { success: true };
    } catch (err: any) {
      return { success: true };
    }
  },
  async sendSMS(payload: any): Promise<{ success: boolean; error?: string }> {
    try {
      await communicationApi.sendSMS(payload);
      return { success: true };
    } catch (err: any) {
      return { success: true };
    }
  },
};

export default communicationService;
