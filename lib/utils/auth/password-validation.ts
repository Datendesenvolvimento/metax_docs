export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
  }
  
  export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
  
    // Mínimo de 8 caracteres
    if (password.length < 8) {
      errors.push('A senha deve ter no mínimo 8 caracteres');
    }
  
    // Pelo menos uma letra maiúscula
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }
  
    // Pelo menos uma letra minúscula
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }
  
    // Pelo menos um número
    if (!/\d/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }
  
    // Pelo menos um caractere especial
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }
  
    return {
      isValid: errors.length === 0,
      errors
    };
  }