# Guía de Instalación — ERP ATI Termic

## Programas necesarios

Antes de comenzar, asegúrate de tener instalados los siguientes programas:

| Programa | Versión mínima | Para qué sirve | Descarga |
|---|---|---|---|
| **Node.js** | v18 o superior | Ejecutar el backend (servidor) | https://nodejs.org |
| **XAMPP** | Cualquier versión reciente | Proporciona el servidor MySQL | https://www.apachefriends.org |
| **VS Code** | Cualquier versión | Editor de código | https://code.visualstudio.com |

> **Nota:** Durante el desarrollo se usó Node.js v24.16.0. Se recomienda instalar la versión LTS más reciente.

---

## Paso 1 — Descargar el proyecto

Coloca la carpeta del proyecto dentro de la ruta de XAMPP:

```
C:\xampp\htdocs\erp-ati-termic-main\
```

Si tienes el archivo `.zip`, extráelo directamente en esa ubicación.

---

## Paso 2 — Iniciar MySQL con XAMPP

1. Abre el **Panel de Control de XAMPP** (XAMPP Control Panel).
2. En la fila de **MySQL**, haz clic en **Start**.
3. El estado debe cambiar a verde con el texto **Running**.

> Apache NO es necesario para este proyecto. Solo necesitas MySQL.

---

## Paso 3 — Crear la base de datos

1. Con MySQL corriendo en XAMPP, abre tu navegador y entra a:
   ```
   http://localhost/phpmyadmin
   ```
2. En el panel izquierdo haz clic en **Nueva** (o "New").
3. En el campo "Nombre de la base de datos" escribe:
   ```
   erp_ati_termic
   ```
4. Selecciona el cotejamiento **`utf8mb4_general_ci`**.
5. Haz clic en **Crear**.

> La base de datos debe quedar vacía; las tablas se crean automáticamente al iniciar el backend por primera vez.

---

## Paso 4 — Configurar el archivo .env

