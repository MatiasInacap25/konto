# Form Sheet Design Pattern

**Fecha**: 2026-03-07  
**Objetivo**: Estandarizar el diseño de formularios en Sheets para mantener consistencia visual y UX

---

## Patrón Base

Todos los formularios en Sheet deben seguir este diseño compacto y profesional.

### Estructura General

```tsx
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetContent className="sm:max-w-[400px] overflow-y-auto flex flex-col gap-0 px-6">
    {/* Header */}
    <SheetHeader className="text-left pb-4">
      <SheetTitle className="text-base font-semibold">
        {isEditing ? "Editar X" : "Crear X"}
      </SheetTitle>
      <SheetDescription className="text-sm">
        Descripción breve del formulario
      </SheetDescription>
    </SheetHeader>

    {/* Form */}
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col px-1">
      <div className="space-y-4 flex-1">
        {/* Campos aquí */}
      </div>

      {/* Actions - siempre al final */}
      <div className="flex gap-2 pt-4 pb-1">
        <Button type="submit" disabled={isPending} className="flex-1 h-9">
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Actualizar" : "Crear"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
          className="h-9"
        >
          Cancelar
        </Button>
      </div>
    </form>
  </SheetContent>
</Sheet>
```

---

## Dimensiones

- **Sheet width**: `sm:max-w-[400px]` (hasta 420px para formularios más complejos)
- **Input height**: `h-9` (estándar)
- **Button height**: `h-9`
- **Label font**: `text-sm font-medium`
- **Description font**: `text-xs`
- **Error messages**: `text-xs text-destructive`

---

## Campos de Formulario

### Campo de Texto Simple

```tsx
<div className="space-y-1.5">
  <Label htmlFor="name" className="text-sm font-medium">
    Nombre
  </Label>
  <Input
    id="name"
    placeholder="Texto de ejemplo"
    className="h-9"
    {...register("name")}
    disabled={isPending}
  />
  {errors.name && (
    <p className="text-xs text-destructive">{errors.name.message}</p>
  )}
</div>
```

### Campo de Monto (con símbolo $)

```tsx
<div className="space-y-1.5">
  <Label htmlFor="amount" className="text-sm font-medium">
    Monto
  </Label>
  <div className="relative w-fit">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      $
    </span>
    <Input
      id="amount"
      type="text"
      inputMode="decimal"
      placeholder="0"
      autoComplete="off"
      className="pl-7 text-base font-semibold h-9 w-44 font-mono tabular-nums"
      {...register("amount")}
      disabled={isPending}
    />
  </div>
  {errors.amount && (
    <p className="text-xs text-destructive">{errors.amount.message}</p>
  )}
</div>
```

**Características clave**:
- `w-44` o `w-40` (ancho fijo compacto)
- `font-mono tabular-nums` para números alineados
- `pl-7` para espacio del símbolo `$`
- Placeholder sin `$`

### Select

```tsx
<div className="space-y-1.5">
  <Label className="text-sm font-medium">Categoría</Label>
  <Select value={value} onValueChange={setValue}>
    <SelectTrigger className="h-9">
      <SelectValue placeholder="Seleccionar" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option1">Opción 1</SelectItem>
      <SelectItem value="option2">Opción 2</SelectItem>
    </SelectContent>
  </Select>
  {errors.field && (
    <p className="text-xs text-destructive">{errors.field.message}</p>
  )}
</div>
```

### Date Picker (compacto)

```tsx
<div className="space-y-1.5">
  <Label className="text-sm font-medium">Fecha</Label>
  <Popover>
    <PopoverTrigger asChild>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal h-9 text-sm",
          !date && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
        {date ? format(date, "d MMM yyyy", { locale: es }) : "Seleccionar"}
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
      <Calendar
        mode="single"
        selected={date}
        onSelect={setDate}
        initialFocus
      />
    </PopoverContent>
  </Popover>
  {errors.date && (
    <p className="text-xs text-destructive">{errors.date.message}</p>
  )}
</div>
```

