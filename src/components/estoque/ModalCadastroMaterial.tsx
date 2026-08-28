import React, { useState, useEffect } from 'react';
import {
  X,
  Boxes,
  Barcode,
  Package,
  Layers,
  MapPin,
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Tag,
  Shield,
  FileText
} from 'lucide-react';
import { Material, TipoMaterial } from '../../types';
import { materiaisRepo, estoqueSaldosRepo, estoqueMovimentacoesRepo } from '../../repositories';
import { CATEGORIAS_MATERIAIS, UNIDADES_MEDIDA_ESTOQUE } from '../../types';

interface ModalCadastroMaterialProps {
  isOpen: boolean;
  onClose: () => void;
  materialParaEditar?: Material | null;
  onSuccess: (material: Material) => void;
  currentUserId: string;
  currentUserName: string;
}

export const ModalCadastroMaterial: React.FC<ModalCadastroMaterialProps> = ({
  isOpen,
  onClose,
  materialParaEditar,
  onSuccess,
  currentUserId,
  currentUserName,
}) => {
  const [sku, setSku] = useState('');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_MATERIAIS[0]);
  const [tipoMaterial, setTipoMaterial] = useState<TipoMaterial>('perfurado_vidro_traseiro');
  const [descricao, setDescricao] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('unidade');
  const [estoqueMinimo, setEstoqueMinimo] = useState<number>(50);
  const [estoqueMaximo, setEstoqueMaximo] = useState<number>(1000);
  const [custoUnitario, setCustoUnitario] = useState<number>(0);
  const [localizacao, setLocalizacao] = useState('Setor A — Prateleira 01');
  const [tamanhoFormato, setTamanhoFormato] = useState('');
  const [lote, setLote] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [candidato, setCandidato] = useState('');
  const [partido, setPartido] = useState('');
  const [numeroCandidato, setNumeroCandidato] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'bloqueado'>('ativo');
  
  // Estoque Inicial (apenas no cadastro novo)
  const [quantidadeInicial, setQuantidadeInicial] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (materialParaEditar) {
      setSku(materialParaEditar.sku || '');
      setCodigoBarras(materialParaEditar.codigoBarras || '');
      setNome(materialParaEditar.nome || '');
      setCategoria(materialParaEditar.categoria || CATEGORIAS_MATERIAIS[0]);
      setTipoMaterial(materialParaEditar.tipoMaterial || 'perfurado_vidro_traseiro');
      setDescricao(materialParaEditar.descricao || '');
      setUnidadeMedida(materialParaEditar.unidadeMedida || 'unidade');
      setEstoqueMinimo(materialParaEditar.estoqueMinimo ?? 50);
      setEstoqueMaximo(materialParaEditar.estoqueMaximo ?? 1000);
      setCustoUnitario(materialParaEditar.custoUnitario ?? 0);
      setLocalizacao(materialParaEditar.localizacao || '');
      setTamanhoFormato(materialParaEditar.tamanhoFormato || '');
      setLote(materialParaEditar.lote || '');
      setDataValidade(materialParaEditar.dataValidade || '');
      setFornecedor(materialParaEditar.fornecedor || '');
      setCandidato(materialParaEditar.candidato || '');
      setPartido(materialParaEditar.partido || '');
      setNumeroCandidato(materialParaEditar.numeroCandidato || '');
      setFotoUrl(materialParaEditar.fotoUrl || '');
      setObservacoes(materialParaEditar.observacoes || '');
      setStatus(materialParaEditar.status || 'ativo');
      setQuantidadeInicial(0);
    } else {
      // Gerar SKU preliminar
      materiaisRepo.gerarProximoSku().then(s => setSku(s)).catch(() => setSku('MAT-000001'));
      setCodigoBarras(`789${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setNome('');
      setCategoria(CATEGORIAS_MATERIAIS[0]);
      setTipoMaterial('perfurado_vidro_traseiro');
      setDescricao('');
      setUnidadeMedida('unidade');
      setEstoqueMinimo(100);
      setEstoqueMaximo(2000);
      setCustoUnitario(15.0);
      setLocalizacao('Setor A — Prateleira 01');
      setTamanhoFormato('');
      setLote(`LOT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`);
      setDataValidade('');
      setFornecedor('');
      setCandidato('');
      setPartido('');
      setNumeroCandidato('');
      setFotoUrl('');
      setObservacoes('');
      setStatus('ativo');
      setQuantidadeInicial(0);
    }
    setErrorMsg(null);
  }, [materialParaEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErrorMsg('O nome do material é obrigatório.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      if (materialParaEditar) {
        // Atualizar
        await materiaisRepo.update(materialParaEditar.id, {
          sku: sku.trim().toUpperCase(),
          codigoBarras: codigoBarras.trim(),
          nome: nome.trim(),
          categoria,
          tipoMaterial,
          descricao: descricao.trim(),
          unidadeMedida,
          estoqueMinimo: Number(estoqueMinimo),
          estoqueMaximo: Number(estoqueMaximo),
          custoUnitario: Number(custoUnitario),
          localizacao: localizacao.trim(),
          tamanhoFormato: tamanhoFormato.trim(),
          lote: lote.trim(),
          dataValidade: dataValidade || null,
          fornecedor: fornecedor.trim(),
          candidato: candidato.trim(),
          partido: partido.trim(),
          numeroCandidato: numeroCandidato.trim(),
          fotoUrl: fotoUrl.trim(),
          observacoes: observacoes.trim(),
          status,
          updatedBy: currentUserId,
        });

        const updated = await materiaisRepo.getById(materialParaEditar.id);
        if (updated) onSuccess(updated);
      } else {
        // Criar novo
        const finalSku = sku.trim() || await materiaisRepo.gerarProximoSku();
        
        // Checar duplicidade
        const existingBySku = await materiaisRepo.getBySku(finalSku);
        if (existingBySku) {
          setErrorMsg(`Já existe um material cadastrado com o SKU ${finalSku}.`);
          setLoading(false);
          return;
        }

        const newId = await materiaisRepo.create({
          sku: finalSku.toUpperCase(),
          codigoBarras: codigoBarras.trim() || null,
          nome: nome.trim(),
          categoria,
          tipoMaterial,
          tipoMaterialLabel: nome.trim(),
          descricao: descricao.trim(),
          unidadeMedida,
          estoqueMinimo: Number(estoqueMinimo),
          estoqueMaximo: Number(estoqueMaximo),
          custoUnitario: Number(custoUnitario),
          localizacao: localizacao.trim(),
          tamanhoFormato: tamanhoFormato.trim(),
          lote: lote.trim(),
          dataValidade: dataValidade || null,
          fornecedor: fornecedor.trim(),
          candidato: candidato.trim(),
          partido: partido.trim(),
          numeroCandidato: numeroCandidato.trim(),
          fotoUrl: fotoUrl.trim(),
          observacoes: observacoes.trim(),
          status,
          createdBy: currentUserId,
          updatedBy: currentUserId,
        });

        // Criar saldo inicial
        const initialQty = Number(quantidadeInicial) || 0;
        await estoqueSaldosRepo.setWithId(newId, {
          materialId: newId,
          estoqueFisico: initialQty,
          disponivel: initialQty,
          reservado: 0,
          emSeparacao: 0,
          liberado: 0,
          avariado: 0,
          bloqueado: 0,
          isDeleted: false,
        });

        // Se informou quantidade inicial > 0, registrar movimentação
        if (initialQty > 0) {
          await estoqueMovimentacoesRepo.create({
            materialId: newId,
            materialNome: nome.trim(),
            materialSku: finalSku.toUpperCase(),
            tipo: 'entrada',
            subtipo: 'saldo_inicial',
            quantidade: initialQty,
            saldoAnterior: 0,
            saldoPosterior: initialQty,
            custoUnitario: Number(custoUnitario),
            valorTotal: initialQty * Number(custoUnitario),
            motivo: 'Lançamento de Saldo Inicial no Cadastro',
            lote: lote.trim(),
            localizacaoDestino: localizacao.trim(),
            usuarioId: currentUserId,
            usuarioNome: currentUserName,
            isDeleted: false,
          });
        }

        const created = await materiaisRepo.getById(newId);
        if (created) onSuccess(created);
      }

      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar material:', err);
      setErrorMsg(err.message || 'Erro ao salvar material no banco de dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="modal-cadastro-material-backdrop" className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div id="modal-cadastro-material" className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#1A1A1E] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E05328] to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-950/30">
              <Boxes className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {materialParaEditar ? 'Editar Material de Estoque' : 'Cadastrar Novo Material'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {materialParaEditar ? `Atualizando dados de ${materialParaEditar.sku}` : 'Catálogo de armazém e controle de saldo'}
              </p>
            </div>
          </div>
          <button
            id="btn-fechar-modal-material"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form id="form-cadastro-material" onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
            {/* Seção 1: Identificação Básica */}
            <div>
              <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#E05328]" />
                Identificação & Classificação
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Código SKU *
                  </label>
                  <input
                    id="input-material-sku"
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="MAT-000001"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328] font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Código de Barras / EAN
                  </label>
                  <div className="relative">
                    <Barcode className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      id="input-material-barcode"
                      type="text"
                      value={codigoBarras}
                      onChange={(e) => setCodigoBarras(e.target.value)}
                      placeholder="7891234560000"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Status no Sistema
                  </label>
                  <select
                    id="select-material-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  >
                    <option value="ativo">Ativo (Permite saídas e reservas)</option>
                    <option value="inativo">Inativo (Bloqueado p/ pedidos)</option>
                    <option value="bloqueado">Bloqueado em Quarentena</option>
                  </select>
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Nome / Descrição do Material *
                  </label>
                  <input
                    id="input-material-nome"
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Perfurado — Vidro Traseiro Oficial 110x45"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    id="select-material-categoria"
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  >
                    {CATEGORIAS_MATERIAIS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tipo Padrão
                  </label>
                  <select
                    id="select-material-tipo"
                    value={tipoMaterial}
                    onChange={(e) => setTipoMaterial(e.target.value as TipoMaterial)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  >
                    <option value="perfurado_vidro_traseiro">Perfurado — Vidro traseiro</option>
                    <option value="pragao_10cm">Pragão — Adesivo de 10 cm</option>
                    <option value="santinhos_impressos">Santinhos impressos</option>
                    <option value="bandeiras_haste">Bandeiras com haste</option>
                    <option value="windbanners_calcada">Windbanners de calçada</option>
                    <option value="revista_tabloide">Revista — Informativo</option>
                    <option value="cartao_qr">Cartão — Mini cartão ou QR</option>
                    <option value="adesivo_15x40">Adesivos 15x40 — Para-choque</option>
                    <option value="santao_a4_a5">Santão — A4/A5 grande</option>
                    <option value="combo_comicio">Combo completo comício</option>
                    <option value="outro">Outro customizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Unidade de Medida *
                  </label>
                  <select
                    id="select-material-unidade"
                    value={unidadeMedida}
                    onChange={(e) => setUnidadeMedida(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  >
                    {UNIDADES_MEDIDA_ESTOQUE.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Seção 2: Níveis de Estoque, Localização e Valores */}
            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#E05328]" />
                Estoque, Posição & Valores
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {!materialParaEditar && (
                  <div className="bg-orange-50/70 p-2.5 rounded-xl border border-orange-200">
                    <label className="block text-[11px] font-bold text-orange-950 mb-0.5">
                      Saldo Inicial (Entrada)
                    </label>
                    <input
                      id="input-material-qtd-inicial"
                      type="number"
                      min="0"
                      value={quantidadeInicial}
                      onChange={(e) => setQuantidadeInicial(Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-2.5 py-1 text-xs bg-white border border-orange-300 rounded-lg focus:ring-2 focus:ring-[#E05328] font-bold text-slate-900"
                    />
                    <span className="text-[9px] text-orange-800 mt-0.5 block">
                      Gera movimentação automática
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Estoque Mínimo *
                  </label>
                  <input
                    id="input-material-est-min"
                    type="number"
                    min="0"
                    required
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(Number(e.target.value))}
                    placeholder="50"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Estoque Máximo
                  </label>
                  <input
                    id="input-material-est-max"
                    type="number"
                    min="0"
                    value={estoqueMaximo}
                    onChange={(e) => setEstoqueMaximo(Number(e.target.value))}
                    placeholder="1000"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Custo Unitário Médio
                  </label>
                  <div className="relative">
                    <span className="text-[11px] font-bold text-slate-400 absolute left-2.5 top-2">R$</span>
                    <input
                      id="input-material-custo"
                      type="number"
                      step="0.01"
                      min="0"
                      value={custoUnitario}
                      onChange={(e) => setCustoUnitario(Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328] font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Posição no Armazém
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      id="input-material-localizacao"
                      type="text"
                      value={localizacao}
                      onChange={(e) => setLocalizacao(e.target.value)}
                      placeholder="Setor A — Prat. 02"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Dimensões / Formato
                  </label>
                  <input
                    id="input-material-formato"
                    type="text"
                    value={tamanhoFormato}
                    onChange={(e) => setTamanhoFormato(e.target.value)}
                    placeholder="Ex: 110 x 45 cm"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Lote Padrão
                  </label>
                  <input
                    id="input-material-lote"
                    type="text"
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    placeholder="LOT-2026-01"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Data de Validade
                  </label>
                  <input
                    id="input-material-validade"
                    type="date"
                    value={dataValidade}
                    onChange={(e) => setDataValidade(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  />
                </div>
              </div>
            </div>

            {/* Seção 3: Vínculo Eleitoral & Fornecedor */}
            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#E05328]" />
                Vínculo Eleitoral & Fornecedor
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Fornecedor / Gráfica
                  </label>
                  <input
                    id="input-material-fornecedor"
                    type="text"
                    value={fornecedor}
                    onChange={(e) => setFornecedor(e.target.value)}
                    placeholder="Gráfica Alpha Eleitoral"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Candidato Vinculado
                  </label>
                  <input
                    id="input-material-candidato"
                    type="text"
                    value={candidato}
                    onChange={(e) => setCandidato(e.target.value)}
                    placeholder="Ex: Dra. Helena Martins"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Partido
                    </label>
                    <input
                      id="input-material-partido"
                      type="text"
                      value={partido}
                      onChange={(e) => setPartido(e.target.value.toUpperCase())}
                      placeholder="PL / PT"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nº Urna
                    </label>
                    <input
                      id="input-material-num-cand"
                      type="text"
                      value={numeroCandidato}
                      onChange={(e) => setNumeroCandidato(e.target.value)}
                      placeholder="22022"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="pt-3 border-t border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Observações Técnicas / Armazenamento
              </label>
              <textarea
                id="textarea-material-obs"
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Instruções de manuseio, umidade, empilhamento máximo, etc."
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#E05328]"
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
            <button
              id="btn-cancelar-material"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-salvar-material"
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-[#E05328] hover:bg-orange-700 rounded-xl shadow-sm disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{materialParaEditar ? 'Atualizar Material' : 'Cadastrar Material'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
