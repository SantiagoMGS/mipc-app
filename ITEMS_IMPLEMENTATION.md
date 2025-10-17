# Gestión de Items en Órdenes de Servicio - Implementación Completa

## 📋 Resumen de Implementación

Se ha implementado exitosamente el módulo completo de gestión de items (productos y servicios) para órdenes de servicio, siguiendo las especificaciones proporcionadas.

---

## ✅ Archivos Creados/Modificados

### 1. **Tipos TypeScript**

#### `/types/item.ts` ⭐ ACTUALIZADO

- Agregado `ServiceOrderItem` interface
- Agregado `AddItemToOrderDto` interface
- Mantiene interfaces existentes: `Item`, `CreateItemDto`, `UpdateItemDto`

#### `/types/service-order.ts` ⭐ ACTUALIZADO

- Agregados campos `laborCost` y `partsCost` a `ServiceOrder`
- `totalCost` ahora se calcula automáticamente como `laborCost + partsCost`

### 2. **Servicios API**

#### `/lib/api.ts` ⭐ ACTUALIZADO

- Agregado `serviceOrderItemsService` con 3 métodos:
  - `getOrderItems(orderId)` - Listar items de una orden
  - `addItem(orderId, data)` - Agregar item a una orden
  - `removeItem(orderId, itemId)` - Eliminar item de una orden

### 3. **Hooks Personalizados**

#### `/hooks/useOrderItems.ts` ⭐ NUEVO

- Hook personalizado para gestionar items de órdenes
- Estados: `items`, `loading`, `error`
- Métodos: `addItem`, `removeItem`, `refetch`
- Integrado con `useToast` para notificaciones
- Retorna la orden actualizada después de cada operación

### 4. **Utilidades**

#### `/lib/utils.ts` ⭐ ACTUALIZADO

- Agregada función `formatCurrency(value)`
- Formatea números como pesos colombianos (COP)
- Formato: `$ 1.234.567` (sin decimales)

### 5. **Componentes UI Base**

#### `/components/ui/badge.tsx` ⭐ NUEVO

- Badge component usando class-variance-authority
- Variantes: `default`, `secondary`, `destructive`, `outline`
- Estilos con Tailwind CSS

#### `/components/ui/scroll-area.tsx` ⭐ NUEVO

- Componente de scroll simplificado
- Wrapper sobre div con `overflow-auto`

#### `/components/ui/separator.tsx` ⭐ NUEVO

- Separador horizontal simple
- Línea de 1px con color de borde

### 6. **Componentes Principales**

#### `/components/AddItemDialog.tsx` ⭐ NUEVO (235 líneas)

**Funcionalidad:**

- Modal para agregar items a una orden
- Carga catálogo de items activos al abrir
- Selección de item con visualización de detalles
- Formulario con campos:
  - Cantidad (mínimo 1)
  - Precio Unitario (editable)
  - Descuento
- Cálculo automático de subtotal en tiempo real
- Validaciones antes de enviar

**Características:**

- Badge para distinguir PRODUCTO vs SERVICIO
- Scroll area para lista de items
- Loading states
- Estados de envío (submitting)

#### `/components/ServiceOrderItems.tsx` ⭐ NUEVO (185 líneas)

**Funcionalidad:**

- Tabla completa de items en una orden
- Botón "Agregar Item" (oculto en modo readOnly)
- Columnas: Item, Código, Tipo, Cantidad, Precio Unit., Descuento, Subtotal, Acciones
- Botón de eliminar con confirmación
- Loading states mientras se cargan/modifican items
- Modo `readOnly` para órdenes facturadas/canceladas

**Props:**

- `orderId` - ID de la orden
- `onOrderUpdate` - Callback para refrescar la orden completa
- `readOnly` - Deshabilitar edición (default: false)

#### `/components/ServiceOrderCosts.tsx` ⭐ NUEVO (80 líneas)

**Funcionalidad:**

- Card con resumen completo de costos
- Desglose de:
  - Mano de Obra (laborCost)
  - Repuestos (partsCost)
  - Total (suma automática)
  - Pagado (con color verde)
  - Saldo (rojo si pendiente, verde si pagado)
- Formato de moneda en pesos colombianos

**Características:**

- Colores semánticos para saldos
- Separadores visuales
- Tipografía diferenciada para totales

### 7. **Páginas**

