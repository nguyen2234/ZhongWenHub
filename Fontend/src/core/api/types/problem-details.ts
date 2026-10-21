/**
 * RFC 7807 Problem Details representation for ASP.NET Core Web API errors.
 * Compatible with Microsoft.AspNetCore.Mvc.ProblemDetails and HttpValidationProblemDetails.
 */
export interface ProblemDetails {
  type?: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  /**
   * Validation errors keyed by field/property name.
   * Standard format from ASP.NET Core ModelState / FluentValidation.
   */
  errors?: Record<string, string[]>;
  [key: string]: unknown;
}

/**
 * Type guard to check if an object is a ProblemDetails structure.
 */
export function isProblemDetails(obj: unknown): obj is ProblemDetails {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'status' in obj &&
    typeof (obj as { status: unknown }).status === 'number' &&
    'title' in obj &&
    typeof (obj as { title: unknown }).title === 'string'
  );
}
