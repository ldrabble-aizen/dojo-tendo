# Dojo Tendo

Demo simple de pelea 2D con dos personajes y cabezas recortadas desde `assets/akypchan.png`.

## Abrir

Con el servidor local activo:

```sh
http://127.0.0.1:8008/index.html
```

También puede abrirse directamente desde `index.html` en un navegador.

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

Pchan en modo 2P:

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

- `CPU`: Pchan es el rival automatico; en `2P` juegan ambos.
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
