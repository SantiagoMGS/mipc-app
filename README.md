# MIPC - Sistema de Gestión

Sistema de gestión de órdenes de servicio construido con Next.js y TypeScript.

## 🚀 Tecnologías

- **Next.js 14** - Framework de React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos

## 📦 Instalación

1. Instalar dependencias:

```bash
npm install
```

2. Ejecutar en modo desarrollo:

```bash
npm run dev
```

3. Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

## 🎨 Características

- ✅ **Autenticación** - Sistema de login integrado con API
- ✅ **Dashboard** - Panel principal con menú lateral
- ✅ **CRUD de Productos** - Gestión completa de productos y servicios
  - Crear, editar y eliminar items
  - Filtrar por tipo (Producto/Servicio)
  - Búsqueda en tiempo real
  - Visualización en tarjetas
  - Paginación (5, 10, 20, 50 items por página)
  - Ver items eliminados (soft delete)
  - Reactivar items inactivos con un clic
  - Badges de estado (Activo/Inactivo/Eliminado)
  - Notificaciones toast de éxito/error
  - Modal de confirmación personalizado para eliminar
- ✅ **Clientes** - Administración de clientes (próximamente)
- ✅ **Diseño Responsive** - Adaptable a diferentes dispositivos
- ✅ **Tema Naranja** - Color corporativo implementado

## 🔐 Configuración

La aplicación se conecta a la API de producción:

```
https://mipc-api-production.up.railway.app
```

### Variables de Entorno

Puedes configurar la URL de la API en el archivo `.env.local`:

```env
# URL de la API
NEXT_PUBLIC_API_URL=https://mipc-api-production.up.railway.app
```

### Credenciales de Prueba

Usa las credenciales proporcionadas por tu API para iniciar sesión.

## 📁 Estructura del Proyecto

## � Estructura del Proyecto

```
mipc-app/
├── app/
│   ├── dashboard/
│   │   ├── clientes/
│   │   ├── productos/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ConfirmDialog.tsx
│   ├── ItemFormModal.tsx
│   ├── Pagination.tsx
│   └── Toast.tsx
├── lib/
│   └── api.ts
├── types/
│   └── item.ts
└── package.json
```

## �🛠️ Desarrollo

### Construir para producción

```bash
npm run build
```

### Iniciar servidor de producción

```bash
npm start
```

---

© 2025 MIPC. Todos los derechos reservados.
