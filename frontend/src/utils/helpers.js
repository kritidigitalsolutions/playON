export const formatNumber = (value) =>
  new Intl.NumberFormat("en-US", {
    notation: value > 9999 ? "compact" : "standard",
    maximumFractionDigits: 1
  }).format(value);

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);

export const getBadgeClass = (status, styles) => styles[status?.toLowerCase()] || styles.inactive;

export const paginate = (rows, page, perPage) => {
  const start = (page - 1) * perPage;
  return rows.slice(start, start + perPage);
};

export const getInitials = (name = "Admin") =>
  name
    .split(" ")
    .map((token) => token[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const buildBreadcrumbs = (pathname) => {
  const parts = pathname.split("/").filter(Boolean);

  if (!parts.length) {
    return [{ label: "Dashboard", path: "/dashboard" }];
  }

  return parts.map((part, index) => ({
    label: part.charAt(0).toUpperCase() + part.slice(1),
    path: `/${parts.slice(0, index + 1).join("/")}`
  }));
};
