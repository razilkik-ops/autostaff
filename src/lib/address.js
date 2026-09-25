export function addressLine(address) {
  return [address.postalCode, address.city, address.street, address.apartment].filter(Boolean).join(", ");
}
