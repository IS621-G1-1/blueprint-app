export function isSmuEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [localPart, domain, extraPart] = normalizedEmail.split("@");
  if (!localPart || !domain || extraPart) {
    return false;
  }

  return domain === "smu.edu.sg" || domain?.endsWith(".smu.edu.sg") === true;
}

export function isSixDigitCode(code: string) {
  return /^\d{6}$/.test(code);
}
