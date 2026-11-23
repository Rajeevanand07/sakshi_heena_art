// Social links for the fixed icon bar at the bottom of every page.

export const INSTAGRAM_URL = 'https://www.instagram.com/sakshi.heena.art/';
export const FACEBOOK_URL = 'https://www.facebook.com/share/1AARai2YDB/';

// Paste the WhatsApp number here: country code + number, digits only,
// no +, spaces or dashes. Canada example: '16045550123'.
export const WHATSAPP_NUMBER = '+1(778)667-1377';

// Optional first message that appears typed in the chat (leave '' for none).
export const WHATSAPP_MESSAGE = "Hi Sakshi! I'd like to ask about a mehndi booking.";

// Link that opens a WhatsApp chat with Sakshi, with `message` already typed.
export const whatsappUrl = (message = WHATSAPP_MESSAGE) => {
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  // wa.me needs digits only, so strip +, spaces, brackets and dashes.
  const digits = WHATSAPP_NUMBER.replace(/\D/g, '');
  return `https://wa.me/${digits}${text}`;
};
