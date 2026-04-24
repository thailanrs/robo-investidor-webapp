import { TrendingUp } from "lucide-react";

interface TabelaAtivosProps {
  resultados: any[];
}

export function TabelaAtivos({ resultados }: TabelaAtivosProps) {
  if (!resultados || resultados.length === 0) return null;

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
            <tr>
              <th className="px-6 py-4 font-semibold">Rank</th>
              <th className="px-6 py-4 font-semibold">Ticker</th>
              <th className="px-6 py-4 font-semibold">Setor</th>
              <th className="px-6 py-4 font-semibold text-right">Cotação</th>
              <th className="px-6 py-4 font-semibold text-right">P/L</th>
              <th className="px-6 py-4 font-semibold text-right">EV/EBIT</th>
              <th className="px-6 py-4 font-semibold text-right">ROE (%)</th>
              <th className="px-6 py-4 font-semibold text-right">Rent. 5A (%)</th>
              <th className="px-6 py-4 font-semibold text-right">DY Médio 5A</th>
              <th className="px-6 py-4 font-semibold text-right">Nota Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {resultados.map((ativo, index) => {
              const rentabilidadeAlta = ativo["Rentabilidade 5A (%)"] > 50;
              
              return (
                <tr 
                  key={ativo.Ticker} 
                  className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                >
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {ativo.Ticker}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 truncate max-w-[150px]" title={ativo.Industria}>
                    {ativo.Setor}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    R$ {ativo["Cotação Atual"]?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-400">
                    {ativo["P/L"]?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-zinc-600 dark:text-zinc-400">
                    {ativo["EV/EBIT"] > 0 ? ativo["EV/EBIT"].toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {ativo["ROE"]?.toFixed(2)}%
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${rentabilidadeAlta ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {rentabilidadeAlta && <TrendingUp className="w-4 h-4" />}
                      {ativo["Rentabilidade 5A (%)"]?.toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-indigo-600 dark:text-indigo-400">
                    {ativo["DY 5A Médio (%)"]?.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                    {ativo.notaTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
