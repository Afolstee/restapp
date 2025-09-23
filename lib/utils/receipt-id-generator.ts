// Simple receipt ID generator that creates sequential IDs starting from BPR 001
export function generateReceiptId(orderId: string): string {
  // Extract timestamp from order ID or use current timestamp
  // This creates a simple sequential-like ID based on order creation
  const orderNum = orderId.slice(-6).toUpperCase()
  
  // Convert last 6 chars of order ID to a number and use as receipt counter
  let receiptCounter = 1
  try {
    const hexValue = parseInt(orderNum, 36) % 999 + 1
    receiptCounter = hexValue
  } catch {
    receiptCounter = Math.floor(Math.random() * 999) + 1
  }
  
  // Format as BPR + 3-digit number
  return `BPR ${receiptCounter.toString().padStart(3, '0')}`
}