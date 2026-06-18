// EmailJS configuration
// Get these from https://www.emailjs.com/
export const EMAILJS_CONFIG = {
    serviceId: 'service_c8a0jz8',
    templateId: 'template_3ffnw0j',
    publicKey: 'jUjV7j9Xq1r6mehD5',
} as const;

// Template params sent to EmailJS
export interface FeedbackTemplateParams {
    from_name: string;
    from_email: string;
    message: string;
    page_url: string;
    timestamp: string;
}