**Formato de fecha**:
- Compacto: `"d MMM"` → "15 Mar"
- Con año: `"d MMM yyyy"` → "15 Mar 2026"
- Completo: `"PPP"` → "15 de marzo de 2026" (solo si es necesario)

### Switch / Toggle

```tsx
<div className="flex items-center justify-between py-2">
  <div className="space-y-0.5">
    <Label className="text-sm font-medium">Opción</Label>
    <p className="text-xs text-muted-foreground">
      Descripción de la opción
    </p>
  </div>
  <Switch
    checked={value}
    onCheckedChange={setValue}
    disabled={isPending}
  />
</div>
```

### Textarea

```tsx
<div className="space-y-1.5">
  <Label htmlFor="description" className="text-sm font-medium">
    Descripción
  </Label>
  <Textarea
    id="description"
    placeholder="Opcional"
    className="min-h-[80px] resize-none"
    {...register("description")}
    disabled={isPending}
  />
  {errors.description && (
    <p className="text-xs text-destructive">{errors.description.message}</p>
  )}
</div>
```

---

## Layouts Especiales

### Grid 2 columnas (para fechas, montos relacionados)

```tsx
<div className="grid grid-cols-2 gap-3">
  <div className="space-y-1.5">
    {/* Campo 1 */}
  </div>
  <div className="space-y-1.5">
    {/* Campo 2 */}
  </div>
</div>
```

### Toggle compacto (tipo transacción, etc.)

```tsx
<div className="flex items-center gap-1 p-1 bg-muted/60 rounded-lg w-fit">
  <button
    type="button"
    onClick={() => setValue("type", "OPTION1")}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
      selectedType === "OPTION1"
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <Icon className="h-3.5 w-3.5" />
    Opción 1
  </button>
  <button
    type="button"
    onClick={() => setValue("type", "OPTION2")}
    className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
      selectedType === "OPTION2"
        ? "bg-background text-foreground shadow-sm"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <Icon className="h-3.5 w-3.5" />
    Opción 2
  </button>
</div>
```

### Lista dinámica (FieldArray)

```tsx
<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Label className="text-sm font-medium">Items</Label>
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8"
      onClick={() => append({ value: "" })}
      disabled={isPending}
    >
      <Plus className="mr-1.5 h-3.5 w-3.5" />
      Agregar
    </Button>
  </div>

  {fields.length === 0 && (
    <p className="text-xs text-muted-foreground">
      No hay items. Agregá uno para comenzar.
    </p>
  )}

  {fields.map((field, index) => (
    <div key={field.id} className="flex gap-2 items-start">
      <div className="flex-1">
        <Input
          placeholder="Valor"
          className="h-9"
          {...register(`items.${index}.value`)}
          disabled={isPending}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => remove(index)}
        disabled={isPending}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  ))}
</div>
```

---

## Mensajes de Validación

### Error individual (debajo del campo)

```tsx
{errors.field && (
  <p className="text-xs text-destructive">{errors.field.message}</p>
)}
```

### Warning (no bloqueante)

```tsx
{warning && (
  <p className="text-xs text-yellow-600 font-medium">{warning}</p>
)}
```

### Info / Ayuda

```tsx
<p className="text-xs text-muted-foreground">
  Texto de ayuda o información adicional
</p>
```

---

## Botones de Acción

### Patrón estándar (al final del form)

```tsx
<div className="flex gap-2 pt-4 pb-1">
  <Button type="submit" disabled={isPending} className="flex-1 h-9">
    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    {isEditing ? "Actualizar" : "Crear"}
  </Button>
  <Button
    type="button"
    variant="outline"
    onClick={() => onOpenChange(false)}
    disabled={isPending}
    className="h-9"
  >
    Cancelar
  </Button>
</div>
```

