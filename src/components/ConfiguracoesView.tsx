import React, { useState } from 'react';
import { Settings, Save, CheckCircle2, Sliders, MapPin, DollarSign, Bell } from 'lucide-react';
import { ConfiguracaoGeral } from '../types';

interface ConfiguracoesViewProps {
  config: ConfiguracaoGeral;
  onSaveConfig: (newConfig: ConfiguracaoGeral) => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  config,
  onSaveConfig,
}) => {
  const [formData, setFormData] = useState<ConfiguracaoGeral>(config);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Parâmetros & Configurações da Operação
          </h2>
          <p className="text-xs text-slate-500">
            Precificação por KM, diárias padrão de motoboys, regras de baús e integração GPS
          </p>
        </div>

        {saved && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Configurações salvas com sucesso!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
        {/* Precificação & Taxas */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <DollarSign className="w-4 h-4 text-[#E05328]" />
            Tabela de Preços & Remuneração
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Taxa Base por KM Rodado (R$)
              </label>
              <input
                type="number"
                step="0.05"
                value={formData.taxaBaseKm}
                onChange={(e) =>
                  setFormData({ ...formData, taxaBaseKm: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Valor Mínimo por Rota (R$)
              </label>
              <input
                type="number"
                step="1"
                value={formData.taxaMinimaRota}
                onChange={(e) =>
                  setFormData({ ...formData, taxaMinimaRota: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Diária Padrão do Motoboy (R$)
              </label>
              <input
                type="number"
                step="5"
                value={formData.diariaPadraoMotoboy}
                onChange={(e) =>
                  setFormData({ ...formData, diariaPadraoMotoboy: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Regras de Baús & Carga */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Sliders className="w-4 h-4 text-[#E05328]" />
            Capacidade de Carga & Segurança
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Limite de Peso por Moto/Baú (kg)
              </label>
              <input
                type="number"
                value={formData.limitePesoKgPorMoto}
                onChange={(e) =>
                  setFormData({ ...formData, limitePesoKgPorMoto: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Adicional de Urgência / Comício (%)
              </label>
              <input
                type="number"
                value={formData.adicionalUrgenciaPercentual}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    adicionalUrgenciaPercentual: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Integrações & Checklist POD */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Bell className="w-4 h-4 text-[#E05328]" />
            Validação Obrigatória de Comprovação (POD TSE)
          </h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.exigirAssinaturaPOD}
                onChange={(e) =>
                  setFormData({ ...formData, exigirAssinaturaPOD: e.target.checked })
                }
                className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-[#E05328]"
              />
              <span className="font-semibold text-slate-800">
                Exigir Assinatura Digital do recebedor na tela do celular
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.exigirFotoPOD}
                onChange={(e) =>
                  setFormData({ ...formData, exigirFotoPOD: e.target.checked })
                }
                className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-[#E05328]"
              />
              <span className="font-semibold text-slate-800">
                Exigir Foto do material entregue no comitê de bairro
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.rastreamentoGpsAoVivo}
                onChange={(e) =>
                  setFormData({ ...formData, rastreamentoGpsAoVivo: e.target.checked })
                }
                className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-[#E05328]"
              />
              <span className="font-semibold text-slate-800">
                Rastreamento GPS em tempo real dos motoboys habilitado
              </span>
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#E05328] hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </form>
    </div>
  );
};
