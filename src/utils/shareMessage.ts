import { generateUPILink } from './upiLink';

export const formatWhatsAppMessage = (
  friendName: string,
  amount: number,
  splitName: string,
  myUPI: string,
  myName: string
) => {
  const upiLink = generateUPILink(myUPI, myName, amount, splitName);
  return `Hey ${friendName}! You owe ₹${amount} for ${splitName} 🧾\n\nTap to pay instantly:\n${upiLink}\n\n— Sent via SPLITR`;
};
