import { Upload, FileText, Database, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataSummary } from '@/types/inventory';

interface DataUploadProps {
  onUpload: (file: File) => void;
  dataSummary: DataSummary | null;
}

export const DataUpload = ({ onUpload, dataSummary }: DataUploadProps) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex-1 min-w-0 space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">Data Source</h2>
        <p className="text-sm text-slate-500">
          Upload your historical sales data (CSV) to train the forecast model.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
        {dataSummary && (
          <div className="grid grid-cols-3 gap-4 w-full sm:w-auto">
            <div className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100 min-w-[100px]">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                <Database className="h-3.5 w-3.5" /> Records
              </span>
              <span className="text-lg font-bold text-slate-900 truncate" title={dataSummary.totalRecords.toLocaleString()}>
                {dataSummary.totalRecords.toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100 min-w-[100px]">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                <FileText className="h-3.5 w-3.5" /> Products
              </span>
              <span className="text-lg font-bold text-slate-900 truncate" title={dataSummary.uniqueProducts.toString()}>
                {dataSummary.uniqueProducts}
              </span>
            </div>
            <div className="flex flex-col p-3 bg-slate-50 rounded-lg border border-slate-100 min-w-[140px]">
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mb-1">
                <Calendar className="h-3.5 w-3.5" /> Range
              </span>
              <span className="text-sm font-semibold text-slate-900 truncate" title={`${dataSummary.dateRange.min} - ${dataSummary.dateRange.max}`}>
                {dataSummary.dateRange.min}
                <span className="mx-1 text-slate-400">/</span>
                {dataSummary.dateRange.max}
              </span>
            </div>
          </div>
        )}

        <label htmlFor="csv-upload">
          <Button variant="outline" className="cursor-pointer shadow-sm bg-white hover:bg-slate-50" asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              {dataSummary ? 'Replace CSV' : 'Upload CSV'}
            </span>
          </Button>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
};