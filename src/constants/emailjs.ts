// EmailJS configuration
// Get these from https://www.emailjs.com/
// Override via VITE_EMAILJS_SERVICE_ID / VITE_EMAILJS_TEMPLATE_ID /
// VITE_EMAILJS_PUBLIC_KEY in your .env file. The fallbacks keep the app
// working out of the box. The public key is designed to be exposed to
// browsers — never put a private key here.
export const EMAILJS_CONFIG = {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_c8a0jz8',
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_3ffnw0j',
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'jUjV7j9Xq1r6mehD5',
};

// Template params sent to EmailJS
export interface FeedbackTemplateParams {
    from_name: string;
    from_email: string;
    message: string;
    page_url: string;
    timestamp: string;
}