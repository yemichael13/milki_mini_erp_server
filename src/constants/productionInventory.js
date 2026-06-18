const PRODUCT_CATALOG = [
  { product_type: "Wheat Flour", package_size_kg: 5, package_label: "5kg" },
  { product_type: "Wheat Flour", package_size_kg: 10, package_label: "10kg" },
  { product_type: "Wheat Flour", package_size_kg: 25, package_label: "25kg" },
  { product_type: "Wheat Flour", package_size_kg: 50, package_label: "50kg" },
  { product_type: "Corn Flour", package_size_kg: 25, package_label: "25kg" },
  { product_type: "Corn Flour", package_size_kg: 50, package_label: "50kg" },
  { product_type: "Fino", package_size_kg: 50, package_label: "50kg" },
  { product_type: "Frshkelo", package_size_kg: 50, package_label: "50kg" },
  { product_type: "Kinche", package_size_kg: 50, package_label: "50kg" },
  { product_type: "Bunegn", package_size_kg: 50, package_label: "50kg" },
  { product_type: "Afericho", package_size_kg: 50, package_label: "50kg" },
  { product_type: "Geleba", package_size_kg: 50, package_label: "50kg" },
];

const INVENTORY_STATUSES = Object.freeze({
  PRODUCTION_PENDING: "production_pending",
  PRODUCTION_APPROVED: "production_approved",
  MANAGER_PENDING: "manager_pending",
  MANAGER_APPROVED: "manager_approved",
  REJECTED: "rejected",
});

const RECORD_TYPES = Object.freeze({
  production: {
    table: "production_records",
    dateField: "production_date",
  },
  release: {
    table: "product_releases",
    dateField: "release_date",
  },
  return: {
    table: "product_returns",
    dateField: "return_date",
  },
});

module.exports = {
  PRODUCT_CATALOG,
  INVENTORY_STATUSES,
  RECORD_TYPES,
};
