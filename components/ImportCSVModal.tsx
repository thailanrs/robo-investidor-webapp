"use client";

import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { X, Upload, Loader2, AlertCircle } from "lucide-react";
import { TransactionType } from "@/lib/transactions";

interface ImportCSVModalProps {
  onClose: () => void;
  onImport: (transactions: any[]) => Promise<void>;
}

const DB_COLUMNS = [
  { key: "date", label: "Data do Negócio", keywords: ["data", "data do negócio", "date", "data operacao"] },
  { key: "type", label: "Tipo de Movimentação", keywords: ["tipo", "movimentação", "compra/venda", "c/v", "tipo operacao"] },
  { key: "ticker", label: "Código de Negociação", keywords: ["ativo", "código", "ticker", "produto", "codigo negociacao"] },
  { key: "quantity", label: "Quantidade", keywords: ["quantidade", "qtd"] },
  { key: "unit_price", label: "Preço Unitário", keywords: ["preço", "valor", "valor unitário", "preco", "valor operacao"] },
];

export function ImportCSVModal({ onClose, onImport }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  
  // mapping[dbColumnKey] = csvHeaderName
  const [mapping, setMapping] = useState<Record<string, string>>({});
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    setError(null);
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsProcessing(false);
        if (results.errors.length > 0) {
          setError("Erro ao ler o arquivo CSV. Verifique a formatação.");
          return;
        }

        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        setCsvData(results.data);

        // Auto-mapping
        const initialMapping: Record<string, string> = {};
        DB_COLUMNS.forEach((dbCol) => {
          const matchedHeader = headers.find((h) => 
            dbCol.keywords.some(kw => h.toLowerCase().includes(kw))
          );
          if (matchedHeader) {
            initialMapping[dbCol.key] = matchedHeader;
          }
        });
        
        setMapping(initialMapping);
        setStep(2);
      },
      error: (err) => {
        setIsProcessing(false);
        setError("Erro fatal ao analisar CSV: " + err.message);
      }
    });
  };

  const handleMappingChange = (dbKey: string, csvHeader: string) => {
    setMapping(prev => ({
      ...prev,
      [dbKey]: csvHeader
    }));
  };

  const parseDate = (dateStr: string): string => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    
    // Check if DD/MM/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        // Assume DD/MM/YYYY
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
    // Assume it might already be YYYY-MM-DD or parseable by Date
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch(e) {}
    
    return new Date().toISOString().split('T')[0];
  };

  const parseNumber = (numStr: string): number => {
    if (!numStr) return 0;
    if (typeof numStr === 'number') return numStr;
    // Remove R$ or other currency symbols and spaces
    let cleanStr = numStr.replace(/[^\d.,-]/g, '');
    // If we have format like 1.234,56
    if (cleanStr.includes(',') && cleanStr.includes('.')) {
      cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
    } else if (cleanStr.includes(',')) {
      // Format like 1234,56
      cleanStr = cleanStr.replace(',', '.');
    }
    const val = parseFloat(cleanStr);
    return isNaN(val) ? 0 : val;
  };

  const parseType = (typeStr: string): TransactionType => {
    if (!typeStr) return 'COMPRA';
    const lower = typeStr.toLowerCase();
    if (lower.includes('compra') || lower === 'c') return 'COMPRA';
    if (lower.includes('venda') || lower === 'v') return 'VENDA';
    return 'COMPRA';
  };

  const handleConfirmImport = async () => {
    // Validate mapping
    const missingKeys = DB_COLUMNS.filter(col => !mapping[col.key]);
    if (missingKeys.length > 0) {
      setError(`Mapeie todas as colunas antes de importar. Faltam: ${missingKeys.map(k => k.label).join(', ')}`);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const transactionsToInsert = csvData.map(row => {
        return {
          ticker: row[mapping["ticker"]]?.trim()?.toUpperCase() || "",
          type: parseType(row[mapping["type"]]),
          quantity: parseNumber(row[mapping["quantity"]]),
          unit_price: parseNumber(row[mapping["unit_price"]]),
          other_costs: 0,
          date: parseDate(row[mapping["date"]]),
        };
      }).filter(tx => tx.ticker && tx.quantity > 0); // basic validation to ignore empty rows

      if (transactionsToInsert.length === 0) {
        throw new Error("Nenhum dado válido encontrado após mapeamento.");
      }

      await onImport(transactionsToInsert);
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao importar dados.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Importar Lançamentos (CSV)
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Adicione múltiplas transações de uma só vez mapeando as colunas.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 bg-red-100/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {step === 1 && (
            <div 
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-10 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950/50 hover:bg-zinc-100 dark:hover:bg-zinc-900/80 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-1">
                Clique para selecionar o arquivo CSV
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-sm">
                O arquivo deve conter uma linha de cabeçalho. As colunas serão mapeadas no próximo passo.
              </p>
              
              {isProcessing && (
                <div className="mt-6 flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Lendo arquivo...
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-lg p-4 mb-2">
                <p className="text-sm text-emerald-800 dark:text-emerald-300">
                  Arquivo <strong>{file?.name}</strong> carregado com sucesso ({csvData.length} linhas encontradas). Confirme ou altere o mapeamento das colunas abaixo.
                </p>
              </div>

              <div className="space-y-4">
                {DB_COLUMNS.map((dbCol) => (
                  <div key={dbCol.key} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {dbCol.label}
                      </span>
                      <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Coluna requerida pelo sistema
                      </span>
                    </div>
                    
                    <div>
                      <select
                        value={mapping[dbCol.key] || ""}
                        onChange={(e) => handleMappingChange(dbCol.key, e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                      >
                        <option value="" disabled>-- Selecione uma coluna --</option>
                        {csvHeaders.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 2 && (
          <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/30 flex justify-end gap-3">
            <button
              onClick={() => setStep(1)}
              disabled={isProcessing}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={isProcessing}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Importando...
                </>
              ) : (
                "Finalizar Importação"
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
