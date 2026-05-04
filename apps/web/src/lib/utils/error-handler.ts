import { toast } from 'react-hot-toast';

export const handleApiError = (error: any, defaultMessage: string = 'Bir hata oluştu') => {
  const backendMessage = error.response?.data?.error?.message 
    || error.response?.data?.message 
    || error.message;

  const requestId = error.response?.data?.error?.request_id;
  
  const displayMessage = requestId 
    ? `${backendMessage} (ID: ${requestId})` 
    : backendMessage;

  toast.error(displayMessage || defaultMessage, {
    duration: 5000,
  });

  return displayMessage;
};
