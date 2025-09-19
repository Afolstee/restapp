/**
 * Generates user ID based on current date and user names
 * Format: DDMM + first letter of first name + first letter of last name
 * Example: John Doe created on Sept 19 -> 1909JD
 */
export function generateUserId(firstName: string, lastName: string): string {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, '0')
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  
  const firstInitial = firstName.charAt(0).toUpperCase()
  const lastInitial = lastName.charAt(0).toUpperCase()
  
  return `${day}${month}${firstInitial}${lastInitial}`
}

/**
 * Validates if a string matches the ID format
 * DDMM + 2 letters
 */
export function isValidIdFormat(id: string): boolean {
  const idPattern = /^\d{4}[A-Z]{2}$/
  return idPattern.test(id)
}

/**
 * Extracts date info from user ID for display purposes
 */
export function parseIdDate(id: string): { day: string, month: string } | null {
  if (!isValidIdFormat(id)) return null
  
  return {
    day: id.substring(0, 2),
    month: id.substring(2, 4)
  }
}