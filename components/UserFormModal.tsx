'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User, UserRole, CreateUserDto, UpdateUserDto } from '@/types/user';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, Eye, EyeOff } from 'lucide-react';

// Validación de password
const passwordRequirements = {
  minLength: (value: string) => value.length >= 8,
  hasUpperCase: (value: string) => /[A-Z]/.test(value),
  hasLowerCase: (value: string) => /[a-z]/.test(value),
  hasNumber: (value: string) => /[0-9]/.test(value),
  hasSpecialChar: (value: string) => /[@$!%*?&]/.test(value),
};

const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[@$!%*?&]/, 'Debe contener al menos un carácter especial (@$!%*?&)');

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: passwordSchema,
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  role: z.nativeEnum(UserRole),
});

const updateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Permitir vacío en modo edición
      return passwordSchema.safeParse(val).success;
    }, 'La contraseña no cumple con los requisitos'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  role: z.nativeEnum(UserRole),
  isActive: z.boolean(),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;
type FormData = CreateFormData | UpdateFormData;

interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  user?: User | null;
}

export function UserFormModal({ open, onClose, user }: UserFormModalProps) {
  const isEditMode = !!user;
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(isEditMode ? updateUserSchema : createUserSchema),
    defaultValues:
      isEditMode && user
        ? {
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            password: '',
          }
        : {
            email: '',
            name: '',
            role: UserRole.AUXILIAR,
            password: '',
          },
  });

  const password = watch('password') || '';

  useEffect(() => {
    setPasswordValue(password);
  }, [password]);

  useEffect(() => {
    if (open) {
      if (isEditMode && user) {
        reset({
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          password: '',
        });
      } else {
        reset({
          email: '',
          name: '',
          role: UserRole.AUXILIAR,
          password: '',
        });
      }
      setPasswordValue('');
      setShowPassword(false);
    }
  }, [open, user, isEditMode, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode && user) {
        const updateData: UpdateUserDto = {
          email: data.email,
          name: data.name,
          role: data.role,
          isActive: 'isActive' in data ? data.isActive : true,
        };
        if (data.password && data.password.trim() !== '') {
          updateData.password = data.password;
        }
        await updateMutation.mutateAsync({ id: user.id, data: updateData });
      } else {
        const createData: CreateUserDto = {
          email: data.email,
          password: data.password || '',
          name: data.name,
          role: data.role,
        };
        await createMutation.mutateAsync(createData);
      }
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">
            {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {isEditMode
              ? 'Actualiza la información del usuario'
              : 'Completa los datos para crear un nuevo usuario'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className="mt-2"
              placeholder="usuario@mipc.com.co"
            />
            {errors.email && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Nombre */}
          <div>
            <Label htmlFor="name">Nombre Completo *</Label>
            <Input
              id="name"
              type="text"
              {...register('name')}
              className="mt-2"
              placeholder="Juan Pérez"
            />
            {errors.name && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">
              Contraseña {isEditMode && '(dejar vacío para no cambiar)'}
              {!isEditMode && ' *'}
            </Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="pr-10"
                placeholder={isEditMode ? '••••••••' : 'Password123*'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                {errors.password.message}
              </p>
            )}

            {/* Password requirements */}
            {(passwordValue || !isEditMode) && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-1">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Requisitos de contraseña:
                </p>
                {[
                  {
                    label: 'Mínimo 8 caracteres',
                    check: passwordRequirements.minLength,
                  },
                  {
                    label: 'Una mayúscula',
                    check: passwordRequirements.hasUpperCase,
                  },
                  {
                    label: 'Una minúscula',
                    check: passwordRequirements.hasLowerCase,
                  },
                  { label: 'Un número', check: passwordRequirements.hasNumber },
                  {
                    label: 'Un carácter especial (@$!%*?&)',
                    check: passwordRequirements.hasSpecialChar,
                  },
                ].map((req, i) => {
                  const isValid = passwordValue
                    ? req.check(passwordValue)
                    : false;
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {isValid ? (
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      ) : (
                        <X className="w-3 h-3 text-red-500 dark:text-red-400" />
                      )}
                      <span
                        className={
                          isValid
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-gray-600 dark:text-gray-400'
                        }
                      >
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rol */}
          <div>
            <Label htmlFor="role">Rol *</Label>
            <select
              id="role"
              {...register('role')}
              className="mt-2 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={UserRole.ADMIN}>Administrador</option>
              <option value={UserRole.TECNICO}>Técnico</option>
              <option value={UserRole.AUXILIAR}>Auxiliar</option>
            </select>
            {errors.role && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Estado (solo en edición) */}
          {isEditMode && (
            <div className="flex items-center gap-3">
              <input
                id="isActive"
                type="checkbox"
                {...register('isActive')}
                className="w-5 h-5 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Usuario Activo
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditMode
                  ? 'Actualizando...'
                  : 'Creando...'
                : isEditMode
                ? 'Actualizar'
                : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
