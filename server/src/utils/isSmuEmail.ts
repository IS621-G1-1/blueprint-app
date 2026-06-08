export function isSmuEmail(email: string): boolean {
  const normalizedEmail = email.trim().toLowerCase();
  const [localPart, domain, extraPart] = normalizedEmail.split("@");
  if (!localPart || !domain || extraPart) {
    return false;
  }

  return domain === "smu.edu.sg" || domain?.endsWith(".smu.edu.sg") === true;
}
