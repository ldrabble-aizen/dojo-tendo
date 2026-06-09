# Mini Kombat II

Demo simple de pelea 2D con personajes de cabezas recortadas desde fotos.
El juego sigue siendo una web estatica: HTML, CSS, JavaScript y assets locales.

Personajes actuales:

- Pchan
- Akane
- Maguila
- Pino
- Simiolin
- Lili

## Abrir

Con el servidor local activo:

```sh
http://127.0.0.1:8008/index.html
```

También puede abrirse directamente desde `index.html` en un navegador.

## Graficos

- Escenario premium del dojo en `assets/dojo-premium-bg.webp`.
- Respaldo PNG en `assets/dojo-premium-bg.png`.
- El cartel del fondo se dibuja por codigo para mantener el texto `DOJO TENDO`.
- Cuadros decorativos de Akane Tendo y Ryoga Hibiki en la pared del dojo.
- Efectos de luz, polvo, golpes, aura y proyectiles se generan en canvas.
- Menu inicial con estetica arcade oscura: metal, fuego, dorado y rojo.
- Selector principal tipo versus con retratos destacados, stats y roster compacto.
- Se permite elegir el mismo personaje en ambos lados para peleas espejo.
- Pantalla VS previa al combate y a cada siguiente round.
- Modo torneo con escalera de rivales CPU del Dojo Tendo.
- Poses de victoria/derrota y feedback sonoro ampliado para menu, seleccion, VS, victoria y derrota.
- Cartel de resultado compacto y sin velo global para que las poses de victoria y derrota queden visibles.
- Cabezas integradas sin aro circular durante la pelea.
- Cuerpos y extremidades con proporciones por personaje, contornos y mas volumen arcade.
- Uniformes con sombreado por volumen, pliegues, insignia y cinturon mejorado.
- Manos y pies redibujados con mas detalle para que los golpes lean mejor.
- Proporcion de cabezas ajustada para que el cuerpo y la pose tengan mas presencia.
- Respiracion, estiramiento de ataques y destello de impacto sobre los luchadores.
- Cuellos mas cortos y solapas superiores para integrar mejor cabeza y torso.
- Siluetas mas humanas con piernas largas, hombros firmes y poses mas atleticas.
- Vestuario diferenciado por personaje: patrones, mangas, calzado, franjas y emblemas.
- Sombras dinamicas pegadas al tatami segun salto, velocidad y ataque.
- Impactos con shockwave, chispas y destello corporal.
- Efectos de golpe con doble trazo, color por personaje y lineas de velocidad reforzadas.
- Motor optimizado con pasos fijos, cache del escenario y colores precalculados para mejorar fluidez.

## Controles

Akane:

- Flechas izquierda / derecha: mover
- Flecha arriba: saltar
- Flecha abajo: bloquear
- `K`: golpe
- `L`: patada
- `O`: especial
- Flecha abajo + `K`: especial alternativo
- `P`: agarre
- Flecha abajo + `L`: barrida
- Golpe o patada en el aire: ataque aereo

Rival izquierdo en modo 2P:

- `A` / `D`: mover
- `W`: saltar
- `S`: bloquear
- `F`: golpe
- `G`: patada
- `R`: especial
- `S` + `F`: especial alternativo
- `T`: agarre
- `S` + `G`: barrida
- Golpe o patada en el aire: ataque aereo

General:

- `CPU`: el rival izquierdo juega automatico; en `2P` juegan ambos.
- `Personajes`: vuelve a la pantalla de seleccion.
- En la pantalla inicial se elige el luchador izquierdo y el derecho.
- `Facil` / `Normal` / `Dificil`: cambia la dificultad del CPU.
- `Sonido` / `Mudo`: activa o desactiva sonido y musica.
- `?`: muestra controles dentro del juego.
- `Esc`: pausa o reanuda.
- `Enter` / `Espacio`: iniciar o revancha.
- `Reiniciar`: reinicia la pelea.

Reglas:

- Mejor de 3 rounds.
- Cada round empieza con cuenta regresiva de 3 segundos.
- Bloquear justo antes de responder abre una ventana corta de contraataque.
