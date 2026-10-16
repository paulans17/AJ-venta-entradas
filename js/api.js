/* Llamadas al Web App. GET con query string y sin headers custom (así no
   hay preflight CORS). Siempre online: no hay cola offline. */
const Api = (() => {
  class SinConexion extends Error {}

  async function llamar(params) {
    if (!navigator.onLine) throw new SinConexion();
    const url = CONFIG.API_URL + '?' + new URLSearchParams(params).toString();
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20000);
    let res;
    try {
      res = await fetch(url, { signal: ctrl.signal });
    } catch (e) {
      throw new SinConexion();
    } finally {
      clearTimeout(t);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  }

  return {
    SinConexion,
    buscar: (dni) => llamar({ action: 'buscar', dni }),
    confirmar: (dni, staff) => llamar({ action: 'confirmar', dni, staff }),
    buscarApellidos: (q) => llamar({ action: 'buscarApellidos', q }),
    resumen: () => llamar({ action: 'resumen' })
  };
})();
