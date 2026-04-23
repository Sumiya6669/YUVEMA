export function buildAuthUrl({
  pathname = "/",
  search = "",
  mode = "login",
  nextPath = "/account",
}) {
  const params = new URLSearchParams(search);
  params.set("auth", mode);

  if (nextPath) {
    params.set("next", nextPath);
  }

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}

export function clearAuthUrl({ pathname = "/", search = "" }) {
  const params = new URLSearchParams(search);
  params.delete("auth");
  params.delete("next");

  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}
