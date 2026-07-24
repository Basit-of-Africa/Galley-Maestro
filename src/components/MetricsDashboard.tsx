import React from 'react';
import { Activity, Clock, CheckCircle2, FileText, RotateCcw } from 'lucide-react';

export interface TypesettingMetrics {
  totalProcessed: number;
  successfulCount: number;
  failedCount: number;
  totalTimeMs: number;
}

interface MetricsDashboardProps {
  metrics: TypesettingMetrics;
  onResetMetrics?: () => void;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics, onResetMetrics }) => {
  const avgTimeSec =
    metrics.totalProcessed > 0
      ? (metrics.totalTimeMs / metrics.totalProcessed / 1000).toFixed(2)
      : '0.00';

  const successRate =
    metrics.totalProcessed > 0
      ? Math.round((metrics.successfulCount / metrics.totalProcessed) * 100)
      : 100;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Typesetting Metrics
            </h3>
            <p className="text-[10px] text-slate-400">
              Live processing performance & engine output statistics
            </p>
          </div>
        </div>

        {metrics.totalProcessed > 0 && onResetMetrics && (
          <button
            type="button"
            onClick={onResetMetrics}
            className="text-[10px] text-slate-400 hover:text-slate-600 font-medium flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-100 transition-colors"
            title="Reset metrics counters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Stats</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center sm:text-left">
        {/* Total Files Processed */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 flex items-center space-x-3">
          <div className="p-2 bg-white rounded-md border border-slate-200 text-indigo-600 shadow-2xs shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">
              Total Processed
            </span>
            <span className="text-base font-extrabold text-slate-800">
              {metrics.totalProcessed} <span className="text-xs font-normal text-slate-500">files</span>
            </span>
          </div>
        </div>

        {/* Avg Processing Time */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 flex items-center space-x-3">
          <div className="p-2 bg-white rounded-md border border-slate-200 text-amber-500 shadow-2xs shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">
              Avg Speed
            </span>
            <span className="text-base font-extrabold text-slate-800">
              {avgTimeSec}s <span className="text-xs font-normal text-slate-500">/ file</span>
            </span>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 flex items-center space-x-3">
          <div className={`p-2 bg-white rounded-md border border-slate-200 shadow-2xs shrink-0 ${
            successRate >= 90 ? 'text-emerald-600' : successRate >= 70 ? 'text-amber-500' : 'text-rose-500'
          }`}>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">
              Success Rate
            </span>
            <span className={`text-base font-extrabold ${
              successRate >= 90 ? 'text-emerald-600' : successRate >= 70 ? 'text-amber-600' : 'text-rose-600'
            }`}>
              {successRate}%
              <span className="text-[10px] font-normal text-slate-400 ml-1">
                ({metrics.successfulCount}/{metrics.totalProcessed})
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
