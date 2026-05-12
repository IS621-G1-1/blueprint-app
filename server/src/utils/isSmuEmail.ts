export function isSmuEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail.endsWith("@smu.edu.sg");
}
