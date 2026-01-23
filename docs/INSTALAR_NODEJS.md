# 📦 Instalar Node.js (requerido para el Frontend)

## 🚀 Método 1: Descarga Directa (Recomendado)

### Paso 1: Descargar Node.js
1. Ve a: **https://nodejs.org/**
2. Descarga la versión **LTS** (Long Term Support) - la recomendada
3. Ejecuta el instalador `.msi` descargado

### Paso 2: Instalar
1. Sigue el asistente de instalación
2. **IMPORTANTE:** Asegúrate de marcar la opción "Add to PATH" durante la instalación
3. Completa la instalación

### Paso 3: Verificar Instalación
1. Abre una **NUEVA** terminal (PowerShell o CMD)
2. Ejecuta:
```powershell
node --version
npm --version
```
3. ✅ Deberías ver números de versión (ej: v20.10.0 y 10.2.3)

### Paso 4: Instalar pnpm (Gestor de Paquetes)
Este proyecto usa **pnpm** en lugar de npm para una mejor gestión de dependencias.

```powershell
npm install -g pnpm
```

Verifica la instalación:
```powershell
pnpm --version
```

### Paso 5: Probar Frontend
1. Ve a: `C:\Users\pablo\Desktop\appgynsys\frontend`
2. Doble clic en: `start_frontend.bat`
3. ✅ Ahora debería funcionar

---

## 🔄 Método 2: Usar Chocolatey (Si lo tienes instalado)

```powershell
choco install nodejs-lts
```

---

## 🔄 Método 3: Usar Winget (Windows 10/11)

```powershell
winget install OpenJS.NodeJS.LTS
```

---

## ⚠️ Si Node.js ya está instalado pero no funciona

### Verificar si está instalado
1. Busca en: `C:\Program Files\nodejs\` o `C:\Program Files (x86)\nodejs\`
2. Si existe la carpeta, Node.js está instalado pero no está en el PATH

### Agregar al PATH manualmente
1. Busca "Variables de entorno" en Windows
2. Click en "Variables de entorno"
3. En "Variables del sistema", busca "Path"
4. Click en "Editar"
5. Agrega: `C:\Program Files\nodejs\` (o la ruta donde esté Node.js)
6. Click en "Aceptar" en todas las ventanas
7. **Cierra y vuelve a abrir** todas las terminales

---

## ✅ Después de Instalar

Una vez instalado Node.js:

1. **Cierra todas las terminales abiertas**
2. Abre una nueva terminal
3. Verifica con: `node --version` y `npm --version`
4. Luego ejecuta: `start_frontend.bat`

---

## 📝 Nota

- Node.js incluye npm automáticamente
- La versión LTS es la más estable
- Después de instalar, **reinicia las terminales** para que reconozca el comando

