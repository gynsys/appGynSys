# 🔧 Solución: npm no se reconoce

## ❌ Problema
```
"npm" no se reconoce como un comando interno o externo
```

Esto significa que **Node.js no está instalado** o no está en el PATH.

---

## ✅ Solución Rápida

### 1. Instalar Node.js
1. **Abre tu navegador**
2. Ve a: **https://nodejs.org/**
3. **Descarga** la versión **LTS** (botón verde grande)
4. **Ejecuta** el instalador descargado
5. Sigue el asistente (siguiente, siguiente, instalar)
6. ✅ **IMPORTANTE:** Asegúrate de marcar "Add to PATH" si aparece la opción

### 2. Reiniciar Terminal
1. **Cierra** todas las ventanas de terminal/CMD abiertas
2. Abre una **nueva** terminal
3. Verifica con:
   ```powershell
   node --version
   npm --version
   ```
4. ✅ Deberías ver números de versión

### 3. Probar Frontend
1. Ve a: `C:\Users\pablo\Desktop\appgynsys\frontend`
2. Doble clic en: `start_frontend.bat`
3. ✅ Ahora debería funcionar

---

## 🔍 Verificar si Node.js ya está instalado

### Opción 1: Buscar en el sistema
1. Presiona `Win + R`
2. Escribe: `C:\Program Files\nodejs\`
3. Si existe la carpeta, Node.js está instalado pero no en el PATH

### Opción 2: Buscar en otra ubicación
- `C:\Program Files (x86)\nodejs\`
- `C:\Users\pablo\AppData\Roaming\npm\`

---

## 🔧 Si Node.js está instalado pero no funciona

### Agregar al PATH manualmente:

1. Presiona `Win + X` → "Sistema"
2. Click en "Configuración avanzada del sistema"
3. Click en "Variables de entorno"
4. En "Variables del sistema", busca "Path"
5. Click en "Editar"
6. Click en "Nuevo"
7. Agrega: `C:\Program Files\nodejs\`
8. Click en "Aceptar" en todas las ventanas
9. **Cierra y vuelve a abrir** todas las terminales

---

## 📝 Notas Importantes

- **Node.js incluye npm** automáticamente
- Después de instalar, **siempre reinicia las terminales**
- La versión **LTS** es la más estable y recomendada
- El instalador de Node.js suele agregar al PATH automáticamente

---

## ✅ Después de Instalar

Una vez que Node.js esté instalado:

```powershell
# Verificar instalación
node --version    # Debería mostrar: v20.x.x o similar
npm --version     # Debería mostrar: 10.x.x o similar

# Luego probar el frontend
cd C:\Users\pablo\Desktop\appgynsys\frontend
npm install       # Solo la primera vez
npm run dev       # Iniciar servidor
```

---

## 🆘 ¿Necesitas Ayuda?

Si después de instalar Node.js sigue sin funcionar:
1. Verifica que instalaste la versión correcta (LTS)
2. Reinicia tu computadora
3. Verifica que el PATH esté configurado correctamente

