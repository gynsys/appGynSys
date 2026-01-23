# 📱 Chat Module

Módulo de chat portable, multi-tenant y offline-first para aplicaciones React.

## Instalación

El módulo está diseñado para ser autocontenido. Copiar la carpeta `modules/chat` a tu proyecto.

### Dependencias requeridas

```bash
pnpm add zustand dexie socket.io-client react-media-recorder react-icons
```

## Uso Rápido

### Widget Completo (Dashboard)

```jsx
import { ChatWidget } from '@/modules/chat';

function Dashboard() {
  return <ChatWidget className="h-[600px] w-full" />;
}
```

### Botón Flotante (Perfil Público)

```jsx
import { PatientChatFloatingButton } from '@/modules/chat';

function DoctorProfile({ doctor }) {
  return (
    <PatientChatFloatingButton
      doctorId={doctor.id}
      doctorName={doctor.name}
      primaryColor="#4F46E5"
    />
  );
}
```

### Acceso al Store (Notificaciones)

```jsx
import { useChatStore } from '@/modules/chat';

function ChatBadge() {
  const unreadCount = useChatStore((state) =>
    Object.values(state.rooms).reduce((acc, r) => acc + (r.unread_count || 0), 0)
  );
  
  return unreadCount > 0 ? <span className="badge">{unreadCount}</span> : null;
}
```

## Exports Disponibles

| Export | Tipo | Descripción |
|--------|------|-------------|
| `ChatWidget` | Component | Widget completo con sidebar y área de mensajes |
| `PatientChatFloatingButton` | Component | Botón flotante para perfil público |
| `MessageBubble` | Component | Burbuja individual de mensaje |
| `InputArea` | Component | Área de entrada con texto/adjuntos/audio |
| `AudioPlayer` | Component | Reproductor de notas de voz |
| `useChatStore` | Hook | Estado global (Zustand) |
| `useChatSync` | Hook | Sincronización Socket.IO |
| `useAudioRecorder` | Hook | Grabación de audio |
| `chatApi` | Service | Cliente API REST |
| `chatStorage` | Service | Persistencia IndexedDB |

## Configuración Backend

El módulo requiere un backend con los siguientes endpoints:

- `GET /api/v1/chat/rooms` - Listar rooms del usuario
- `POST /api/v1/chat/rooms` - Crear room
- `GET /api/v1/chat/rooms/:id/messages` - Mensajes de un room
- `POST /api/v1/chat/rooms/:id/messages` - Enviar mensaje
- `POST /api/v1/chat/media/presigned-url` - URL firmada para uploads
- `WS /ws/socket.io` - Conexión Socket.IO

## Estructura del Módulo

```
modules/chat/
├── index.js              # Entry point (exports)
├── components/
│   ├── ChatWidget.jsx
│   ├── PatientChatFloatingButton.jsx
│   ├── MessageBubble.jsx
│   ├── InputArea.jsx
│   └── AudioPlayer.jsx
├── context/
│   └── useChatStore.js   # Zustand store
├── hooks/
│   ├── useChatSync.js    # Socket.IO sync
│   └── useAudioRecorder.js
└── services/
    ├── api.js            # Axios client
    └── storage.js        # Dexie (IndexedDB)
```

## Licencia

Propiedad de GynSys. Uso interno.
