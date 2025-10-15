// Secure error message mapping to prevent information leakage

export const getAuthErrorMessage = (error: any): string => {
  console.error('Auth error:', error); // Log details for debugging
  
  const message = error?.message?.toLowerCase() || '';
  
  // Generic messages that don't reveal system state
  if (message.includes('already registered') || message.includes('already exists')) {
    return 'Unable to complete signup. Please try signing in instead.';
  }
  
  if (message.includes('invalid') || message.includes('incorrect')) {
    return 'Invalid credentials. Please check your email and password.';
  }
  
  if (message.includes('email') || message.includes('confirm')) {
    return 'Please check your email and follow the verification link.';
  }
  
  if (message.includes('weak') || message.includes('password')) {
    return 'Password does not meet requirements. Use at least 12 characters with uppercase, lowercase, number, and special character.';
  }
  
  return 'Authentication failed. Please try again.';
};

export const getDatabaseErrorMessage = (error: any): string => {
  console.error('Database error:', error); // Log details for debugging
  
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code || '';
  
  // Map constraint violations to user-friendly messages
  if (code === '23505' || message.includes('unique')) {
    return 'That value is already taken. Please choose a different one.';
  }
  
  if (code === '23514' || message.includes('check constraint') || message.includes('handle_check')) {
    return 'Handle must be 3-20 characters, lowercase, using only letters, numbers, and hyphens. Cannot start or end with a hyphen.';
  }
  
  if (code === '23503' || message.includes('foreign key')) {
    return 'Invalid reference. Please check your input.';
  }
  
  if (message.includes('permission') || message.includes('policy')) {
    return 'You do not have permission to perform this action.';
  }
  
  return 'Unable to save. Please check your input and try again.';
};