**Reglas**:
- Submit button siempre `flex-1` (ocupa más espacio)
- Cancelar siempre `variant="outline"`
- Ambos `h-9`
- Loader spinner en submit cuando `isPending`
- Texto corto: "Crear", "Actualizar", "Guardar" (sin repetir el nombre del objeto)

### Botón destructivo (eliminar)

```tsx
<Button
  type="button"
  variant="destructive"
  onClick={handleDelete}
  disabled={isPending}
  className="h-9"
>
  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Eliminar
</Button>
```

---

## Espaciado

- **Entre campos**: `space-y-4` (container principal)
- **Label a Input**: `space-y-1.5`
- **Entre botones**: `gap-2`
- **Grid columns**: `gap-3`
- **Padding del form**: `px-1` (para alinear con header)
- **Padding top de acciones**: `pt-4`

---

## Iconos

### Tamaños estándar

- **En labels/títulos**: `h-4 w-4`
- **En botones compactos**: `h-3.5 w-3.5`
- **En calendarios/selects**: `h-3.5 w-3.5`
- **En botones icon**: `h-4 w-4`

### Spacing con texto

- **Antes del texto**: `mr-2` (normal), `mr-1.5` (compacto)
- **Después del texto**: `ml-2` (normal), `ml-1.5` (compacto)

---

## Colores Semánticos

- **Destructive/Error**: `text-destructive` o `text-red-600`
- **Warning**: `text-yellow-600`
- **Success**: `text-emerald-600 dark:text-emerald-400`
- **Muted/Helper**: `text-muted-foreground`
- **Income/Positive**: `text-emerald-600 dark:text-emerald-400`
- **Expense/Negative**: `text-foreground` (default)

---

## Accesibilidad

### Labels siempre con htmlFor

```tsx
<Label htmlFor="fieldName" className="text-sm font-medium">
  Campo
</Label>
<Input id="fieldName" {...register("fieldName")} />
```

### Placeholder descriptivo pero corto

- ✅ "Ingresá un nombre"
- ✅ "Opcional"
- ✅ "0"
- ❌ "Por favor ingrese aquí el nombre de la cuenta"

### Disabled state consistente

Todos los inputs deben respetar `disabled={isPending}` durante submit.

---

## Ejemplos Reales

### Transaction Sheet
`src/components/transactions/transaction-sheet.tsx`
- Toggle de tipo (Gasto/Ingreso)
- Campo de monto con $
- Selects compactos
- Date picker

### Budget Sheet
`src/components/budgets/budget-sheet.tsx`
- Periodo con presets
- Grid de fechas
- FieldArray de límites por categoría
- Warning de suma

### Account Sheet
`src/components/accounts/account-sheet.tsx`
- Select de tipo con iconos
- Balance inicial
- Switch de isBusiness

---

## Checklist Pre-commit

Antes de hacer commit de un nuevo form sheet, verificá:

- [ ] Width del sheet: `sm:max-w-[400px]` o `sm:max-w-[420px]`
- [ ] Todos los inputs tienen `h-9`
- [ ] Todos los botones tienen `h-9`
- [ ] Labels con `text-sm font-medium`
- [ ] Errores con `text-xs text-destructive`
- [ ] Spacing: `space-y-4` en container, `space-y-1.5` en campos
- [ ] Submit button con `flex-1`
- [ ] Loader spinner en submit button
- [ ] Texto de botones corto (sin repetir el objeto)
- [ ] Todos los campos disabled durante `isPending`
- [ ] Labels con `htmlFor` correcto
- [ ] Placeholders cortos y descriptivos

---

## Notas Finales

Este patrón se creó analizando `transaction-sheet.tsx` y `budget-sheet.tsx` después de ajustarlos para máxima compacidad y profesionalismo.

**Objetivo**: Formularios consistentes, compactos, accesibles y fáciles de usar en mobile y desktop.

**Cuándo romper las reglas**: Solo si hay una razón técnica o UX específica (documentar en comentario).
