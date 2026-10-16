/* Normalizar/validar DNI y NIE — misma lógica que normalizarDni/dniValido
   en apps-script/Code.gs */
const Dni = {
  // 12.345.678-z → 12345678Z
  normalizar(dni) {
    return String(dni || '').toUpperCase().replace(/[\s.\-]/g, '');
  },
  // DNI (8 cifras + letra) o NIE (X/Y/Z + 7 cifras + letra)
  valido(dni) {
    return /^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$/.test(dni);
  }
};
