
import { z } from 'zod';

// Common validation schemas
export const schemas = {
  email: z.string().email('Invalid email format'),
  uuid: z.string().uuid('Invalid UUID format'),
  positiveNumber: z.number().positive('Must be a positive number'),
  nonEmptyString: z.string().min(1, 'Cannot be empty'),
  phoneNumber: z.string().regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  nif: z.string()
    .min(5, 'NIF deve ter pelo menos 5 caracteres')
    .max(20, 'NIF muito longo')
    .regex(/^[a-zA-Z0-9]+$/, 'NIF deve conter apenas letras e números')
    .refine((value) => {
      const cleanNIF = value.replace(/[^a-zA-Z0-9]/g, '');
      // Aceitar NIFs empresariais (9-10 dígitos) ou pessoais (formato 005732018NE040)
      return /^\d{9,10}$/.test(cleanNIF) || /^\d{9}[A-Z]{2}\d{3}$/.test(cleanNIF);
    }, 'Formato inválido. Empresa: 9-10 dígitos (ex: 5000088927). Pessoa: 9 díg + 2 letras + 3 díg (ex: 005732018NE040)'),
};

// Payment validation
export const paymentSchema = z.object({
  amount: schemas.positiveNumber,
  orderId: schemas.uuid.optional(),
  invoiceId: schemas.uuid.optional(),
  customerName: schemas.nonEmptyString,
  customerEmail: schemas.email,
}).refine(data => data.orderId || data.invoiceId, {
  message: "Either orderId or invoiceId must be provided"
});

// User profile validation
export const profileUpdateSchema = z.object({
  name: schemas.nonEmptyString.optional(),
  phone: schemas.phoneNumber.optional(),
  address: z.string().optional(),
  company_name: z.string().optional(),
  nif: schemas.nif.optional(),
});

// Invoice validation
export const invoiceCreateSchema = z.object({
  order_id: schemas.uuid,
  amount: schemas.positiveNumber,
  due_date: z.string().datetime(),
  description: z.string().optional(),
});

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
}

// Validate and sanitize object
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: any): {
  success: boolean;
  data?: T;
  errors?: string[];
} {
  try {
    // Sanitize string fields
    const sanitized = { ...data };
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value);
      }
    }

    const result = schema.safeParse(sanitized);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { 
        success: false, 
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      };
    }
  } catch (error) {
    return { 
      success: false, 
      errors: ['Validation failed']
    };
  }
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): { allowed: boolean; resetTime?: number } {
  const now = Date.now();
  const key = identifier;
  
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, resetTime: record.resetTime };
  }
  
  record.count++;
  return { allowed: true };
}
