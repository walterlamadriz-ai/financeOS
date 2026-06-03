// src/utils/licenseValidator.js
// Validación local de licencias FinanceOS v1.2
// Sin backend. SHA-256 local. Funciona offline.
// IMPORTANTE: No exponer las claves en texto plano.

const VALID_HASHES = [
  "1c67e4662b952b7cd7c4ddcc6ff8ed6a4e7133018501a91df6621b6cb53399b4",
  "b4711036f087f55ed66500a9b846e0930b9d21459869a5e94bb8a14b4e0ad040",
  "538565b74eb961a136678a341b516386fb43ccae8d9ca3a8307e38851587b883",
  "88c5a75f1d830f3a0fdee07684b6e257b099bc3dcba591a1891dd102e8520042",
  "ec06af6af0443620dc50de42a7aaca2925436a4aa501286705a992607308c757",
  "1a975ad4942a5f1bae52dc25aae465952ba5fd93ced81b62f8e06cf01d56581a",
  "fcee1b4d142b735033ba43dfec8db87a8a8680c27ee4ada527b3a9ecc636d0c6",
  "3fd3fd0d720b906ffe697f91958c35c553fd4c878a30a6b4c58e9ae5038a4e14",
  "2789e62fb1627c47902db0c152c75e0e91e2d78546dde4cbfd464efa3d54357e",
  "37a7dddaa5e90e5125352269adcd796f5446875d8916a1ae0122a4f3e45aaa52",
  "718644100ca0fe3d48b15afa75298a9760a299a961614ded8f34feadf1755df6",
  "2b148c3bccd0da0b9934e3c2de5f797441fc0fef811b282e169f06f3c694f946",
  "f6fb07d2022c59bd165fbaaf31ac96cb31f5d27aa8944b95676f6f2c7fb57300",
  "70a481216553708c94ded7ad517b2ecc1a01b73a39f4d113081f455bd9ff19fc",
  "9c8d241673647ae90f84a7bbf3665c316ec07d3add944b7fcfbfd86fdef0d560",
  "08194b4f9f3bd1d7f88152ef657cb9950947413620805f6559923c574f150188",
  "1617d772a870adcaee6df49fa53e55ecd6f74c9135292b3499db3b46e647171f",
  "d63d11a41d26a5187fc5e8e2183faa60893975bce9347b47b5f69f1a329b42d5",
  "87fff7903f961f5e9b0000005d2248b84d05a98da8bd10eff462960eced787ab",
  "cfea8dbe317505f629d3301eab9e101acd105d7e24f49f5b41f3ee30f8d9df50",
  "9fac474c47db9ae20355b8baaf95e1562c32008add4a3e11f204a00726dfdeaf",
  "5af10c3898929e169673e6342e09d5796f77e39ea855b6b084c11dbbf70b976b",
  "1c743c35b0dc82239a62df4e4ea2ece84272b4e9fe93662f8628608ec77e9a67",
  "308aeee016f0fe55e29c7acc9045da8b5d7445ff301ef6db306ff4ded0ee3630",
  "25cb3eb5cb5aad7df82b11cb403604a2f1dba30fa31bb9a4bf76837b5bb35ac8",
  "1670b87008b4840f6566111e35f9483bf4d7fa854264bf0e278520b7b0b64c39",
  "f87673e57cf900ccd159e63c678a645fadf3e515f5285ea8ae24b8c2c10fbc1e",
  "5c036b82cc5e3f2c5f7cd1d5adecc704e14b455ffae22cf05a98a39edda44e0c",
  "0ea4af72e2ab563863c4cf1e1501523136976813e85b2c5d7fecb499f7e3a6fc",
  "13e2f1ac877f7eb512614358c39abb544c8188923f645d38e8911aab37d682c9",
  "399f63ab6e9bd20e3f49b20eeba30de078adad4e31c5433cc50dea846e52e748",
  "c20d0294a87df8c23332f3a9ecc0604c87f8652169ddc614f11ec1a980ae5100",
  "3b4aad4621b7edc083669f011fae33dced81e3b94ad0caa00e893ca816c85148",
  "f878a9c83b24acde55035f2bea96e5eb5fccfc80d1c9aac1aa321e161323c5c5",
  "42c33e9de79b567479d5791dadc63a6a07fc5c01e0eb2a2bc577b0a844117733",
  "7a3bbbe44000455f5d15c313a6f5b80d3ccf6108383ef951a95ee1e56ec12d1d",
  "d3e7bc43c209fc4c7f8a7a7b6f09c494af8e3c98a353d47c1f7e135251d3b340",
  "cdb80f1c2be3dbdd062c6f411e6fda6f6e788ca1b14ec5b5625eeb529436aa9a",
  "3ee785018192499c8ab9e1fc1d0dc958d1f270807178bda082d1a454dbc7da86",
  "9f3d45dcc7c2623aa51e8f2c1d7e34c960ddf84f92ad7aa69a02e1884b1ece90",
  "5c80e9c0378dbda8b2bc13cb86981ce3097709bb8700b1e592e9cd6d8847259c",
  "47fb906ce2dad59446edcca69dd775eac27bdbdddaa91a4ce39acf82f7e4f1b0",
  "82a3bf08b1691618920575a799e5ea990d629302327e20fb030cc1bebf20decc",
  "718be855bf6feaca7b74d95da6292be689e6c8d163df1d71faeec1204b167ae9",
  "b5fa66fe52175831730f07f73dca36a76e1e29b0e1e8133d16e9eb2119daf519",
  "ae7a64177ea3f69bec54fc78e65a3ad694442c48063bc96de99eb8130c3ab070",
  "cd90f101eb90e58f8fc2f0f8c86974059c0864b846ba6ef64ead82c0f8820880",
  "af3941f4e6d9e25d7ab7eed3234edbb8cacf6d779ba3db3d688483a1d05dc321",
  "74b5a6eee73f27c6e5f6375af8c02ce651af0f9c139304d7291ba20261db0a71",
  "6130872ec5ee952e55d96445aabf54afa626156d277c70afcbaf0b497023897b",
]

const LS_KEY = 'fnos_license_v1'

async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export async function validateLicense(key) {
  if (!key) return false
  const clean = key.trim().toUpperCase()
  const hash = await sha256hex(clean)
  return VALID_HASHES.includes(hash)
}

export function saveLicense(key) {
  localStorage.setItem(LS_KEY, key.trim().toUpperCase())
}

export function isLicenseActive() {
  return !!localStorage.getItem(LS_KEY)
}

export function getLicenseKey() {
  return localStorage.getItem(LS_KEY) || ''
}

export function clearLicense() {
  localStorage.removeItem(LS_KEY)
}
