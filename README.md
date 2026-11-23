# AJ Venta de entradas

PWA para la mesa de venta de entradas del **Curso de Protocolo XXII** de **Alfil Juvenil**. La gente se preinscribe en un Google Form y luego confirma y paga su plaza en persona. Desde la mesa, el staff busca a la persona, comprueba sus datos y confirma la plaza en un par de toques.

🔗 **App:** https://paulans17.github.io/AJ-venta-entradas/

## Cómo funciona

1. **Entrar** con tu nombre, para que quede registrado quién confirma cada plaza.
2. **Buscar** por DNI/NIE (lo valida y lo normaliza, por ejemplo `12.345.678-z → 12345678Z`). Si no lo encuentra, se puede buscar por apellidos.
3. **Ficha**: nombre y menú de la cena que eligió en el formulario.
4. **Confirmar**: el servidor le asigna un número de asistente y lo apunta en la hoja que usa la [app de asistencia](https://github.com/paulans17/AJ-app).

Otras cosas que hace:

- **Límite de 130 plazas**: al llegar al máximo se bloquea la confirmación, tanto en la app como en el servidor.
- Al completarse el aforo, la lista de asistentes **se ordena por apellidos y se renumera**.
- Las confirmaciones van dentro de un `LockService`, así que aunque haya dos móviles confirmando a la vez no se repiten números.
- Funciones para generar desde la hoja las pestañas de **confirmados** (carrera, curso, grupo) y de **cena** (menú, alergias y recuento de platos).
- El Google Form de preinscripción también se crea por script (`crearFormulario()`).

## Cómo está hecho

| Parte | Tecnología |
|---|---|
| Front | HTML, CSS y JavaScript vanilla, PWA |
| Backend | Google Apps Script (Web App que devuelve JSON) |
| Datos | Google Sheets + Google Forms |
| Hosting | GitHub Pages |

```
├── index.html, manifest.webmanifest, sw.js
├── css/app.css
├── js/
│   ├── app.js     → pantallas: entrar, buscar, ficha y confirmado
│   ├── api.js     → llamadas al Web App
│   ├── dni.js     → validación de DNI/NIE
│   └── config.js  → URL del Web App
└── apps-script/Code.gs   → buscar, confirmar, resumen y creación de hojas/forms
```

Los IDs de las hojas van en las *Script Properties* del proyecto de Apps Script, no en el código.
