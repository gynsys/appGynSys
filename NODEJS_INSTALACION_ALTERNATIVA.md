# 🔄 Alternativas para Instalar Node.js

## ⚠️ Situación Actual

El instalador está intentando instalar Visual Studio Build Tools, lo cual puede tardar mucho tiempo. Esto es **opcional** para la mayoría de casos.

---

## ✅ Opción 1: Cancelar y Usar Instalación Básica (Recomendado)

### Paso 1: Cancelar Instalación Actual
1. Cierra el instalador actual
2. No te preocupes, no pasa nada

### Paso 2: Descargar Versión Portable o LTS Simple
1. Ve a: **https://nodejs.org/**
2. Descarga la versión **LTS** (Windows Installer .msi)
3. Durante la instalación:
   - **NO marques** la opción de "Automatically install the necessary tools"
   - **SÍ marca** "Add to PATH"
4. Completa la instalación normalmente

### Paso 3: Verificar
```powershell
node --version
npm --version
```

---

## ✅ Opción 2: Usar Chocolatey (Si lo tienes)

Si tienes Chocolatey instalado:

```powershell
choco install nodejs-lts -y
```

---

## ✅ Opción 3: Usar Winget (Windows 10/11)

```powershell
winget install OpenJS.NodeJS.LTS
```

---

## ✅ Opción 4: Esperar a que Termine

Si prefieres esperar:
- La instalación de Visual Studio Build Tools puede tardar **10-30 minutos**
- Es normal que parezca "congelado"
- Al final, Node.js se instalará correctamente

---

## 🎯 Recomendación

**Para nuestro proyecto, NO necesitas Visual Studio Build Tools.**

1. **Cancela** la instalación actual
2. **Descarga** Node.js LTS desde nodejs.org
3. Durante la instalación, **NO marques** opciones de herramientas adicionales
4. Solo asegúrate de marcar **"Add to PATH"**

---

## ✅ Después de Instalar (Cualquier Método)

1. **Cierra todas las terminales**
2. Abre una **nueva** terminal
3. Verifica:
   ```powershell
   node --version
   npm --version
   ```
4. Si funciona, prueba el frontend:
   ```powershell
   cd C:\Users\pablo\Desktop\appgynsys\frontend
   start_frontend.bat
   ```

---

## 📝 Nota

Visual Studio Build Tools solo son necesarias si vas a compilar módulos nativos de Node.js. Para nuestro proyecto React con Vite, **NO las necesitas**.

