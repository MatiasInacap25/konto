# Workspace Selector Design

## Objetivo

Permitir al usuario cambiar entre sus workspaces (Personal y Business) desde el sidebar, actualizando los datos de la página actual según el workspace seleccionado.

## Decisiones

- **Ubicación:** Sidebar, reemplaza la sección "Plan actual" (el plan se moverá a configuración de cuenta)
- **Tipo de selector:** Dropdown simple
- **Comportamiento al cambiar:** Se queda en la página actual, solo refrescan los datos
- **Persistencia:** En la URL como query param `?workspace={id}`
- **Default:** Workspace Personal al entrar sin parámetro
- **Moneda por defecto:** CLP (editable después en configuración del workspace)

---

## Flujo General

### Estado inicial
1. Usuario entra a `/dashboard` sin parámetro `workspace`
2. El sistema detecta que no hay workspace en la URL
3. Busca el workspace PERSONAL del usuario y redirige a `/dashboard?workspace={id}`
4. Si no existe workspace personal, lo crea automáticamente (primera vez)

### Cambio de workspace
1. Usuario clickea el selector en el sidebar
2. Se despliega dropdown con sus workspaces (Personal primero, luego Business ordenados por nombre)
3. Al seleccionar uno, se actualiza el query param `?workspace={id}` manteniendo la ruta actual
4. Los componentes de la página detectan el cambio y refrescan sus datos

### Persistencia
- El workspace activo vive SOLO en la URL
- No se guarda en localStorage ni en la DB
- Si entrás sin parámetro, siempre carga el Personal por defecto

---

## Componente Selector de Workspace

### Ubicación
- En el sidebar, reemplaza la sección actual de "Plan actual"
- Debajo del header con logo, arriba de la navegación

### Estructura visual

```
┌─────────────────────────┐
│ 🏠 Personal          ▼ │  ← Botón trigger (icono + nombre + chevron)
└─────────────────────────┘
        │
        ▼ (dropdown)
┌─────────────────────────┐
│ ✓ 🏠 Personal           │  ← Check indica el activo
│   🏢 Mi Empresa SRL     │
│   🏢 Freelance USD      │
└─────────────────────────┘
```

### Detalles
- Icono `Home` para PERSONAL, `Building2` para BUSINESS
- El workspace activo muestra un check (✓) a la izquierda
- Hover en items: fondo `muted`
- Cuando el sidebar está colapsado: solo el icono del workspace actual, clickeable para abrir el dropdown

### Estados
- Loading: skeleton del ancho del selector
- Error al cargar workspaces: muestra "Error" con opción de reintentar

---

## Implementación Técnica

### Hook `useWorkspace`

```typescript
// src/hooks/use-workspace.ts
// - Lee `workspace` de los query params (useSearchParams)
// - Fetch de workspaces del usuario desde Supabase
// - Retorna: { workspaces, activeWorkspace, isLoading, error }
// - Si no hay param en URL y hay workspaces, redirige al Personal
```

### Componente `WorkspaceSelector`

```typescript
// src/components/dashboard/workspace-selector.tsx
// - Usa el hook useWorkspace
// - Renderiza el dropdown con los workspaces
// - Al cambiar, usa router.push() manteniendo el pathname actual
// - Ejemplo: router.push(`${pathname}?workspace=${newId}`)
```

### Cambios en páginas existentes
- Las páginas que dependen de workspace leen el param `workspace` de la URL
- Pasan ese ID a sus queries de Prisma para filtrar datos
- Si el param no existe o es inválido → redirect a `/dashboard` (que maneja el default)

### Validación de acceso
- Antes de mostrar datos, verificar que el `workspaceId` pertenece al usuario actual
- Si no pertenece → redirect a `/dashboard` sin params

---

## Creación del Workspace Personal por Defecto

### ¿Cuándo se crea?
- Cuando el usuario se registra o loguea por primera vez (en el callback de OAuth o en signUp)
- Si por alguna razón no existe al entrar al dashboard, se crea ahí como fallback

### Datos del workspace personal

```typescript
{
  name: "Personal",
  type: "PERSONAL",
  currency: "CLP",
  userId: user.id
}
```

---

## Archivos a Crear/Modificar

### Crear
1. `src/hooks/use-workspace.ts` - Hook para leer/manejar workspace activo
2. `src/components/dashboard/workspace-selector.tsx` - Dropdown en el sidebar

### Modificar
1. `src/components/dashboard/sidebar.tsx` - Reemplazar "Plan actual" por WorkspaceSelector
2. `src/app/(protected)/layout.tsx` - Crear workspace Personal si no existe
3. `src/app/auth/callback/route.ts` - Crear workspace Personal al registrarse con OAuth
4. `src/actions/auth.ts` - Crear workspace Personal al registrarse con email/password

---

## Flujo Completo

1. Usuario entra → se crea User + Workspace Personal si no existen
2. Entra a `/dashboard` sin params → redirige a `/dashboard?workspace={personalId}`
3. Ve el selector en el sidebar con su workspace activo
4. Puede cambiar, la URL se actualiza, los datos se refrescan
5. Navega a otras páginas → el param `workspace` se mantiene
