# Minecraft-like Game

Un juego tipo Minecraft desarrollado con **Three.js** y JavaScript puro. Genera un mundo voxel infinito con terreno procedural y permite construir y destruir bloques.

## 🎮 Características

- **Mapa estilo Ciudad de Buenos Aires**: cuadrícula de manzanas con edificios, veredas, calles, plazas con árboles, Av. 9 de Julio, Obelisco, Casa Rosada con Plaza de Mayo, Floralis Genérica, La Bombonera y el Río de la Plata con costanera
- **Tráfico**: autos y colectivos circulando por la 9 de Julio
- **Ciclo de día y noche** (2 minutos por ciclo)
- **Vista en primera y tercera persona** (tecla V)
- **Mirar con el mouse** (pointer lock)
- **Construcción y destrucción**: Click izquierdo para destruir, click derecho para construir
- **Efectos de sonido** generados con WebAudio (romper, colocar, saltar)
- **Movimiento fluido**: WASD para movimiento, Espacio para saltar
- **Modo volar**: Presiona Shift para activar/desactivar vuelo
- **Gravedad y colisiones**: Física básica realista
- **HUD completo**: Contador de FPS, coordenadas del jugador, inventario visible
- **Selector de bloques**: Rueda del ratón o teclas 1-5

### 🗺️ Lugares para visitar

| Lugar | Cómo llegar |
|---|---|
| Obelisco | Estás ahí al aparecer (X:0, Z:0) |
| Río de la Plata | Caminá hacia adelante (norte) por la avenida |
| Casa Rosada y Plaza de Mayo | X:48, Z:-25 |
| Floralis Genérica | X:-41, Z:-36 |
| La Bombonera | X:-72, Z:56 |

También podés aparecer directo en un lugar con parámetros de URL: `?x=-72&z=90` (y `?vista=3` para arrancar en tercera persona).

## 🚀 Cómo jugar

### Instalación

```bash
# No se requieren dependencias externas, solo un navegador moderno
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` en tu navegador.

### Controles

| Tecla/Botón | Acción |
|---|---|
| **W** | Adelante |
| **A** | Izquierda |
| **S** | Atrás |
| **D** | Derecha |
| **Espacio** | Saltar |
| **Shift** | Activar/Desactivar vuelo |
| **Click Izquierdo** | Destruir bloque |
| **Click Derecho** | Construir bloque |
| **Rueda del Ratón** | Cambiar bloque seleccionado |
| **Números 1-5** o Click en inventario | Seleccionar bloque directo |

## 🏗️ Estructura del proyecto

```
├── index.html          # Página principal
├── style.css           # Estilos del interfaz
├── js/
│   ├── main.js        # Loop principal del juego
│   ├── world.js       # Sistema de mundo y chunks
│   ├── player.js      # Controlador del jugador
│   └── blocks.js      # Definición de bloques
└── README.md          # Este archivo
```

## 🛠️ Technología

- **Three.js r128**: Para renderizado 3D WebGL
- **JavaScript Vanilla**: Sin frameworks adicionales
- **Ruido procedural**: Para generación de terreno

## 📋 Requisitos

- Navegador moderno con soporte WebGL
- Conexión a internet (para cargar Three.js del CDN)
- No requiere Node.js o build tools

## 🎨 Tipos de bloques

1. 🟩 **Pasto** (Verde) - Capa superior del terreno
2. 🟫 **Tierra** (Marrón) - Segunda capa
3. ⬜ **Piedra** (Gris) - Capas profundas
4. 🟨 **Arena** (Arena) - Decorativo
5. 🟶 **Madera** (Naranja) - Decorativo

## 🎯 Características futuras

- Mejora de colisiones más precisas
- Texturas de bloques personalizadas
- Sistema de inventario expandido
- Herramientas y crafting
- Mob enemigos
- Sistema de día/noche
- Biomas variados
- Multijugador

## 📝 Notas de desarrollo

- El juego genera chunks dinámicamente mientras te mueves
- Los chunks se renderiza en paralelo para mejor rendimiento
- Los bloques fuera de pantalla no se renderizan
- El terreno es proceduralmente generado y consistente

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso educativo.

---

**¿Disfrutando el juego?** 🎮 ¡Comparte y diviértete construyendo!
