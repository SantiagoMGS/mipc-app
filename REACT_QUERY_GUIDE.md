# 🚀 Guía de Implementación: React Query en MIPC App

## ✅ Instalación Completada

- ✅ @tanstack/react-query@5.x
- ✅ @tanstack/react-query-devtools
- ✅ QueryClient configurado en `/lib/queryClient.ts`
- ✅ Provider agregado en `/components/Providers.tsx`
- ✅ DevTools habilitado (solo en desarrollo)

---

## 📁 Estructura de Hooks Creados

### `/hooks/useCustomers.ts`

Hooks disponibles:

- `useCustomers(params)` - Lista de clientes con paginación
- `useCustomer(id)` - Un cliente específico
- `useCreateCustomer()` - Crear cliente
- `useUpdateCustomer()` - Actualizar cliente
- `useDeleteCustomer()` - Eliminar cliente

---

## 🎯 Ejemplo de Uso: Página de Clientes

### Antes (Sin React Query)

```typescript
export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [currentPage]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await customersService.getAll({...});
      setCustomers(response.data);
    } catch (err) {
      setError('Error...');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await customersService.delete(id);
      await loadCustomers(); // Refetch manual
      setToast({ message: 'Eliminado', type: 'success' });
    } catch (err) {
      setToast({ message: 'Error', type: 'error' });
    }
  };
}
```

### Después (Con React Query)

```typescript
import { useCustomers, useDeleteCustomer } from '@/hooks/useCustomers';

export default function ClientesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 🎯 Una línea = datos + loading + error
  const { data, isLoading, error } = useCustomers({
    page: currentPage,
    limit: itemsPerPage,
  });

  // 🎯 Mutation con invalidación automática
  const deleteMutation = useDeleteCustomer();

  const handleDelete = (id: string) => {
    // Elimina + refetch automático + toast incluido
    deleteMutation.mutate(id);
  };

  // 🎯 Los datos ya vienen formateados
  const customers = data?.customers || [];
  const total = data?.total || 0;
}
```

---

## 💡 Beneficios que Obtienes

### 1. **Menos Código**

- ❌ Antes: ~150 líneas de lógica de fetching
- ✅ Ahora: ~20 líneas

### 2. **Caché Automático**

```typescript
// Ir a /clientes → fetch
// Ir a /productos → no fetch
// Volver a /clientes → NO FETCH! (usa caché)
```

### 3. **Refetch Automático**

```typescript
// Crear cliente
createMutation.mutate(data);
// ↓ automático
// - Invalida caché
// - Refetch de lista
// - UI actualizada
```

### 4. **Estados Integrados**

```typescript
const { data, isLoading, error, isFetching, isRefetching } = useCustomers();

// Loading inicial
if (isLoading) return <Spinner />;

// Refetch en background
if (isFetching) return <RefreshIcon className="animate-spin" />;

// Error con retry
if (error) return <ErrorMessage error={error} />;
```

### 5. **Optimistic Updates** (Opcional)

```typescript
const deleteMutation = useMutation({
  mutationFn: customersService.delete,
  onMutate: async (id) => {
    // Cancelar refetch
    await queryClient.cancelQueries(['customers']);

    // Guardar snapshot
    const previous = queryClient.getQueryData(['customers']);

    // Update optimista (UI instantánea)
    queryClient.setQueryData(['customers'], (old) =>
      old.filter((c) => c.id !== id)
    );

    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback si falla
    queryClient.setQueryData(['customers'], context.previous);
  },
});
```

---

## 🔧 DevTools

Presiona estas teclas en desarrollo:

- Abre un círculo flotante en la esquina
- Click para ver:
  - ✅ Queries activas
  - ✅ Estado de caché
  - ✅ Historial de refetch
  - ✅ Mutaciones pendientes

---

## 📝 Próximos Pasos

### 1. Crear hooks para otras entidades:

```bash
/hooks/useItems.ts        # Productos
/hooks/useDeviceTypes.ts  # Tipos de dispositivo
/hooks/useDevices.ts      # Dispositivos
```

### 2. Migrar páginas una por una:

1. ✅ `/app/dashboard/clientes/page.tsx`
2. ⏳ `/app/dashboard/productos/page.tsx`
3. ⏳ `/app/dashboard/tipos-dispositivo/page.tsx`
4. ⏳ `/app/dashboard/clientes/[id]/page.tsx`

---

## 🎨 Patrón Recomendado

```typescript
// 1. Definir keys (para invalidación)
export const itemKeys = {
  all: ['items'] as const,
  lists: () => [...itemKeys.all, 'list'] as const,
  list: (filters: any) => [...itemKeys.lists(), filters] as const,
  detail: (id: string) => [...itemKeys.all, 'detail', id] as const,
};

// 2. Hook de query
export function useItems(params) {
  return useQuery({
    queryKey: itemKeys.list(params),
    queryFn: () => itemsService.getAll(params),
  });
}

// 3. Hook de mutation
export function useCreateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: itemsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itemKeys.lists() });
      toast({ title: 'Éxito', description: '¡Creado!' });
    },
  });
}
```

---

## 📚 Recursos

- [TanStack Query Docs](https://tanstack.com/query/latest)
- [React Query Tutorial](https://ui.dev/c/react-query)
- [DevTools Guide](https://tanstack.com/query/latest/docs/devtools)

---

## 🚦 Estado Actual

- ✅ QueryClient configurado
- ✅ Provider instalado
- ✅ DevTools habilitado
- ✅ Hooks de clientes creados
- ⏳ Migración de páginas pendiente

**Siguiente:** Migrar `/app/dashboard/clientes/page.tsx` usando los hooks
