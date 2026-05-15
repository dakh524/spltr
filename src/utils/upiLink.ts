/**
 * Generate proper UPI deep links for payment apps.
 * pa = Address (UPI ID)
 * pn = Name
 * am = Amount
 * cu = Currency
 * tn = Note
 */
export function makeUPILink(
  payeeUPI: string,
  payeeName: string,
  amount: number,
  note: string
): string {
  // Ensure we have strings and no "undefined" literals
  const upi = payeeUPI || '';
  const name = payeeName || 'Me';
  const upiNote = note || 'Bill Split';
  
  // pa (Address) should NOT be encoded
  // pn (Name) and tn (Note) MUST be encoded
  const encodedName = encodeURIComponent(name);
  const encodedNote = encodeURIComponent(upiNote);
  const formattedAmount = amount.toFixed(2);
  
  const link = `upi://pay?pa=${upi}&pn=${encodedName}&am=${formattedAmount}&cu=INR&tn=${encodedNote}`;
  
  console.log('[UPILink] Generated Link:', link);
  console.log('[UPILink] Params - pa:', upi, 'pn:', name);
  
  return link;
}

export const generateUPILink = makeUPILink;
