# Sistema de Recepción de Llamados – Taxis 🚕

Sistema web en tiempo real para reemplazar planillas de Excel en la toma y despacho de viajes de taxis, diseñado para operarse **100% mediante el teclado** y listo para alojarse en **Railway**.

---

## 🚀 Características Principales

1. **Flujo ultrarrápido por teclado**:
   - `Teléfono` ➔ `Dirección` ➔ `Chofer` ➔ `Programado` ➔ `Enter` guarda.
   - **Autocompletado inteligente de direcciones**:
     - Si el teléfono ya existe en la base, sugiere primero las direcciones que ese cliente usa más seguido.
     - Texto fantasma mientras se escribe; la tecla `Tab` completa la dirección sugerida.
     - Navegación con flechas `↑` y `↓`.
   - **Lógica de viajes programados**:
     - Por defecto indica **NO**.
     - Apenas se empieza a tipear una hora (ej: `1830`, `9`, `0130`), pasa automáticamente a **SÍ** y calcula la hora programada siempre hacia adelante.
     - Los viajes programados se muestran en el listado del turno correspondiente intercalados según su hora.
2. **Despacho automático al llegar la hora**:
   - Al llegar la hora de un viaje programado, el sistema le asigna el siguiente número de viaje del turno y abre el panel de despacho preguntando por el chofer.
   - Posibilidad de **Posponer** con `Esc` si entra otro llamado urgente.
   - Atajo `F2` para despachar viajes pendientes.
3. **Turnos de 12 horas automáticos**:
   - **Turno A**: 03:00 a 15:00.
   - **Turno B**: 15:00 a 03:00 del día siguiente.
   - Los números de orden (`N° 1, 2, 3...`) se reinician automáticamente en cada turno.
   - Asignación dinámica de choferes por turno.
4. **Hora de fin de viaje**:
   - Botón directo o tecla rápida desde el listado para registrar la hora actual o ingresar una hora personalizada con corrección manual.
5. **Tiempo real (WebSockets)**:
   - Todos los operadores conectados ven los viajes y las asignaciones actualizarse al instante.
6. **Historial y Administración**:
   - Consulta de turnos pasados con exportación a formato **CSV**.
   - ABM de choferes y operadores con control de roles (`operador` / `admin`).

---

## ⌨️ Atajos de Teclado

| Tecla | Acción |
|---|---|
| `Tab` | Acepta la dirección sugerida / pasa al siguiente campo |
| `↑` / `↓` | Recorre las sugerencias de direcciones o lista de choferes |
| `Enter` | Selecciona chofer / Guarda el viaje desde el último campo o botón |
| `Ctrl + Enter` | Guarda el viaje inmediatamente desde cualquier campo |
| `F2` | Atiende o asigna chofer al viaje programado pendiente más antiguo |
| `F1` | Vuelve el foco al formulario de nuevo viaje |
| `Esc` | Pospone el despacho del viaje programado para atender un llamado nuevo |

---

## 🛠️ Ejecución Local

### Requisitos
- Node.js >= 20

### 1. Iniciar la base de datos de desarrollo
```bash
npm run db:dev
```
*(Inicia un PostgreSQL local embebido en el puerto 5433 sin requerir instalación previa).*

### 2. Iniciar el servidor backend (con recarga automática)
```bash
npm run dev
```
*(Servidor escuchando en `http://localhost:3000`)*.

### 3. Modo desarrollo del frontend (Vite)
```bash
npm run dev:client
```
O bien compilar el frontend una vez:
```bash
npm run build
```
Al compilar, el backend sirve directamente la app web completa en `http://localhost:3000`.

### Usuario inicial por defecto
- **Usuario**: `admin`
- **Contraseña**: `admin`

---

## ☁️ Despliegue en Railway

1. Crear un nuevo proyecto en [Railway](https://railway.com/).
2. Agregar un servicio de **PostgreSQL** desde el catálogo de Railway.
3. Conectar el repositorio de GitHub de este proyecto como servicio web.
4. En las variables de entorno del servicio web en Railway, configurar:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (referencia automática a la base de datos de Railway).
   - `JWT_SECRET`: Una cadena de texto secreta y segura.
   - `TZ`: `America/Argentina/Buenos_Aires` (para que los turnos y las horas coincidan siempre con la hora local de los operadores).
5. Railway ejecutará automáticamente `npm run build` y arrancará con `npm run start`.
