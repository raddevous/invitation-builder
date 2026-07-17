// Calculate expires_at based on wedding date and creation date
// Logic: expires_at = min(wedding date + 30 days, creation date + 365 days)

export function calculateExpiration(weddingDate: string | null | undefined, createdAt: string): string {
  const created = new Date(createdAt);
  const oneYearFromCreation = new Date(created.getTime() + 365 * 24 * 60 * 60 * 1000);

  if (!weddingDate) {
    // No wedding date set: use creation date + 365 days
    return oneYearFromCreation.toISOString();
  }

  const wedding = new Date(weddingDate);
  const thirtyDaysAfterWedding = new Date(wedding.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Use whichever is earlier
  const expiration = thirtyDaysAfterWedding < oneYearFromCreation 
    ? thirtyDaysAfterWedding 
    : oneYearFromCreation;

  return expiration.toISOString();
}

export function isExpired(expiresAt: string): boolean {
  return new Date() > new Date(expiresAt);
}
