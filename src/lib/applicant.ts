const KEY = 'ahs-demo-applicant';

export function rememberApplicant(contractorId: string) {
  window.sessionStorage.setItem(KEY, contractorId);
}

export function rememberedApplicant() {
  return window.sessionStorage.getItem(KEY);
}
