export function getSignedInHome(user) {
  return user?.isHost ? "/anfitrion/dashboard" : "/buscar";
}
