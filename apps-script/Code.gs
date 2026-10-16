/**
 * AJ Venta Entradas XXII — proyecto de Apps Script standalone.
 *
 * Independiente del check-in de la app de staff (no se toca, D21 de
 * staff-ajapp-pwa). Abre las hojas por ID, que van en Script Properties:
 *   ID_HOJA_FORMS       → "Preinscripcion XXII"
 *   ID_HOJA_ASISTENTES  → hoja de asistentes de la app de staff
 */

const PROPS = PropertiesService.getScriptProperties();

const PESTANA_RESPUESTAS = 'Respuestas de formulario 1';
const PESTANA_CONFIRMACIONES = 'confirmaciones';
const PESTANA_ASISTENTES = 'asistentes';
const CABECERA_CONFIRMACIONES = ['DNI', 'NÚMERO', 'NOMBRE', 'TIMESTAMP', 'STAFF'];

/***** ========================== ENDPOINT ========================== *****/

function doGet(e) {
  const p = (e && e.parameter) || {};
  try {
    switch (p.action) {
      case 'buscar':    return _json(buscar(p.dni));
      case 'confirmar': return _json(confirmar(p.dni, p.staff));
      case 'buscarApellidos': return _json(buscarApellidos(p.q));
      case 'resumen':   return _json(resumen());
      default:          return _json({ error: 'Acción desconocida' });
    }
  } catch (err) {
    return _json({ error: String(err && err.message || err) });
  }
}

// ContentService y no HtmlService: HtmlService no manda cabecera CORS y el
// fetch() del navegador lo bloquea (descubierto con la app de staff).
function _json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/***** ============================ DNI ============================ *****/

// 12.345.678-z → 12345678Z
function normalizarDni(dni) {
  return String(dni || '').toUpperCase().replace(/[\s.\-]/g, '');
}

// DNI (8 cifras + letra) o NIE (X/Y/Z + 7 cifras + letra)
function dniValido(dni) {
  return /^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$/.test(dni);
}

/***** =========================== BUSCAR =========================== *****/

function buscar(dniBruto) {
  const dni = normalizarDni(dniBruto);
  if (!dniValido(dni)) return { error: 'DNI no válido' };

  const ssForms = SpreadsheetApp.openById(PROPS.getProperty('ID_HOJA_FORMS'));
  const ficha = _buscarEnForms(ssForms, dni);
  if (!ficha) return { encontrado: false };

  const conf = _buscarConfirmacion(ssForms, dni);
  const res = {
    encontrado: true,
    nombre: ficha.nombre,
    apellidos: ficha.apellidos,
    menu: ficha.menu,
    yaConfirmado: !!conf,
  };
  if (conf) res.numero = conf.numero;
  if (ficha.duplicado) res.duplicadoEnForms = true;
  return res;
}

// Devuelve la respuesta más reciente con ese DNI (las filas del forms van
// en orden de llegada, así que la última que coincide es la más reciente).
function _buscarEnForms(ssForms, dni) {
  const t = _tablaRespuestas(ssForms);
  const datos = t.datos, col = t.col;

  let ultima = null;
  let coincidencias = 0;
  for (let i = 1; i < datos.length; i++) {
    if (normalizarDni(datos[i][col.dni]) === dni) {
      ultima = datos[i];
      coincidencias++;
    }
  }
  if (!ultima) return null;

  return {
    apellidos: String(ultima[col.apellidos]).trim(),
    nombre: String(ultima[col.nombre]).trim(),
    menu: col.menu >= 0 ? String(ultima[col.menu]).trim() : '',
    duplicado: coincidencias > 1,
  };
}

// Lee las respuestas del forms y localiza las columnas por su título
function _tablaRespuestas(ssForms) {
  const sh = ssForms.getSheetByName(PESTANA_RESPUESTAS);
  if (!sh) throw new Error('Falta la pestaña "' + PESTANA_RESPUESTAS + '"');
  const datos = sh.getDataRange().getValues();
  const cab = datos[0].map(function (c) { return String(c).trim(); });
  const col = {
    dni: cab.indexOf('DNI'),
    apellidos: cab.indexOf('Apellidos'),
    nombre: cab.indexOf('Nombre'),
    menu: cab.indexOf('Seleccione menú'),
  };
  if (col.dni < 0 || col.apellidos < 0 || col.nombre < 0) {
    throw new Error('Faltan columnas DNI/Apellidos/Nombre en las respuestas');
  }
  return { datos: datos, col: col };
}