#### `/app/dashboard/ordenes-servicio/[id]/page.tsx` ⭐ ACTUALIZADO

**Cambios:**

- Agregados imports de nuevos componentes
- Agregado `refetch` al hook `useServiceOrder`
- Agregado handler `handleOrderUpdate` para refrescar orden
- **REEMPLAZADA** sección "Información Financiera" con:
  - `<ServiceOrderItems />` - Gestión de items
  - `<ServiceOrderCosts />` - Resumen de costos
- Modo readOnly cuando estado = FACTURADO o CANCELADO

---

## 🔌 Endpoints Utilizados

```typescript
// 1. Obtener catálogo de items
GET /items?withDeleted=false
Authorization: Bearer {token}
→ { data: Item[], meta: { total, page, limit } }

// 2. Listar items de una orden
GET /service-orders/:orderId/items
Authorization: Bearer {token}
→ ServiceOrderItem[]

// 3. Agregar item a orden
POST /service-orders/:orderId/items
Authorization: Bearer {token}
Body: {
  itemId: string,
  quantity?: number,
  unitPrice?: number,
  discount?: number
}
→ ServiceOrder (con costos actualizados)

// 4. Eliminar item de orden
DELETE /service-orders/:orderId/items/:serviceOrderItemId
Authorization: Bearer {token}
→ ServiceOrder (con costos actualizados)
```

---

## 📊 Flujo de Datos

### Agregar Item:

1. Usuario hace clic en "Agregar Item"
2. `AddItemDialog` se abre y carga catálogo (`itemsService.getAll`)
3. Usuario selecciona item y completa formulario
4. Se envía `POST /service-orders/:orderId/items`
5. Backend:
   - Crea registro en `service_order_items`
   - Recalcula `laborCost` (suma de SERVICIO)
   - Recalcula `partsCost` (suma de PRODUCTO)
   - Calcula `totalCost = laborCost + partsCost`
   - Actualiza `balance = totalCost - totalPaid`
6. Retorna orden actualizada
7. Frontend:
   - Muestra toast de éxito
   - Refresca lista de items
   - Llama `onOrderUpdate()` para refrescar orden completa
   - Cierra modal

### Eliminar Item:

1. Usuario hace clic en botón de eliminar
2. Se muestra `ConfirmDialog`
3. Usuario confirma
4. Se envía `DELETE /service-orders/:orderId/items/:itemId`
5. Backend recalcula todos los costos (igual que agregar)
6. Frontend igual que agregar

---

## 🎨 UI/UX Highlights

### Componente `ServiceOrderItems`

- **Estado vacío**: Mensaje amigable "No hay items en esta orden"
- **Loading**: Spinner con texto "Cargando items..."
- **Tabla responsiva**: Todas las columnas necesarias
- **Badges**: Colores distintivos para PRODUCTO (secondary) vs SERVICIO (primary)
- **Formato de moneda**: Todos los valores en pesos colombianos
- **Confirmación de eliminación**: Modal de advertencia antes de eliminar

### Componente `AddItemDialog`

- **Lista scrolleable**: Maneja catálogos grandes
- **Item seleccionado**: Border y fondo distintivo
- **Campos numéricos**: Validación de mínimos (cantidad ≥ 1)
- **Subtotal en vivo**: Se actualiza mientras escribe
- **Precio pre-llenado**: Toma el precio del item del catálogo
- **Loading states**: Spinner al cargar/enviar

### Componente `ServiceOrderCosts`

- **Jerarquía visual**: Totales más grandes que subtotales
- **Colores semánticos**:
  - Verde: Pagado, saldo = 0
  - Rojo: Saldo pendiente
  - Naranja: Saldo negativo (sobrepago)
- **Separadores**: División clara entre secciones

---

## 🔐 Seguridad

- ✅ Todos los endpoints requieren JWT Bearer token
- ✅ Token se incluye automáticamente vía interceptor en `api.ts`
- ✅ Validaciones:
  - Solo items activos se pueden agregar
  - Cantidad debe ser > 0
  - Precio unitario debe ser ≥ 0
- ✅ Modo `readOnly` previene modificaciones en órdenes finalizadas

---

## 💡 Reglas de Negocio Implementadas

1. **Items SERVICIO** → Suman a `laborCost`
2. **Items PRODUCTO** → Suman a `partsCost`
3. **totalCost** = `laborCost + partsCost` (calculado por backend)
4. **balance** = `totalCost - totalPaid` (calculado por backend)
5. **Decimales**: API retorna strings, frontend convierte con `Number()`
6. **ID para eliminar**: Usa `ServiceOrderItem.id`, NO `Item.id`

