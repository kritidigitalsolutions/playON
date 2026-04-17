const rawPublicUrl = process.env.PUBLIC_URL || "";

const normalizedBasePath =
  process.env.NODE_ENV === "production" && rawPublicUrl
    ? new URL(rawPublicUrl, window.location.origin).pathname.replace(/\/$/, "")
    : "";

export const APP_BASENAME = normalizedBasePath;
export const LOGIN_ROUTE = "/login";
export const DASHBOARD_ROUTE = "/dashboard";

export const toAppPath = (route) => `${APP_BASENAME}${route}`;
