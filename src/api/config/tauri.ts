import pkg from "@/../src-tauri/tauri.conf.json";

export const Tauri = {
  Version: pkg.version,
  Issuer: pkg.identifier,
  Name: pkg.productName,
}; // used for issuer header