---

## 🧪 Testing Manual

### Casos a probar:

1. **Agregar item tipo SERVICIO**

   - Verificar que `laborCost` aumenta
   - Verificar que `totalCost` aumenta

2. **Agregar item tipo PRODUCTO**

   - Verificar que `partsCost` aumenta
   - Verificar que `totalCost` aumenta

3. **Agregar múltiples items**

   - Cantidad > 1
   - Con descuento
   - Con precio personalizado diferente al catálogo

4. **Eliminar item**

   - Verificar que costos se recalculan
   - Verificar que `balance` se actualiza

5. **Orden en estado FACTURADO**

   - Verificar que no aparece botón "Agregar Item"
   - Verificar que no aparecen botones de eliminar

6. **Formato de moneda**
   - Verificar que todos los valores muestran `$ x.xxx.xxx`
   - Sin decimales

---

## 📝 Notas Técnicas

### Tipo de Decimal como String

El backend retorna decimales como strings (`"1234.56"`) para evitar problemas de precisión. El frontend convierte con `Number()` al momento de mostrar.

```typescript
// ❌ NO hacer
<td>{orderItem.unitPrice}</td>

// ✅ Hacer
<td>{formatCurrency(Number(orderItem.unitPrice))}</td>
```

### ID Correcto para Eliminar

Usar el ID del registro de la tabla intermedia, NO el ID del item del catálogo:

```typescript
// ❌ NO hacer
removeItem(orderItem.item.id);

// ✅ Hacer
removeItem(orderItem.id);
```

### Refrescar Orden Completa

Siempre llamar `onOrderUpdate()` después de agregar/eliminar para actualizar costos:

```typescript
const result = await addItem(data);
if (result) {
  onOrderUpdate?.(); // ⭐ Importante
}
```

---

## 🐛 Troubleshooting

| Error                        | Causa                         | Solución                                   |
| ---------------------------- | ----------------------------- | ------------------------------------------ |
| 404 al agregar               | `orderId` o `itemId` inválido | Verificar IDs en consola                   |
| 400 al agregar               | Item inactivo o cantidad = 0  | Filtrar `isActive: true`, validar cantidad |
| Costos no actualizan         | No se llama `onOrderUpdate`   | Agregar callback                           |
| Formato de moneda incorrecto | No se usa `formatCurrency`    | Usar helper en todos los valores           |
| Tipos TypeScript             | Caché de TS desactualizado    | Reiniciar VS Code / TS server              |

---

## 🎯 Checklist de Implementación

- [x] Actualizar tipo `ServiceOrder` con `laborCost` y `partsCost`
- [x] Crear tipo `ServiceOrderItem` y `AddItemToOrderDto`
- [x] Crear `serviceOrderItemsService` con 3 métodos
- [x] Crear hook `useOrderItems`
- [x] Crear función `formatCurrency`
- [x] Crear componentes UI: Badge, ScrollArea, Separator
- [x] Crear componente `AddItemDialog`
- [x] Crear componente `ServiceOrderItems`
- [x] Crear componente `ServiceOrderCosts`
- [x] Integrar en página de detalle de orden
- [x] Implementar modo `readOnly` para órdenes finalizadas
- [x] Agregar confirmación de eliminación
- [x] Implementar loading states
- [x] Integrar notificaciones toast

---

## 🚀 Próximos Pasos Sugeridos

1. **Testing exhaustivo** con diferentes tipos de items
2. **Manejo de errores** más específicos (por ejemplo, stock insuficiente)
3. **Edición de items** existentes (cambiar cantidad/precio)
4. **Historial de cambios** en items
5. **Impresión/PDF** con items incluidos
6. **Búsqueda/filtro** en catálogo de items (por tipo, nombre, código)

---

## 📚 Documentación de Referencia

- TanStack Query: No se usó en esta implementación (useState + useEffect)
- shadcn/ui: Componentes base (Button, Dialog, Card, Table, Input, Label)
- Lucide Icons: Plus, Trash2, Loader2
- Tailwind CSS: Estilos utility-first

---

**Implementación completada por:** GitHub Copilot  
**Fecha:** 16 de Octubre, 2025  
**Versión:** 1.0.0
