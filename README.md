# Reps

Tu app personal de ejercicio: Push, Pull y Legs. Reps, variantes y peso añadido en **libras**. Gratis, sin anuncios, cuentas de usuario ni rastreadores.

**Abrir:** https://tefomars.github.io/ahorita-reps/

## Instalar y actualizar en el iPhone

1. Abre el enlace en Safari.
2. Compartir → Agregar a pantalla de inicio.
3. Activa «Abrir como app web» si aparece y agrega Reps.
4. Abre una vez con internet. Ajustes → Revisar modo sin conexión confirma si está preparada.

Para actualizar, **conserva el icono**: cierra y vuelve a abrir con internet. Si está abierta mientras se publica una versión, puede requerir cerrarla y abrirla otra vez después de unos segundos. **Eliminar y reinstalar puede borrar el historial.** Safari y el icono instalado pueden tener almacenamiento separado.

## Hoy: registrar sin complicaciones

- +1, +5 y +10 suman una serie del ejercicio y peso seleccionados. Personaliza los tres botones en Ajustes.
- Toca el nombre del ejercicio para cambiar variante y libras.
- ··· permite registrar otra cantidad. También admite ejercicios con un nombre propio.
- Toca la meta para editarla. Cambia el objetivo de hoy y el objetivo base para futuros días de entrenamiento. 0 es descanso.
- Dos mancuernas de 15 lb se registran como **+30 lb**: peso añadido total.
- Legs cuenta por pierna. «Ambas» suma la cantidad a cada lado; también admite solo izquierda o derecha. El contador usa el lado con menos reps para completar la meta.
- Las series favoritas guardan grupo, ejercicio, peso y reps. Créalas en Hoy o Ajustes y tócalas en Hoy para sumar esa serie completa. Edita y elimina favoritas en Ajustes.
- Puedes editar o eliminar series desde ··· en el historial. Deshacer revierte la acción indicada durante unos segundos.

## Calendario de entrenamiento

Ajustes → Tu semana de entrenamiento permite marcar los grupos de cada día, de lunes a domingo. Un grupo desmarcado descansa y su meta es 0 ese día. El calendario nuevo se aplica **desde hoy** y conserva los días anteriores. Puedes entrenar también en un día de descanso: las series se guardan igual.

No hay una rutina obligatoria preconfigurada; inicialmente los tres grupos están activos todos los días, hasta que elijas tu calendario.

## Progreso semanal y récords

- Progreso muestra días activos, metas cumplidas, series y reps por grupo.
- Las semanas van de lunes a domingo. En la semana actual compara los días transcurridos con el mismo tramo de la semana anterior. Las semanas anteriores se comparan completas.
- Las barras muestran reps por grupo. Legs suma los contadores por lado de cada día; las barras no representan esfuerzo ni calorías.
- Toca una barra para abrir el detalle de ese día.
- Los récords son la mejor serie del mismo ejercicio, peso y lado. Se calculan desde el historial; corregir o eliminar una serie también actualiza los récords. Puedes filtrarlos por grupo y tocar una marca para ver su día.

## Historial y rachas

El calendario mensual muestra actividad y metas completas. Toca un día para ver sus series, variantes y pesos.

La racha general requiere alguna serie cada día. Las rachas de cada grupo requieren cumplir su meta de ese día. Un descanso del calendario o un día guardado con meta 0 conserva la racha del grupo sin sumar días. Los descansos programados cuentan aunque no abras la app. Un día de entrenamiento sin cumplir la meta rompe la racha del grupo; la racha general se interrumpe si no registras nada. Hoy queda abierto hasta medianoche, según la fecha local del teléfono.

## Temporizador de descanso

Desde Hoy puedes iniciar 60 s, 90 s o 2 min. La barra permanece al navegar. Permite pausar, seguir, cerrar o repetir la duración elegida. Conserva su estado al recargar.

El tiempo restante se calcula con una hora de finalización, por lo que al volver a la app refleja el tiempo transcurrido. **No es una alarma del sistema:** iOS puede suspender la app cuando bloqueas el teléfono. El sonido opcional de Ajustes requiere la app abierta y el audio disponible; no se prometen avisos con la pantalla bloqueada.

## Copias de seguridad

**Ajustes → Exportar copia** descarga un archivo JSON con historial, metas, favoritas, calendario y preferencias. Guárdalo en Archivos o iCloud Drive. Importar copia permite restaurarlo, previa confirmación, y **reemplaza** los datos actuales. Las copias de las primeras versiones siguen siendo compatibles.

La app ofrece un recordatorio después de 3 días con actividad. Tras exportar, vuelve a recordarte después de 7 días si hay datos nuevos. Puedes posponerlo 7 días o desactivarlo. Son recordatorios dentro de la app, no notificaciones del iPhone. «Última exportación preparada» indica que se inició la descarga: comprueba que guardaste el archivo.

No hay sincronización ni respaldo automático en la nube. Los registros viven en el almacenamiento local de este navegador o instalación. Borrar datos, eliminar la app, cambiar de dispositivo o perder el teléfono puede eliminarlos. Exporta antes de esos cambios.

## Independencia y propiedad

Reps es una página estática de tu repositorio **tefomars/ahorita-reps** y está publicada con GitHub Pages. **La app no utiliza la API de OpenAI ni requiere ChatGPT para ejecutarse.** No necesita que tu computadora o este chat estén abiertos.

El código y la página son públicos; los registros personales no se suben al repositorio ni a un servidor de la app. Cada visitante guarda sus propios datos. No hay bloqueo de acceso: quien use tu teléfono desbloqueado puede ver Reps. GitHub opera el alojamiento y puede gestionar sus registros normales del servicio.

La copia ZIP contiene el código completo y esta guía. Consérvala junto con una copia JSON de tus registros: **el código de la app y tu historial son dos archivos distintos**.

## Mantener o trasladar la app

No requiere dependencias, compilación, base de datos ni claves API.

- `index.html`: estructura, navegación y metadatos para iPhone.
- `app.mjs`: interfaz, registro, favoritos, temporizador y copias.
- `core.mjs`: cálculos, validación, calendario, rachas y estadísticas.
- `style.css`: diseño adaptable.
- `sw.js`: caché para uso sin conexión.
- `manifest.webmanifest` e iconos: instalación en pantalla de inicio.

Para probarla localmente, sirve esta carpeta con `python3 -m http.server 8765` y abre `http://localhost:8765`. El modo offline requiere HTTPS o localhost.

Para actualizar GitHub Pages, sube los archivos a la rama `main` del repositorio. Está configurado para publicar desde la raíz. Incrementa el nombre de caché en **sw.js y en offlineStatus() de app.mjs** al cambiar archivos. No renombres la clave local `ahorita.v1`: se conserva a propósito para mantener los registros de las primeras versiones. No contiene información del propietario.

Para moverla a otro dominio o alojamiento, publica estos mismos archivos como sitio estático por HTTPS, **exporta primero tu JSON desde la dirección anterior**, instala o abre la nueva dirección e importa la copia. Los datos no se trasladan automáticamente entre direcciones.

El código es tuyo para conservarlo y modificarlo. El funcionamiento futuro del alojamiento depende de tu cuenta y de las condiciones de GitHub; la app no incorpora suscripciones, pagos ni consumo de APIs.
