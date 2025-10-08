'use client';

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clientes</h1>
          <p className="text-gray-600 mt-2">
            Administra la información de tus clientes
          </p>
        </div>
        <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          + Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 text-center py-8">
          Esta sección está lista para ser implementada.
          <br />
          Aquí podrás gestionar todos tus clientes.
        </p>
      </div>
    </div>
  );
}
