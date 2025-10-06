// Validadores para formularios
export function validateDominicanCedula(cedula: string): boolean {
  if (!cedula) return false;
  
  // Remover guiones y espacios
  const cleanCedula = cedula.replace(/[-\s]/g, '');
  
  // Verificar que tenga exactamente 11 dígitos
  if (cleanCedula.length !== 11) return false;
  
  // Verificar que todos sean números
  if (!/^\d{11}$/.test(cleanCedula)) return false;
  
  let total = 0;
  const digitMultiplier = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1];
  
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(cleanCedula.charAt(i));
    let calculation = digit * digitMultiplier[i];
    
    if (calculation < 10) {
      total += calculation;
    } else {
      // Si el resultado es >= 10, sumar los dígitos individualmente
      const calcStr = calculation.toString();
      total += parseInt(calcStr.charAt(0)) + parseInt(calcStr.charAt(1));
    }
  }
  
  return total % 10 === 0;
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  
  // Expresión regular más estricta para emails
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Verificaciones adicionales
  if (email.length > 254) return false; // RFC 5321
  if (email.includes('..')) return false; // No permitir puntos consecutivos
  if (email.startsWith('.') || email.endsWith('.')) return false; // No empezar/terminar con punto
  if (email.includes('@.') || email.includes('.@')) return false; // No punto junto al @
  
  return emailRegex.test(email);
}

export function formatCedula(cedula: string): string {
  // Remover todo excepto números
  const numbers = cedula.replace(/\D/g, '');
  
  // Limitar a 11 dígitos
  const limited = numbers.substring(0, 11);
  
  // Formatear como XXX-XXXXXXX-X
  if (limited.length >= 10) {
    return `${limited.substring(0, 3)}-${limited.substring(3, 10)}-${limited.substring(10, 11)}`;
  } else if (limited.length >= 3) {
    return `${limited.substring(0, 3)}-${limited.substring(3)}`;
  } else {
    return limited;
  }
}

export function getValidationMessage(field: string, value: string): string | null {
  switch (field) {
    case 'cedula':
      if (!value) return 'La cédula es requerida';
      if (!validateDominicanCedula(value)) return 'Cédula dominicana inválida';
      return null;
    
    case 'email':
      if (!value) return 'El email es requerido';
      if (!validateEmail(value)) return 'Formato de email inválido';
      return null;
    
    case 'limite_credito':
      if (!value) return 'El límite de crédito es requerido';
      const limite = parseFloat(value);
      if (isNaN(limite)) return 'Debe ser un número válido';
      if (limite < 0) return 'El límite de crédito no puede ser negativo';
      return null;
    
    default:
      return null;
  }
}