function _pestanaConfirmaciones(ssForms) {
  let sh = ssForms.getSheetByName(PESTANA_CONFIRMACIONES);
  if (!sh) {
    sh = ssForms.insertSheet(PESTANA_CONFIRMACIONES);
    sh.appendRow(CABECERA_CONFIRMACIONES);
  }
  return sh;
}

function _buscarConfirmacion(ssForms, dni) {
  const sh = ssForms.getSheetByName(PESTANA_CONFIRMACIONES);
  if (!sh || sh.getLastRow() < 2) return null;
  const filas = sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues();
  for (let i = 0; i < filas.length; i++) {
    if (normalizarDni(filas[i][0]) === dni) return { numero: filas[i][1] };
  }
  return null;
}

/***** ===================== BUSCAR POR APELLIDOS ===================== *****/

// Para comparar sin mayúsculas ni tildes: "López" ~ "lopez"
function _plano(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

// Plan B si el DNI no aparece: hasta 10 coincidencias por apellidos. Si
// alguien rellenó el forms dos veces sale una sola vez (la más reciente).
function buscarApellidos(qBruto) {
  const q = _plano(qBruto);
  if (q.length < 2) return { error: 'Escribe al menos 2 letras' };

  const ssForms = SpreadsheetApp.openById(PROPS.getProperty('ID_HOJA_FORMS'));
  const t = _tablaRespuestas(ssForms);
  const porDni = {};
  for (let i = 1; i < t.datos.length; i++) {
    const fila = t.datos[i];
    if (_plano(fila[t.col.apellidos]).indexOf(q) < 0) continue;
    const dni = normalizarDni(fila[t.col.dni]);
    delete porDni[dni]; // así la más reciente queda al final del orden
    porDni[dni] = {
      dni: dni,
      nombre: String(fila[t.col.nombre]).trim(),
      apellidos: String(fila[t.col.apellidos]).trim(),
    };
  }
  const resultados = Object.keys(porDni).map(function (k) { return porDni[k]; });
  return { resultados: resultados.slice(0, 10) };
}

/***** =========================== RESUMEN =========================== *****/

// Para el contador de la pantalla: {confirmados, preinscritos, plazasMax}
function resumen() {
  const ssForms = SpreadsheetApp.openById(PROPS.getProperty('ID_HOJA_FORMS'));
  const shConf = ssForms.getSheetByName(PESTANA_CONFIRMACIONES);
  const confirmados = shConf ? Math.max(shConf.getLastRow() - 1, 0) : 0;

  const t = _tablaRespuestas(ssForms);
  const dnis = {};
  for (let i = 1; i < t.datos.length; i++) {
    const dni = normalizarDni(t.datos[i][t.col.dni]);
    if (dni) dnis[dni] = true;
  }

  const plazas = Number(PROPS.getProperty('PLAZAS_MAX'));
  return {
    confirmados: confirmados,
    preinscritos: Object.keys(dnis).length,
    plazasMax: plazas > 0 ? plazas : null,
  };
}

/***** ========================= CONFIRMAR ========================= *****/

function confirmar(dniBruto, staffBruto) {
  const dni = normalizarDni(dniBruto);
  if (!dniValido(dni)) return { error: 'DNI no válido' };
  const staff = String(staffBruto || '').trim();
  if (!staff) return { error: 'Falta el nombre del staff' };

  // Varios móviles confirmando a la vez: sin bloqueo dos personas se
  // llevarían el mismo número (el bug de la XXI).
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'Servidor ocupado, vuelve a intentarlo' };
  try {
    const ssForms = SpreadsheetApp.openById(PROPS.getProperty('ID_HOJA_FORMS'));

    // 1. Ya confirmado → no se escribe nada
    const conf = _buscarConfirmacion(ssForms, dni);
    if (conf) return { yaConfirmado: true, numero: conf.numero };

    const ficha = _buscarEnForms(ssForms, dni);
    if (!ficha) return { encontrado: false };

    // Plazas agotadas → no se confirma (decisión de Pau: bloquear, no avisar)
    const plazas = Number(PROPS.getProperty('PLAZAS_MAX'));
    if (plazas > 0) {
      const shConf = ssForms.getSheetByName(PESTANA_CONFIRMACIONES);
      const confirmados = shConf ? Math.max(shConf.getLastRow() - 1, 0) : 0;
      if (confirmados >= plazas) return { completo: true, confirmados: confirmados, plazasMax: plazas };
    }

    const nombreCompleto = ficha.apellidos + ', ' + ficha.nombre;

    // 2. Siguiente número = máximo numérico de asistentes!A + 1
    const ssAsis = SpreadsheetApp.openById(PROPS.getProperty('ID_HOJA_ASISTENTES'));
    const shAsis = ssAsis.getSheetByName(PESTANA_ASISTENTES);
    if (!shAsis) throw new Error('Falta la pestaña "' + PESTANA_ASISTENTES + '"');
    let max = 0;
    if (shAsis.getLastRow() >= 2) {
      shAsis.getRange(2, 1, shAsis.getLastRow() - 1, 1).getValues().forEach(function (r) {
        const n = Number(String(r[0]).trim());
        if (String(r[0]).trim() !== '' && isFinite(n) && n > max) max = n;
      });
    }
    const numero = max + 1;

    // 3. y 4. Escribir en asistentes y en confirmaciones
    shAsis.appendRow([numero, nombreCompleto]);
    const ts = Utilities.formatDate(new Date(), 'Europe/Madrid', 'yyyy-MM-dd HH:mm:ss');
    const shConf = _pestanaConfirmaciones(ssForms);
    shConf.appendRow([dni, numero, nombreCompleto, ts, staff]);
    SpreadsheetApp.flush();

    // 5. Con la última plaza: ordenar asistentes por apellidos y renumerar
    //    1, 2, 3... (decisión de Pau). Devuelve el número nuevo.
    if (plazas > 0 && shConf.getLastRow() - 1 >= plazas) {
      const nuevos = _ordenarYRenumerar(shAsis, shConf);
      return { ok: true, numero: nuevos[String(numero)], nombre: ficha.nombre, renumerado: true };
    }

    return { ok: true, numero: numero, nombre: ficha.nombre };
  } finally {
    lock.releaseLock();
  }
}

