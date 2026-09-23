import React from 'react';
import { RotateCcw, AlertTriangle, X, Check, Watch, Trash2 } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
      <div 
        id="modal-reset-confirm"
        className="relative w-full max-w-lg bg-[#0A0A0A] border border-red-500/40 rounded-2xl shadow-2xl shadow-black overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-950/60 via-[#0A0A0A] to-red-950/60 border-b border-red-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/10">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">
                Zerar Dados & Estatísticas
              </h3>
              <p className="text-xs text-red-300">
                Reinicialização completa dos parâmetros do atleta
              </p>
            </div>
          </div>

          <button
            id="btn-close-reset-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-red-200">
                Atenção: todos os dados atuais serão apagados!
              </p>
              <p className="text-red-300/90 leading-relaxed text-[11px]">
                O perfil, histórico de testes de campo, registros de recuperação diária e métricas serão reiniciados para o estado zerado.
              </p>
            </div>
          </div>

          <div className="bg-[#121214] p-4 rounded-xl border border-white/10 space-y-2.5">
            <div className="flex items-center gap-2 text-white font-semibold text-xs">
              <Watch className="w-4 h-4 text-[#FF4E00]" />
              Como funcionará a calibração automática?
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Após zerar tudo, você será direcionado para a aba <strong>Importar Relógio</strong>. Assim que enviar seu primeiro arquivo <strong>.GPX</strong> ou <strong>.TCX</strong>:
            </p>
            <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc pl-4 font-mono-data">
              <li>O sistema calculará seu <strong>VDOT exato e VO2máx</strong> da atividade.</li>
              <li>Detectará suas <strong>frequências cardíacas e cadência</strong> reais.</li>
              <li>Diagnosticará seu <strong>nível atlético e ritmos de treino (E, M, T, I, R)</strong>.</li>
              <li>Gerará uma nova <strong>Planilha de 8 Semanas</strong> 100% personalizada.</li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-[#121214] border-t border-white/10 px-6 py-4 flex items-center justify-end gap-3">
          <button
            id="btn-cancel-reset"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            id="btn-confirm-reset-all"
            onClick={onConfirmReset}
            className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-600/25 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Zerar Tudo & Iniciar Calibração
          </button>
        </div>
      </div>
    </div>
  );
};
