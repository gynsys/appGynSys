# GynSys Frontend

Frontend React para GynSys - SaaS multi-inquilino para tu asistente.

## Stack Tecnológico

- **React 18**: Biblioteca de UI
- **Vite**: Build tool y dev server
- **Tailwind CSS**: Framework de CSS utility-first
- **React Router**: Enrutamiento
- **Axios**: Cliente HTTP
- **Zustand**: State management
- **Headless UI**: Componentes accesibles

## Configuración Inicial

1. **Instalar dependencias:**
```bash
pnpm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con la URL de la API
```

3. **Iniciar servidor de desarrollo:**
```bash
pnpm dev
```

El servidor estará disponible en `http://localhost:5173`

## Scripts Disponibles

- `pnpm dev`: Inicia el servidor de desarrollo
- `pnpm build`: Construye la aplicación para producción
- `pnpm preview`: Previsualiza la build de producción
- `pnpm lint`: Ejecuta el linter

## Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/      # Componentes reutilizables
│   │   ├── common/      # Componentes comunes (Button, Input, etc.)
│   │   └── layout/      # Componentes de layout (Header, Footer, etc.)
│   ├── features/        # Features por funcionalidad
│   │   ├── auth/        # Autenticación
│   │   └── dashboard/   # Dashboard
│   ├── pages/           # Páginas completas
│   ├── services/        # Servicios de API
│   ├── store/           # Estado global (Zustand)
│   ├── lib/             # Librerías y utilidades
│   └── hooks/           # Custom hooks
├── public/              # Assets estáticos
└── package.json
```

## Desarrollo

### Rutas Principales

- `/`: Página de inicio (Landing)
- `/pricing`: Página de planes y precios
- `/login`: Inicio de sesión
- `/register`: Registro de nuevos usuarios
- `/dr/:slug`: Perfil público del médico
- `/dashboard`: Dashboard privado (requiere autenticación)

### Autenticación

La autenticación se gestiona mediante:
- JWT tokens almacenados en `localStorage`
- Store de Zustand para estado global
- Interceptores de Axios para incluir tokens automáticamente

### Personalización de Temas

Los perfiles de médicos pueden personalizar:
- Logo (`logo_url`)
- Color primario (`theme_primary_color`)

Estos valores se aplican dinámicamente en `DoctorProfilePage`.

