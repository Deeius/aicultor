# 🌿 Jardín Verde — Despliegue en Vercel

Todo en **un solo repositorio**, un solo servicio. Sin Railway, sin configuración extra.

```
jardin-verde/
├── api/
│   └── chat.js          ← Serverless Function (backend seguro)
├── frontend/
│   └── index.html       ← La app
├── package.json          ← Dependencias (SDK de Anthropic)
├── vercel.json           ← Routing: /api/* → función, /* → frontend
└── .gitignore
```

---

## Paso 1 · Subir a GitHub

1. Crea una cuenta en https://github.com si no tienes
2. Crea un repositorio nuevo llamado `jardin-verde` (puede ser privado)
3. Sube todo el contenido de esta carpeta:

```bash
cd jardin-verde/
git init
git add .
git commit -m "🌿 Initial commit"
git remote add origin https://github.com/TU_USUARIO/jardin-verde.git
git push -u origin main
```

---

## Paso 2 · Desplegar en Vercel

1. Ve a https://vercel.com y regístrate con tu cuenta de GitHub
2. Clic en **"Add New Project"**
3. Selecciona el repositorio `jardin-verde`
4. En la pantalla de configuración **no cambies nada** — Vercel lo detecta solo
5. Clic en **"Deploy"**

En ~1 minuto tendrás una URL pública como:
`https://jardin-verde.vercel.app`

---

## Paso 3 · Añadir tu API key de Anthropic

Este es el único paso manual importante — aquí es donde guardas tu clave de forma segura.

1. En Vercel, entra a tu proyecto → **Settings → Environment Variables**
2. Añade estas dos variables:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-...tu clave...` |
| `FRONTEND_URL` | `https://jardin-verde.vercel.app` *(tu URL de Vercel)* |

3. Clic en **Save**
4. Ve a **Deployments** → en el último deployment clic en **⋯ → Redeploy**

✅ ¡Listo! Tu app ya está pública y segura.

---

## ¿Dónde consigo la API key de Anthropic?

1. Ve a https://console.anthropic.com
2. **Settings → API Keys → Create Key**
3. Cópiala (solo se muestra una vez)

**Para controlar el gasto**, pon un límite mensual en:
Settings → Limits → Monthly spend limit (recomendado: $10–20)

---

## Costes estimados

| Servicio | Coste |
|----------|-------|
| Vercel (frontend + serverless) | **Gratis** hasta 100k peticiones/mes |
| Anthropic API | ~$0.003 por sesión de usuario |

Con 1.000 usuarios al mes serían ~$3 en API.

---

## Actualizaciones futuras

Cada vez que hagas un cambio:
```bash
git add .
git commit -m "Descripción del cambio"
git push
```
Vercel redesplegará automáticamente en ~30 segundos.

---

## Desarrollo local

```bash
# Instalar Vercel CLI
npm i -g vercel

# En la raíz del proyecto
vercel dev
# → Frontend en http://localhost:3000
# → API en http://localhost:3000/api/chat
```

Crea un archivo `.env.local` en la raíz con:
```
ANTHROPIC_API_KEY=sk-ant-...tu clave...
```