/**
 * Ordena asistentes (A2:B) por la columna B ("Apellidos, Nombre") y pone en
 * la columna A 1, 2, 3... en ese orden. Actualiza también el número de
 * confirmaciones (columna B) para que buscar devuelva el número nuevo.
 * Devuelve {numeroViejo: numeroNuevo}.
 */
function _ordenarYRenumerar(shAsis, shConf) {
  const n = shAsis.getLastRow() - 1;
  if (n < 1) return {};
  const rango = shAsis.getRange(2, 1, n, 2);
  rango.sort({ column: 2, ascending: true });

  const viejos = shAsis.getRange(2, 1, n, 1).getValues();
  const mapa = {};
  const nuevos = viejos.map(function (r, i) {
    mapa[String(r[0]).trim()] = i + 1;
    return [i + 1];
  });
  shAsis.getRange(2, 1, n, 1).setValues(nuevos);

  if (shConf.getLastRow() >= 2) {
    const rc = shConf.getRange(2, 2, shConf.getLastRow() - 1, 1);
    rc.setValues(rc.getValues().map(function (r) {
      const nuevo = mapa[String(r[0]).trim()];
      return [nuevo != null ? nuevo : r[0]];
    }));
  }
  SpreadsheetApp.flush();
  return mapa;
}

/**
 * Crea el Google Forms de preinscripción y conecta sus respuestas a la
 * hoja "Preinscripcion XXII". Se ejecuta UNA SOLA VEZ desde el editor.
 * Sin onFormSubmit, sin correos, sin IDs ni QRs.
 */
