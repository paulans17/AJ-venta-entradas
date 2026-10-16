# Decisiones — Venta de entradas AJ (Curso de Protocolo XXII)

Las decisiones de partida están en `CLAUDE.md` (local, no se sube al repo):
cero correos automáticos, preinscripción por forms y confirmación en
persona en la mesa, búsqueda por DNI con apellidos como plan B, número
asignado por el servidor dentro de `LockService`, y la app de staff
(`../staff-ajapp-pwa/`) sin tocar.

Aquí van las que se tomaron después, hablando con Pau.

## 2026-10-15

**D1. Forms creado por script.** `crearFormulario()` lo creó una vez y lo
conectó a "Preinscripcion XXII" (pestaña "Respuestas de formulario 1").
Títulos de sección: "Menú de la cena" y "Estudios y condiciones". URLs en
`DEPLOY_URLS.md`.

**D2. Se prueba en las hojas reales, no en copias.** Pau: "se hace todo en
el bueno y se prueba ahí y luego ya se borran los datos". Los datos de
prueba llevan apellidos "Prueba …" y DNIs `0000000…`, y se borran al final
con el ok de Pau.

**D3. Los confirmados van a "MIEMBROS CURSO PROTOCOLO XXI"**, la misma
hoja que usa la app de staff (`ID_HOJA_ASISTENTES`). Pau vació a mano
`asistentes` y `asistencias` (los nombres de la XXI) antes de las pruebas.
Los ponentes de `tabla` y la sesión de `Config` los cambiará Pau.

**D4. La pestaña `confirmaciones` la crea el script** la primera vez que
confirma, con cabecera `DNI, NÚMERO, NOMBRE, TIMESTAMP, STAFF`.

**D5. Web App con acceso `ANYONE_ANONYMOUS`.** Con `ANYONE` Google pide
iniciar sesión y la PWA no puede llamarlo.

**D6. 130 plazas, y al llegar se bloquea** (no solo avisa). `PLAZAS_MAX`
va en Script Properties. El bloqueo está en el servidor (dentro del lock)
y en la PWA (botón desactivado con "Plazas agotadas").

**D7. Al confirmar la plaza 130, `asistentes` se ordena por apellidos y se
renumera 1, 2, 3…** (decisión de Pau, como estaba la lista en la XXI).
También se actualizan los números de `confirmaciones`, y a la persona 130
se le enseña su número nuevo. Consecuencia: los números que se dan en la
mesa antes de completar son provisionales. Si no se llega a 130, no se
reordena. Probado con `PLAZAS_MAX` = 5.

**D8. Entrar con nombre libre** (campo de texto), porque no hay lista del
equipo de la mesa.

## 2026-10-16

**D9. PWA en GitHub Pages**, repo público `paulans17/AJ-venta-entradas`,
igual que la app de staff. `CLAUDE.md` no se sube porque lleva los IDs de
las hojas, que ahora se pueden abrir con el enlace.

**D10. Sin clave del equipo.** La URL del Web App es pública y `buscar`
devuelve nombre y menú a partir de un DNI. Pau lo acepta, como en la app
de staff (D17 de allí).

**D11. Sin alergias en la ficha y sin guardar el método de pago.**

## Pendiente

- Prueba completa con Pau desde el móvil.
- Borrar los datos de prueba (con el ok de Pau).
- Antes de abrir el forms al público: Pau restringe los permisos de
  "Preinscripcion XXII" e "Inscripciones Protocolo XXI Edición".
