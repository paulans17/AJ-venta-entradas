# URLs — Venta de entradas XXII

## Proyecto de Apps Script "AJ Venta Entradas XXII" (standalone)

```
https://script.google.com/d/1nLDe8AyUp3lil6-yfCgfiEP8WaB2TK8lCEB5NLIqAQNHT73ZSmCM4Jd8/edit
```

## Google Forms "Preinscripción Curso de Protocolo XXII"

Creado con `crearFormulario()` el 2026-10-15. Respuestas en la pestaña
"Respuestas de formulario 1" de "Preinscripcion XXII".

- Edición: https://docs.google.com/forms/d/1cpvcboQrfwwoKTtVz6g2REgudp7LjAA93EkSdbQsueI/edit
- Pública: https://docs.google.com/forms/d/e/1FAIpQLSdkkEMq7lFBoDQOsk1rxz0T06ozyYie0McZJ9CrPqziKGDChA/viewform

## Web App

Desplegado con `clasp create-deployment` el 2026-10-15. Para subir cambios
sin cambiar la URL: `clasp push --force` y
`clasp update-deployment <ID de abajo>`.

```
https://script.google.com/macros/s/AKfycbyGrxD4qShn5nJFTSuZiYThs48wiWFvnExhZ9gPJOZcOzf_uybRw0SIeTY3NQhpBrz4/exec
```

Ojo: en `appsscript.json` el acceso tiene que ser `ANYONE_ANONYMOUS`
("Cualquier usuario" en el editor). Con `ANYONE` pide iniciar sesión en
Google y el `fetch()` de la PWA no funciona.

## PWA (GitHub Pages)

Repo: https://github.com/paulans17/AJ-venta-entradas (rama `main`, raíz).

```
https://paulans17.github.io/AJ-venta-entradas/
```

`CLAUDE.md` no se sube (está en `.gitignore`): lleva los IDs de las hojas,
que ahora mismo se pueden abrir con el enlace.
