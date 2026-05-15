import { makeUPILink } from './upiLink';

export const formatWhatsAppMessage = (
  friendName: string,
  amount: number,
  splitName: string,
  myUPI: string,
  myName: string
) => {
  const upiLink = makeUPILink(myUPI, myName, amount, splitName);
  
  // BUG 2 Fix: WhatsApp only makes upi:// links tappable when isolated with blank lines
  return `Hey ${friendName}! 👋\n` +
         `${myName} paid for *${splitName}* 🧾\n` +
         `Your share: *₹${amount.toFixed(2)}*\n\n` +
         `Tap to pay instantly 👇\n\n` +
         `${upiLink}\n\n` +
         `_Sent via SPLITR ⚡_`;
};
