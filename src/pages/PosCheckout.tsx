import React, { useState } from 'react';
import { ShoppingBag, ArrowRight, CheckCircle2, XCircle, CreditCard, RefreshCw, LogOut } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { NfcReaderModal } from '../components/NfcReaderModal';

export const PosCheckout: React.FC = () => {
  const [amountStr, setAmountStr] = useState('');
  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false);
  const [quoteData, setQuoteData] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [completedTx, setCompletedTx] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { logout } = useAuth();

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setAmountStr('');
      setQuoteData(null);
      setCompletedTx(null);
      setErrorMessage(null);
      return;
    }
    if (amountStr.length >= 6) return;
    setAmountStr((prev) => prev + val);
  };

  const handleStartScan = () => {
    const parsedAmount = parseInt(amountStr, 10);
    if (!parsedAmount || parsedAmount <= 0) {
      setErrorMessage('Ingrese un monto válido.');
      return;
    }
    setErrorMessage(null);
    setIsNfcModalOpen(true);
  };

  const handleCardRead = async (cardUid: string) => {
    setIsNfcModalOpen(false);
    setErrorMessage(null);

    try {
      const parsedAmount = parseInt(amountStr, 10);
      const res = await apiClient.post('/transactions/quote', {
        cardUid,
        amount: parsedAmount,
      });

      setQuoteData({ ...res.data, cardUid });
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Error verificando tarjeta.');
    }
  };

  const handleConfirmPurchase = async () => {
    if (!quoteData || !quoteData.authorized) return;
    setIsExecuting(true);
    setErrorMessage(null);

    const idempotencyKey = `POS-TX-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const res = await apiClient.post('/transactions/purchase', {
        idempotencyKey,
        cardUid: quoteData.cardUid,
        amount: quoteData.purchaseAmount,
        terminalCode: 'POS-KIOSCO-1',
        description: 'Compra Kiosco',
      });

      setCompletedTx(res.data);
      setQuoteData(null);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Falló la ejecución de la compra.');
    } finally {
      setIsExecuting(false);
    }
  };

  const resetFlow = () => {
    setAmountStr('');
    setQuoteData(null);
    setCompletedTx(null);
    setErrorMessage(null);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-sm">Caja Escolar</h1>
              <p className="text-[11px] text-slate-500">Terminal Kiosco</p>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="my-5 bg-white rounded-2xl p-5 shadow-sm border border-slate-200 text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Monto a Cobrar</p>
          <div className="text-3xl font-black text-slate-900">
            ${amountStr ? parseInt(amountStr, 10).toLocaleString('es-CL') : '0'}{' '}
            <span className="text-sm font-semibold text-slate-400">CLP</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {quoteData && (
          <div className="mb-4 bg-white rounded-2xl p-4 shadow border border-indigo-100">
            <h3 className="font-bold text-xs text-slate-800 mb-2 border-b pb-2">Comprobación de Saldo</h3>
            <div className="space-y-1 text-xs text-slate-600">
              <div className="flex justify-between"><span>Alumna:</span><strong className="text-slate-800">{quoteData.studentName}</strong></div>
              <div className="flex justify-between"><span>Saldo Actual:</span><span>${quoteData.currentBalance.toLocaleString('es-CL')} CLP</span></div>
              <div className="flex justify-between text-indigo-600 font-medium"><span>A Descontar:</span><span>-${quoteData.purchaseAmount.toLocaleString('es-CL')} CLP</span></div>
              <div className="flex justify-between border-t pt-1 font-bold text-slate-900">
                <span>Saldo Restante:</span>
                <span className={quoteData.resultingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  ${quoteData.resultingBalance.toLocaleString('es-CL')} CLP
                </span>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button onClick={resetFlow} className="flex-1 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold">
                Cancelar
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={isExecuting || !quoteData.authorized}
                className="flex-1 py-2 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg font-bold flex items-center justify-center gap-1"
              >
                {isExecuting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Cobrar
              </button>
            </div>
          </div>
        )}

        {completedTx && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-emerald-900">Pago Aprobado</h3>
            <p className="text-xs text-emerald-700 mb-3">{completedTx.studentName}</p>
            <div className="bg-white rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between text-slate-600"><span>Cobrado:</span><strong>${completedTx.transaction.amount.toLocaleString('es-CL')} CLP</strong></div>
              <div className="flex justify-between text-slate-600"><span>Nuevo Saldo:</span><strong className="text-emerald-700">${completedTx.transaction.resulting_balance.toLocaleString('es-CL')} CLP</strong></div>
            </div>
            <button onClick={resetFlow} className="mt-3 w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg">
              Nueva Venta
            </button>
          </div>
        )}

        {!quoteData && !completedTx && (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'CLEAR', 0, '00'].map((val) => (
              <button
                key={val}
                onClick={() => (val === 'CLEAR' ? handleKeypadPress('CLEAR') : handleKeypadPress(val.toString()))}
                className="h-12 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold rounded-xl shadow-sm border border-slate-200 text-base"
              >
                {val === 'CLEAR' ? <span className="text-xs text-red-500">BORRAR</span> : val}
              </button>
            ))}
          </div>
        )}
      </div>

      {!quoteData && !completedTx && (
        <div className="mt-4">
          <button
            onClick={handleStartScan}
            disabled={!amountStr || parseInt(amountStr, 10) <= 0}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 text-sm"
          >
            <CreditCard className="w-4 h-4" />
            <span>Leer Tarjeta NFC</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <NfcReaderModal
        isOpen={isNfcModalOpen}
        onClose={() => setIsNfcModalOpen(false)}
        onCardDetected={handleCardRead}
      />
    </div>
  );
};
