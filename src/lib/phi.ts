export const PHI_WARNING_TEXT =
  'Do not include patient identifiers (names, MRNs, dates of birth, phone numbers).';

const PHI_PATTERNS: RegExp[] = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN-like
  /\b\d{6,10}\b/, // MRN-like
  /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/, // MM/DD/YYYY
  /\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/, // YYYY-MM-DD
];

export const containsPotentialPhi = (value: string) => {
  if (!value) return false;
  return PHI_PATTERNS.some((pattern) => pattern.test(value));
};
