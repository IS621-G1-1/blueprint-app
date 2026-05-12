export function isSmuEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail.endsWith("@smu.edu.sg");
}

export function isSixDigitCode(code: string) {
  return /^\d{6}$/.test(code);
}
