// integrations.js — stubs replacing base44 integrations

export const Core = {
  UploadFile: async ({ file }) => {
    console.warn('UploadFile: use Supabase storage directly');
    return { file_url: null };
  },
  SendEmail: async (...args) => {
    console.warn('Email sending not yet implemented — will use Supabase Edge Function');
  },
  GenerateImage: async (...args) => {
    console.warn('Image generation not yet implemented — will use Supabase Edge Function');
    return null;
  },
};

export const InvokeLLM = async (...args) => {
  console.warn('InvokeLLM not yet implemented');
  return null;
};

export const SendEmail = Core.SendEmail;
export const SendSMS = async (...args) => {
  console.warn('SendSMS not yet implemented');
};
export const UploadFile = Core.UploadFile;
export const GenerateImage = Core.GenerateImage;
export const ExtractDataFromUploadedFile = async (...args) => {
  console.warn('ExtractDataFromUploadedFile not yet implemented');
  return null;
};
