import React, { useEffect, useState } from 'react';
import { Users, CreditCard, DollarSign, ArrowUpRight, RefreshCcw, LogOut } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [recentTx, setRecentTx] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumRes, studRes, txRes] = await Promise.all([
        apiClient.get('/reports/summary'),
        apiClient.get('/students'),
        apiClient.get('/transactions?limit=10'),
      ]);
      setSummary(sumRes.data);
      setStudents(studRes.data);
      setRecentTx(txRes.data);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTopUp = async (accountId: string) => {
    const amountStr = prompt('Monto a recargar en CLP (ej: 2000):');
    if (!amountStr) return;
    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) return alert('Monto inválido.');

    try {
      await apiClient.post(`/accounts/${accountId}/top-ups`, { amount });
      alert('Recarga realizada correctamente.');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error en recarga.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        <RefreshCcw className="w-6 h-6 animate-spin text-indigo-600 mr-2" /> Cargando panel...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900">Panel de Administración Escolar</h1>
          <p className="text-xs text-slate-500">Gestión de Tarjetas y Saldos Virtuales</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1">
            <RefreshCcw className="w-3.5 h-3.5" /> Actualizar
          </button>
          <button onClick={logout} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between text-slate-400 mb-1"><span className="text-[10px] font-bold uppercase">Circulación</span><DollarSign className="w-4 h-4 text-indigo-600" /></div>
          <div className="text-lg font-black text-slate-900">${summary?.totalVirtualBalanceInCirculation.toLocaleString('es-CL')}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between text-slate-400 mb-1"><span className="text-[10px] font-bold uppercase">Compras</span><ArrowUpRight className="w-4 h-4 text-emerald-600" /></div>
          <div className="text-lg font-black text-slate-900">${summary?.totalPurchasesAmount.toLocaleString('es-CL')}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between text-slate-400 mb-1"><span className="text-[10px] font-bold uppercase">Alumnas</span><Users className="w-4 h-4 text-blue-600" /></div>
          <div className="text-lg font-black text-slate-900">{summary?.activeStudents}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between text-slate-400 mb-1"><span className="text-[10px] font-bold uppercase">Tarjetas</span><CreditCard className="w-4 h-4 text-amber-600" /></div>
          <div className="text-lg font-black text-slate-900">{summary?.activeCards} Activas</div>
        </div>
      </div>

      {/* Alumnas */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b"><h2 className="font-bold text-slate-800 text-sm">Alumnas y Cuentas</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Curso</th>
                <th className="p-3">Tarjeta UID</th>
                <th className="p-3 text-right">Saldo</th>
                <th className="p-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((st) => (
                <tr key={st.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono font-medium">{st.student_code}</td>
                  <td className="p-3 font-semibold text-slate-800">{st.first_name} {st.last_name}</td>
                  <td className="p-3">{st.grade_level}</td>
                  <td className="p-3 font-mono">{st.card_uid || <span className="text-amber-500 italic">Sin tarjeta</span>}</td>
                  <td className="p-3 text-right font-bold text-slate-900">${parseInt(st.balance || '0', 10).toLocaleString('es-CL')}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleTopUp(st.account_id)} className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-bold text-[11px]">
                      + Recargar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movimientos Recientes (uso de recentTx) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b"><h2 className="font-bold text-slate-800 text-sm">Últimos Movimientos</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 font-bold uppercase">
              <tr>
                <th className="p-3">Fecha</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Alumna</th>
                <th className="p-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTx.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center text-slate-400">Sin movimientos</td></tr>
              ) : (
                recentTx.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-400">{new Date(tx.created_at).toLocaleTimeString('es-CL')}</td>
                    <td className="p-3 font-semibold">{tx.operation_type}</td>
                    <td className="p-3">{tx.first_name} {tx.last_name}</td>
                    <td className="p-3 text-right font-bold font-mono">${parseInt(tx.amount, 10).toLocaleString('es-CL')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
