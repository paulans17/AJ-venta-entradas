/* ============================================================
   Venta de entradas AJ — PANTALLAS Y NAVEGACIÓN
   Entrar → Buscar → Ficha → Confirmado (ver CLAUDE.md)
   ============================================================ */

const App = (() => {
  const KEY_STAFF = 'venta-staff';
  const $ = (sel) => document.querySelector(sel);
  const view = () => $('#view');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const staff = () => localStorage.getItem(KEY_STAFF);
  const MSG_SIN_CONEXION = 'Sin conexión, no se puede confirmar';
  let msgAgotadas = null; // texto si se ha llegado a PLAZAS_MAX (se bloquea confirmar)

  function toast(msg, isErr) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'show' + (isErr ? ' err' : '');
    clearTimeout(t._h);
    t._h = setTimeout(() => (t.className = ''), 2600);
  }

  function mostrarCargando(texto) {
    quitarCargando();
    const div = document.createElement('div');
    div.id = 'loading-cover';
    div.setAttribute('role', 'status');
    div.innerHTML = `<div class="spinner" aria-hidden="true"></div><span class="loading-label">${esc(texto)}</span>`;
    document.body.appendChild(div);
  }
  function quitarCargando() {
    const d = $('#loading-cover');
    if (d) d.remove();
  }

  function cabecera(kicker, titulo) {
    return `<div class="title-kicker">${esc(kicker)}</div>
      <h1 class="big-title">${esc(titulo)}</h1>
      <div class="gold-bar"></div>`;
  }

  /* ============================================================
     ENTRAR — solo el nombre, sin contraseña. Se guarda en localStorage.
     ============================================================ */
  function vEntrar() {
    view().innerHTML = `
      <div class="login-wrap">
        <img src="icons/icon-192.png" alt="Alfil Juvenil">
        <h1>VENTA DE ENTRADAS</h1>
        <p class="login-sub">Curso de Protocolo XXII<br>¿Quién está en la mesa?</p>
        <form id="f-entrar">
          <input id="i-nombre" type="text" placeholder="Tu nombre" autocomplete="off" autocapitalize="words" enterkeyhint="go">
          <button class="btn-gold btn-block" type="submit">Entrar</button>
        </form>
      </div>`;
    const input = $('#i-nombre');
    input.focus();
    $('#f-entrar').addEventListener('submit', (e) => {
      e.preventDefault();
      const nombre = input.value.trim();
      if (!nombre) return input.focus();
      localStorage.setItem(KEY_STAFF, nombre);
      toast(`Hola, ${nombre}`);
      go('buscar');
    });
  }

  /* ============================================================
     BUSCAR — campo grande para el DNI
     ============================================================ */
  function vBuscar() {
    view().innerHTML = `
      <div id="contador" class="contador">Confirmados …</div>
      ${cabecera('Mesa de venta', 'Buscar por DNI')}
      <form id="f-buscar">
        <input id="i-dni" class="big-dni" type="text" placeholder="12345678Z"
          inputmode="text" autocapitalize="characters" autocomplete="off" autocorrect="off"
          spellcheck="false" enterkeyhint="search" maxlength="15">
        <div id="err" class="err-msg"></div>
        <button class="btn-gold btn-block btn-big" type="submit">Buscar</button>
      </form>
      <button id="b-apellidos" class="btn-plain btn-block link-sm">Buscar por apellidos</button>`;
    const input = $('#i-dni');
    input.focus();
    $('#b-apellidos').addEventListener('click', () => vApellidos());
    cargarContador();
    $('#f-buscar').addEventListener('submit', async (e) => {
      e.preventDefault();
      const dni = Dni.normalizar(input.value);
      const err = $('#err');
      if (!Dni.valido(dni)) {
        err.textContent = 'DNI no válido: 8 cifras + letra, o NIE (X/Y/Z + 7 cifras + letra)';
        return input.focus();
      }
      err.textContent = '';
      abrirFicha(dni, err);
    });
  }

  async function abrirFicha(dni, err) {
    mostrarCargando('Buscando…');
    try {
      const r = await Api.buscar(dni);
      quitarCargando();
      vFicha(dni, r);
    } catch (ex) {
      quitarCargando();
      err.textContent = ex instanceof Api.SinConexion ? 'Sin conexión, no se puede buscar' : ex.message;
    }
  }

  // "Confirmados X / plazas" (sin plazas máximas configuradas: solo X)
  async function cargarContador() {
    try {
      const r = await Api.resumen();
      const el = $('#contador');
      if (!el) return;
      el.textContent = `Confirmados ${r.confirmados}` + (r.plazasMax ? ` / ${r.plazasMax}` : '');
    } catch (ex) {
      const el = $('#contador');
      if (el) el.textContent = 'Confirmados —';
    }
  }

  /* ============================================================
     BUSCAR POR APELLIDOS — plan B si el DNI no aparece
     ============================================================ */
  function vApellidos() {
    view().innerHTML = `
      ${cabecera('Plan B', 'Buscar por apellidos')}
      <form id="f-apellidos">
        <input id="i-apellidos" type="search" placeholder="Apellidos (ej. garr)" autocomplete="off"
          autocorrect="off" spellcheck="false" enterkeyhint="search">
        <div id="err" class="err-msg"></div>
        <button class="btn-gold btn-block" type="submit">Buscar</button>
      </form>
      <div id="resultados"></div>
      <button id="b-volver" class="btn-outline btn-block">← Buscar por DNI</button>`;
    const input = $('#i-apellidos');
    input.focus();
    $('#b-volver').addEventListener('click', () => go('buscar'));
    $('#f-apellidos').addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = $('#err');
      err.textContent = '';
      mostrarCargando('Buscando…');
      try {
        const r = await Api.buscarApellidos(input.value.trim());
        quitarCargando();
        const cont = $('#resultados');
        if (!r.resultados.length) {
          cont.innerHTML = `<div class="aviso error"><div class="av-title">Sin resultados</div></div>`;
          return;
        }
        cont.innerHTML = r.resultados.map((p) => `
          <button class="resultado" data-dni="${esc(p.dni)}">
            <span class="r-nombre">${esc(p.apellidos)}, ${esc(p.nombre)}</span>
            <span class="r-dni">${esc(p.dni)}</span>
          </button>`).join('');
        cont.querySelectorAll('[data-dni]').forEach((b) =>
          b.addEventListener('click', () => abrirFicha(b.dataset.dni, err))
        );
      } catch (ex) {
        quitarCargando();
        err.textContent = ex instanceof Api.SinConexion ? 'Sin conexión, no se puede buscar' : ex.message;
      }
    });
  }

  /* ============================================================
     FICHA — datos del forms + confirmar / ya confirmado / no encontrado
     ============================================================ */
  function vFicha(dni, r) {
    let cuerpo;
    if (!r.encontrado) {
      cuerpo = `
        <div class="aviso error">
          <div class="av-title">No encontrado</div>
          <div class="av-sub">No hay ninguna preinscripción con el DNI ${esc(dni)}</div>
        </div>
        <button id="b-apellidos" class="btn-gold btn-block">Buscar por apellidos</button>`;
    } else {
      cuerpo = `
        <div class="card">
          <div class="ficha-row"><div class="fr-label">Nombre</div><div class="fr-value">${esc(r.nombre)}</div></div>
          <div class="ficha-row"><div class="fr-label">Apellidos</div><div class="fr-value">${esc(r.apellidos)}</div></div>
          <div class="ficha-row"><div class="fr-label">DNI</div><div class="fr-value">${esc(dni)}</div></div>
          <div class="ficha-row"><div class="fr-label">Menú de la cena</div><div class="fr-value">${esc(r.menu || 'Solo curso')}</div></div>
        </div>
        ${r.duplicadoEnForms ? `<div class="aviso info">Rellenó el forms más de una vez: se muestra la respuesta más reciente.</div>` : ''}
        ${r.yaConfirmado ? `
          <div class="aviso warn">
            <div class="av-title">Ya confirmado</div>
            <div class="av-num">${esc(r.numero)}</div>
            <div class="av-sub">Esta persona ya tiene número</div>
          </div>` : `
          <div id="err" class="err-msg"></div>
          <button id="b-confirmar" class="btn-gold btn-block btn-big">Confirmar plaza</button>`}`;
    }

    view().innerHTML = `
      ${cabecera('Ficha', r.encontrado ? `${r.nombre} ${r.apellidos}` : dni)}
      ${cuerpo}
      <button id="b-volver" class="btn-outline btn-block">← Buscar otro DNI</button>`;

    $('#b-volver').addEventListener('click', () => go('buscar'));
    const ba = $('#b-apellidos');
    if (ba) ba.addEventListener('click', () => vApellidos());

    const b = $('#b-confirmar');
    if (!b) return;
    msgAgotadas = null;
    actualizarBotonConfirmar();
    comprobarPlazas();

    // Segundo toque de "¿Seguro?" para no confirmar sin querer
    let armado = false, h;
    b.addEventListener('click', async () => {
      if (!navigator.onLine) return actualizarBotonConfirmar();
      if (!armado) {
        armado = true;
        b.textContent = '¿Seguro? Toca otra vez';
        b.className = 'btn-warn btn-block btn-big';
        h = setTimeout(() => {
          armado = false;
          b.textContent = 'Confirmar plaza';
          b.className = 'btn-gold btn-block btn-big';
        }, 4000);
        return;
      }
      clearTimeout(h);
      mostrarCargando('Confirmando…');
      try {
        const c = await Api.confirmar(dni, staff());
        quitarCargando();
        if (c.ok) return vConfirmado(c.numero, `${r.nombre} ${r.apellidos}`);
        // Otro móvil lo confirmó mientras tanto, o ya no está en el forms
        if (c.yaConfirmado) return vFicha(dni, Object.assign({}, r, { yaConfirmado: true, numero: c.numero }));
        if (c.completo) {
          armado = false;
          b.textContent = 'Confirmar plaza';
          b.className = 'btn-gold btn-block btn-big';
          msgAgotadas = `Plazas agotadas (${c.confirmados} / ${c.plazasMax}), no se puede confirmar`;
          return actualizarBotonConfirmar();
        }
        return vFicha(dni, { encontrado: false });
      } catch (ex) {
        quitarCargando();
        armado = false;
        b.textContent = 'Confirmar plaza';
        b.className = 'btn-gold btn-block btn-big';
        $('#err').textContent = ex instanceof Api.SinConexion ? MSG_SIN_CONEXION : ex.message;
      }
    });
  }

  // Sin conexión o con las plazas agotadas no se deja confirmar (el número
  // tiene que salir del servidor, y el servidor también lo bloquea)
  function actualizarBotonConfirmar() {
    const b = $('#b-confirmar');
    if (!b) return;
    b.disabled = !navigator.onLine || !!msgAgotadas;
    $('#err').textContent = msgAgotadas || (navigator.onLine ? '' : MSG_SIN_CONEXION);
  }

  async function comprobarPlazas() {
    try {
      const r = await Api.resumen();
      if (r.plazasMax && r.confirmados >= r.plazasMax) {
        msgAgotadas = `Plazas agotadas (${r.confirmados} / ${r.plazasMax}), no se puede confirmar`;
        actualizarBotonConfirmar();
      }
    } catch (ex) { /* si falla, el servidor lo bloquea igual al confirmar */ }
  }

  /* ============================================================
     CONFIRMADO — el número en grande
     ============================================================ */
  function vConfirmado(numero, nombre) {
    view().innerHTML = `
      <div class="confirmado">
        <div class="c-label">Plaza confirmada</div>
        <div class="c-num">${esc(numero)}</div>
        <div class="c-name">${esc(nombre)}</div>
        <button id="b-siguiente" class="btn-block btn-big">Siguiente</button>
      </div>`;
    if (navigator.vibrate) navigator.vibrate(80);
    $('#b-siguiente').addEventListener('click', () => go('buscar'));
  }

  /* ============================================================
     NAVEGACIÓN
     ============================================================ */
  function go(ruta) {
    quitarCargando();
    if (!staff()) ruta = 'entrar';
    $('#topbar').classList.toggle('hidden', ruta === 'entrar');
    if (ruta === 'entrar') vEntrar();
    else vBuscar();
    actualizarChips();
    window.scrollTo(0, 0);
  }

  function actualizarChips() {
    const net = $('#net-status');
    const online = navigator.onLine;
    net.textContent = online ? '● en línea' : '○ sin conexión';
    net.className = 'pill ' + (online ? 'pill-ok' : 'pill-off');
    const uc = $('#user-chip');
    const u = staff();
    uc.textContent = u ? u + ' · Salir' : '';
    uc.classList.toggle('hidden', !u);
  }

  function init() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
    const red = () => { actualizarChips(); actualizarBotonConfirmar(); };
    window.addEventListener('online', red);
    window.addEventListener('offline', red);
    $('#user-chip').addEventListener('click', () => {
      const u = staff();
      if (u && confirm(`¿Cerrar sesión de ${u}?`)) {
        localStorage.removeItem(KEY_STAFF);
        go('entrar');
      }
    });
    go('buscar');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', App.init);