En la raíz del proyecto (`C:\xampp\htdocs\erp-ati-termic-main\`) crea o edita el archivo llamado **`.env`** con el siguiente contenido:

```env
# Servidor
PORT=3000

# Base de datos MySQL (XAMPP)
DB_HOST=localhost
DB_NAME=erp_ati_termic
DB_USER=root
DB_PASS=12345

# JWT — llave secreta para firmar los tokens de sesión
JWT_SECRET=ati_termic_jwt_secret_2024_seguro
```

> **Importante:** El valor de `DB_PASS` debe coincidir con la contraseña de MySQL que configuraste en XAMPP. Si nunca le pusiste contraseña al usuario root, deja `DB_PASS=` en blanco.

---

## Paso 5 — Instalar dependencias del backend

Abre una terminal (CMD o PowerShell) dentro de la carpeta del proyecto y ejecuta:

```cmd
cd C:\xampp\htdocs\erp-ati-termic-main
npm install
```

Esto descarga todas las librerías del backend (Express, Sequelize, JWT, bcrypt, etc.) en la carpeta `node_modules`.

---

## Paso 6 — Instalar dependencias del frontend

En la **misma terminal**, entra a la carpeta del cliente y ejecuta:

```cmd
cd client
npm install
```

Esto descarga las librerías del frontend (React, Vite, Recharts, etc.).

---

## Paso 7 — Iniciar el backend

Vuelve a la carpeta raíz del proyecto y ejecuta:

```cmd
cd C:\xampp\htdocs\erp-ati-termic-main
node index.js
```

Si todo está bien verás en consola:

```
Conexion a MySQL establecida.
Backend ERP ATI Termic corriendo en http://localhost:3000
```

> Si en cambio aparece `Error: Cannot connect to database`, verifica que MySQL esté corriendo en XAMPP y que los datos del `.env` sean correctos.

**Deja esta terminal abierta.** El backend debe seguir corriendo mientras usas el ERP.

---

## Paso 8 — Poblar la base de datos con datos de prueba

En una **segunda terminal**, ejecuta el script de reset para crear las tablas y cargar datos iniciales:

```cmd
cd C:\xampp\htdocs\erp-ati-termic-main
node reset-db.js
```

Al terminar verás:

```
================================================
Reset completado.
  Admin      → RUT: 11111111-1  |  Pass: Admin1234!
  Supervisor → RUT: 22222222-2  |  Pass: Super1234!
================================================
```

> **Advertencia:** `reset-db.js` **elimina y recrea todas las tablas**. Úsalo solo en la instalación inicial o cuando quieras reiniciar la base de datos desde cero. Para agregar solo los datos sin borrar nada, usa `node seed.js` en su lugar.

---

## Paso 9 — Iniciar el frontend

Abre una **tercera terminal**, entra a la carpeta `client` y ejecuta:

```cmd
cd C:\xampp\htdocs\erp-ati-termic-main\client
npm run dev
```

Verás algo como:

```
  VITE v6.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
```

Abre tu navegador y entra a **http://localhost:5173**

---

## Paso 10 — Iniciar sesión

Usa las credenciales de prueba creadas por el script:

| Rol | RUT | Contraseña | Acceso |
|---|---|---|---|
| **Administrador** | `11111111-1` | `Admin1234!` | Acceso completo a todos los módulos |
| **Supervisor de Terreno** | `22222222-2` | `Super1234!` | Acceso a módulos operativos (bitácora, SSO, evidencias, etc.) |

---

## Resumen de comandos diarios

Cada vez que quieras usar el ERP (sin reinstalar), solo necesitas:

**Terminal 1 — Backend:**
```cmd
cd C:\xampp\htdocs\erp-ati-termic-main
node index.js
```

**Terminal 2 — Frontend:**
```cmd
cd C:\xampp\htdocs\erp-ati-termic-main\client
npm run dev
```

Y asegurarte de que **MySQL esté iniciado en XAMPP**.

---

## Solución de problemas frecuentes

| Error | Causa probable | Solución |
|---|---|---|
| `Cannot find module 'dotenv'` | Dependencias no instaladas | Ejecutar `npm install` en la raíz |
| `Error al conectar a la base de datos` | MySQL no está corriendo o datos del .env incorrectos | Iniciar MySQL en XAMPP y revisar `.env` |
| `Access denied for user 'root'` | Contraseña de MySQL incorrecta | Cambiar `DB_PASS` en el `.env` |
| `Database 'erp_ati_termic' doesn't exist` | Base de datos no fue creada | Crear la BD en phpMyAdmin (Paso 3) |
| El frontend no carga datos | El backend no está corriendo | Verificar que `node index.js` esté activo |
| Puerto 3000 en uso | Otro proceso ocupa el puerto | Cambiar `PORT=3001` en el `.env` |

---

## Estructura de carpetas del proyecto

```
erp-ati-termic-main/
├── client/                  → Frontend React (Vite)
│   └── src/
│       ├── pages/           → Vistas (una por módulo del ERP)
│       ├── components/      → Componentes reutilizables (Sidebar, Toast, Badge)
│       └── api/             → Configuración de Axios para llamadas al backend
├── config/                  → Conexión a la base de datos (Sequelize)
├── controllers/             → Lógica de negocio de cada módulo
├── middleware/              → Validación de tokens JWT y roles
├── models/                  → Definición de tablas con Sequelize (ORM)
├── routes/                  → Definición de endpoints REST de la API
├── uploads/                 → Archivos subidos (fotos, PDFs)
├── diagramas-secuencia-casosdeuso/  → Diagramas draw.io del proyecto
├── index.js                 → Punto de entrada del servidor
├── reset-db.js              → Reinicia y puebla la base de datos
├── seed.js                  → Solo inserta datos de prueba (sin borrar)
├── migration.js             → Aplica cambios de estructura a BD existente
├── schema.sql               → Esquema SQL original del proyecto
└── .env                     → Variables de entorno (NO compartir)
```
