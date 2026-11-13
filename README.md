# Reps

Una app personal de repeticiones para iPhone. Push, Pull y Legs; metas diarias, variantes y peso añadido en libras. Sin suscripciones, anuncios, servidores de datos ni rastreadores.

## Instalar en iPhone

Abre la dirección de GitHub Pages en Safari. Compartir → Agregar a pantalla de inicio. Activa «Abrir como app web» si aparece. Abre una vez con internet; en Ajustes puedes revisar si está lista sin conexión.

## Uso

- Toca +1, +5, +10 o ··· para otra cantidad. Personaliza esos botones en Ajustes.
- Toca el ejercicio para cambiarlo y elegir las lb añadidas totales. La selección se recuerda.
- Toca la meta para editarla. 0 significa descanso.
- Legs cuenta por pierna. «Ambas» registra la cantidad para cada lado; también puedes registrar un lado a la vez. El contador muestra el mínimo de los dos lados.
- Edita o elimina series desde ··· en el historial. Deshacer revierte la última acción mostrada durante unos segundos.
- Las metas cambian hoy y en días futuros. Las de días anteriores se conservan.
- El día cambia a medianoche según la hora local del teléfono.

## Historial y rachas

Historial incluye un calendario mensual con actividad y metas completas. La racha general cuenta días consecutivos con cualquier serie. Las rachas por grupo cuentan días cumpliendo la meta de ese día; descansos explícitos con meta 0 las conservan sin sumar. Hoy queda abierto hasta medianoche. Un día sin registros ni descanso guardado interrumpe la racha. Se muestran racha actual, récord y días activos o metas cumplidas. Todo se calcula desde tus registros existentes.

## Tus datos

Los datos quedan en localStorage de este navegador. No se suben a GitHub ni se sincronizan. Exporta copias JSON en Ajustes. Importar una copia reemplaza los datos actuales, con confirmación. Borrar los datos del sitio o cambiar de dispositivo puede eliminar el historial. Una instalación en pantalla de inicio puede usar almacenamiento distinto del navegador: exporta e importa si necesitas mover registros.

El código y la página son públicos. Cada visitante mantiene su propio historial en su dispositivo. La página no tiene bloqueo de acceso; cualquier persona con acceso a tu iPhone desbloqueado podría ver la app.

## Desarrollo

No requiere instalación de paquetes ni compilación. Sirve esta carpeta con `python3 -m http.server 8765` y abre localhost:8765. El modo sin conexión requiere HTTPS o localhost. No se ofrecen haptics nativos ni widgets de iOS.

Al modificar archivos de la app, incrementa el nombre de caché en sw.js y en la consulta de disponibilidad de app.mjs para actualizar el contenido instalado.