function crearFormulario() {
  const idHojaForms = PROPS.getProperty('ID_HOJA_FORMS');
  if (!idHojaForms) throw new Error('Falta la Script Property ID_HOJA_FORMS');

  const form = FormApp.create('Preinscripción Curso de Protocolo XXII');
  form.setDescription(
    'Esto es una PREINSCRIPCIÓN. Tu plaza no está confirmada hasta que pases ' +
    'por la mesa de venta de entradas con tu DNI y el justificante de pago.'
  );
  form.setCollectEmail(false);

  // --- Sección 1: datos personales ---
  form.addTextItem().setTitle('Apellidos').setRequired(true);
  form.addTextItem().setTitle('Nombre').setRequired(true);

  form.addTextItem()
    .setTitle('DNI')
    .setHelpText('Sin espacios ni guiones, con la letra')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation()
      .requireTextMatchesPattern('^([0-9]{8}|[XYZxyz][0-9]{7})[A-Za-z]$')
      .build());

  form.addTextItem()
    .setTitle('E-mail')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());

  form.addDateItem().setTitle('Fecha de nacimiento').setRequired(true);

  const actividades = form.addMultipleChoiceItem()
    .setTitle('¿A qué actividades desea inscribirse?')
    .setRequired(true);

  form.addTextItem()
    .setTitle('¿Posee alguna alergia o problema alimenticio?')
    .setRequired(false);

  // --- Sección 2: menú (solo "Curso + cena") ---
  const seccionMenu = form.addPageBreakItem().setTitle('Menú de la cena');

  const menu = form.addMultipleChoiceItem()
    .setTitle('Seleccione menú')
    .setRequired(true);
  menu.setChoices([
    menu.createChoice('Secreto al Pedro Ximénez con patatas fritas'),
    menu.createChoice('Salmón a la plancha con patatas panaderas'),
    menu.createChoice('Vegetariano'),
  ]);

  // --- Sección 3: estudios y condiciones ---
  const seccionEstudios = form.addPageBreakItem().setTitle('Estudios y condiciones');

  actividades.setChoices([
    actividades.createChoice('Curso', seccionEstudios),
    actividades.createChoice('Curso + cena', seccionMenu),
  ]);

  const campus = form.addMultipleChoiceItem()
    .setTitle('¿Estudia en el Campus María Zambrano de la Universidad de Valladolid?')
    .setRequired(true);
  campus.setChoiceValues(['Sí', 'No']);

  form.addTextItem()
    .setTitle('¿Qué estudios universitarios cursa?')
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('¿En qué curso se encuentra?')
    .setRequired(true)
    .setChoiceValues(['1º', '2º', '3º', '4º', 'Máster', 'Otro']);

  form.addTextItem()
    .setTitle('¿En qué grupo se encuentra?')
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle('Términos y condiciones')
    .setHelpText(TERMINOS)
    .setRequired(true)
    .setChoiceValues(['He leído y acepto los términos y condiciones']);

  form.addMultipleChoiceItem()
    .setTitle('¿Ha realizado el curso en anteriores ediciones?')
    .setRequired(true)
    .setChoiceValues(['Sí', 'No']);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, idHojaForms);

  Logger.log('Edición: ' + form.getEditUrl());
  Logger.log('Pública: ' + form.getPublishedUrl());
}

const TERMINOS = [
  'Términos y condiciones de participación:',
  '',
  '• La participación en el curso conlleva la obtención de un (1) crédito ECTS siempre que se asista, al menos, al 80% de las ponencias.',
  '• En caso de anulación de la inscripción por parte del participante, no se realizará devolución del coste del curso salvo causa de fuerza mayor debidamente justificada.',
  '• Durante el desarrollo de las actividades se exigirá un comportamiento respetuoso hacia el personal de la organización, ponentes, y demás participantes. El organizador se reserva el derecho de expulsión a quienes incumplan esta norma.',
  '• Queda prohibido el consumo de bebidas alcohólicas por parte de menores de 18 años durante el curso, conforme a la legislación vigente.',
  '• El organizador no se hace responsable de los objetos personales extraviados ni de los daños que pudieran derivarse de un uso indebido de las instalaciones.',
  '• El organizador se reserva el derecho a modificar el programa, fechas o formato del curso, comunicándolo con antelación razonable a los participantes. En caso de cancelación definitiva, se informará a los participantes de las medidas compensatorias pertinentes.',
  '• Para cualquier duda o consulta, utilice los canales de comunicación oficiales: @alfiljuvenil (Instagram) y contacto@alfiljuvenil.com (e-mail).',
  '• Para más información, consulte la página web del organizador: www.alfiljuvenil.com',
].join('\n');
