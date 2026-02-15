# Konto Finance Manager - Design System

## Direction & Feel

**Product**: Gestor de finanzas personales para Latinoamérica  
**Feel**: Extracto bancario con marcadores de colores — calma, claridad, control. No alarmismo ni dashboards agresivos.

**Metáfora central**: Revisar tus gastos como si estuvieras organizando papeles en un escritorio. Tangible, manual, comprensible.

---

## Depth Strategy

**Approach**: Borders + subtle surface elevation

- **Borders**: Low-opacity rgba que se funden con el fondo
- **Elevation**: Cards usan `bg-card` con `border`, diferenciación por padding y contenido, no por sombras dramáticas
- **Inputs**: Ligeramente más oscuros que surroundings (inset feeling)

---

## Spacing

**Base unit**: 0.25rem (4px)

**Scale**:
- Micro: 4px (icon gaps)
- Component: 16px (card padding)
- Section: 24px (entre secciones principales)
- Major: 32px (entre áreas distintas)

**Padding**: Simétrico por defecto. `p-6` para cards principales.

---

## Color Temperature

**Warm neutrals** — evoca papel, cartulina, escritorio:

- Background: OKLCH warm off-white
- Cards: Pure white (light) / Slightly elevated (dark)
- Borders: Low saturation, same hue as background

**Semantic colors**:
- Income: Emerald-500 (`#10b981`)
- Expense: Foreground default (no color = neutral)
- Balance: Conditional (emerald if positive, red if negative)

---

## Typography

**Typeface**: Inter (system-ui fallback)

**Hierarchy**:
1. **Page title**: `text-2xl font-bold`
2. **Card titles**: `font-semibold`
3. **Body**: `text-sm` (default)
4. **Labels/Meta**: `text-xs text-muted-foreground`

**Data numbers**: `tabular-nums` para alineación de montos

---

## Card Patterns

### Hero Number Card
```
┌─────────────────────────────┐
│ Label                    🔣 │
│ $1.234.567                  │
│ ↑ +$12.345 (+5.2%) vs ant.  │
└─────────────────────────────┘
```
- Icono en esquina superior derecha con background sutil
- Número grande, alineado izquierda
- Delta abajo con contexto "vs mes ant."

### Chart Card
- Header con título semibold
- Gráfico ocupando espacio disponible
- Estados empty con icono + mensaje amigable

### Detail Panel
- Estado default: Hint visual ("Seleccioná una categoría")
- Estado activo: Header con icono + nombre + meta + monto
- Barra de progreso mostrando proporción del total

---

## Component Patterns

### Month Selector (Dropdown Custom)
- Trigger: Icono + mes/año + contador de movimientos + chevron
- Lista: Meses ordenados descendentemente, cada item con contador
- Estilo: `bg-card border hover:bg-accent`

### Interactive Pie Chart
- Porciones clickeables
- Hover: Tooltip con monto + porcentaje
- Selected: Porción "explota" (scale 1.02), otras se desvanecen (opacity 0.3)
- Colores: Paleta consistente de 10 colores

### Transaction List
- Formato tipo "movimiento bancario" (no tabla)
- Icono + descripción + fecha/cuenta + monto
- Alineación: Monto a la derecha, resto a la izquierda
- Hover sutil (`hover:bg-muted/50`)

---

## Layout Patterns

### Page Structure
```
Header (título + selector)
  ↓
Hero Numbers (grid 3 cols)
  ↓
Analysis Section (grid 5 cols: 3 chart + 2 detail)
  ↓
Transactions Section (full width)
```

### Responsive
- Desktop: Grid completo con análisis lado a lado
- Mobile: Apilado vertical, 100% width

---

## Empty States

**Iconografía**: Ícono en círculo de fondo muted  
**Mensaje**: Título amigable + explicación clara  
**Acción**: Sugerencia de siguiente paso (si aplica)

---

## Animation Principles

- **Micro-interacciones**: 200ms ease
- **Hover states**: Transiciones suaves en background/border
- **Chart interactions**: Scale + opacity transitions
- **No springs/bounce**: Profesional y calmado

---

## Iconography

**Set**: Lucide React (consistencia con proyecto)

**Uso**:
- Clarifica, no decora
- Iconos standalone tienen background container sutil
- Tamaño consistente: `w-5 h-5` para nav, `w-4 h-4` para inline

---

## Navigation Context

- Cada página muestra dónde está el usuario
- Sidebar mismo background que canvas (border separation)
- Active state: `bg-primary/10 text-primary`

---

## Data Visualization

**Pie Chart**:
- Inner radius para estilo donut
- Padding angle pequeño (2deg) entre porciones
- Colores consistentes por categoría

**Tooltips**:
- Background: `bg-card`
- Border: Sutil, mismo sistema
- Content: Nombre + monto formateado + porcentaje

---

## Error Handling

- No datos: Empty state informativo
- Loading: Skeleton que respeta layout
- Error boundary: Fallback genérico (no implementado aún)

---

## Key Decisions

1. **No tablas pesadas**: Listas tipo "movimiento bancario" en vez de tablas para transacciones
2. **Contexto temporal**: Siempre mostrar el mes seleccionado con contador de transacciones
3. **Comparación sutil**: Deltas vs mes anterior en hero numbers, no en el gráfico
4. **Interacción progresiva**: Selección en gráfico → Detalle en panel → Transacciones filtradas abajo
5. **Moneda local**: Formato CLP con separadores de miles (puntos)

---

## File Naming (Project Standard)

- Components: `kebab-case.tsx`
- Hooks: `use-kebab-case.ts`
- Types: `PascalCase` en archivos `types/*.ts`
- Server actions/queries: `kebab-case.ts` en `lib/queries/`

---

*Created: 2026-02-15*  
*Applies to: Dashboard, Reports, and future data visualization features*
