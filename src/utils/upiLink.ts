/**
 * BUG 3 Fix: Generate proper UPI deep links
 */
export function makeUPILink(
  payeeUPI: string,
  payeeName: string,
  amount: number,
  note: string
): string {
  const encodedName = encodeURIComponent(payeeName);
  const encodedNote = encodeURIComponent(note);
  const formattedAmount = amount.toFixed(2);
  
  return `upi://pay?pa=${payeeUPI}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;
}

// Deprecated old function for compatibility during migration if needed
export const generateUPILink = makeUPILink;
