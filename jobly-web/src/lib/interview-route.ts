export function isImmersiveInterviewRoute(pathname: string): boolean {
  return pathname.startsWith("/interview/");
}
