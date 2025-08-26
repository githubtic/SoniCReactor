/**
 * Parses Supabase authentication errors and returns user-friendly messages
 */
export function parseAuthError(error: Error | null): string {
  if (!error) return "An unknown error occurred"

  const message = error.message.toLowerCase()

  // Network errors
  if (message.includes("failed to fetch") || message.includes("network") || message.includes("connection")) {
    return "Network error. Please check your internet connection and try again."
  }

  // Email confirmation errors
  if (isEmailNotConfirmedError(error)) {
    return "Email not confirmed. Please check your inbox or request a new confirmation email."
  }

  // Invalid credentials
  if (
    message.includes("invalid login") ||
    message.includes("invalid credentials") ||
    message.includes("invalid email") ||
    message.includes("invalid password")
  ) {
    return "Invalid email or password. Please try again."
  }

  // Rate limiting
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Too many attempts. Please try again later."
  }

  // Email already in use
  if (message.includes("email already in use") || message.includes("already registered")) {
    return "This email is already registered. Please use a different email or try to log in."
  }

  // Password requirements
  if (message.includes("password") && message.includes("requirements")) {
    return "Password does not meet requirements. Please use at least 8 characters with a mix of letters, numbers, and symbols."
  }

  // Database errors
  if (message.includes("database") || message.includes("db error") || message.includes("schema")) {
    return "There was a problem connecting to the database. Please try again later."
  }

  // Default error message
  return error.message
}

/**
 * Checks if an error is related to email confirmation
 */
export function isEmailNotConfirmedError(error: Error | null): boolean {
  if (!error) return false

  const message = error.message.toLowerCase()
  return (
    message.includes("email not confirmed") ||
    message.includes("not confirmed") ||
    message.includes("email_not_confirmed")
  )
}

/**
 * Checks if a user exists in the database
 */
export async function checkUserExists(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("users").select("id").eq("id", userId).single()

    if (error) {
      console.error("Error checking if user exists:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error checking if user exists:", error)
    return false
  }
}
