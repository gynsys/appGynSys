# GynSys Frontend

Frontend React para GynSys - SaaS multi-inquilino para clínicas digitales.

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
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
# Editar .env con la URL de la API
```

3. **Iniciar servidor de desarrollo:**
```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5173`

## Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Previsualiza la build de producción
- `npm run lint`: Ejecuta el linter

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

