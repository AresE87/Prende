export function getSignedInHome(user) {
  if (user?.isHost) return "/anfitrion/dashboard";
  return "/";
}
