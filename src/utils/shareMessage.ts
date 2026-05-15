export function formatWhatsAppMessage(
  friendName: string,
  myName: string,
  myUPI: string,
  amount: number,
  splitName: string
): string {
  return (
    `Hey ${friendName}! 👋\n` +
    `*${myName}* paid for *${splitName}* 🧾\n` +
    `Your share: *₹${amount.toFixed(2)}*\n\n` +
    `Pay me on any UPI app 👇\n` +
    `*UPI ID: ${myUPI}*\n\n` +
    `_Sent via SPLITR ⚡_`
  );
}
