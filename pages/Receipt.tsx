
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/UI';
import { ArrowLeft, Printer, Download, Phone, Mail, CheckCircle, MapPin, Truck } from 'lucide-react';

// Declare html2pdf as a global variable since it's loaded via CDN
declare var html2pdf: any;

export const Receipt: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { transactions } = useData();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);

  const transaction = transactions.find(t => t.id === id);

  if (!transaction) {
    return <div className="min-h-screen flex items-center justify-center text-stone-500 font-medium">Loading transaction details...</div>;
  }

  // Derive the unit rate since we now save the total salesPrice
  const unitSalesRate = (transaction.totalInvoice || transaction.salesPrice || 0) / (transaction.quantity || 1);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const element = document.getElementById('receipt-area');
    if (!element) return;
    
    setDownloading(true);
    
    const opt = {
      margin:       0,
      filename:     `Receipt-${transaction.refNo}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        setDownloading(false);
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between mb-6 gap-3 print:hidden">
        <Button variant="secondary" onClick={() => navigate('/transactions')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
                <Download className="h-4 w-4 mr-2" /> {downloading ? 'Generating PDF...' : 'Download PDF'}
            </Button>
            <Button onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" /> Print Receipt
            </Button>
        </div>
      </div>

      <div className="bg-white p-6 sm:p-10 shadow-xl border border-stone-200 print:shadow-none print:border-0 rounded-none sm:rounded-xl relative overflow-hidden" id="receipt-area">
        
        {(transaction.balance || 0) <= 0 && (
          <div className="absolute top-10 right-10 opacity-20 transform rotate-12 pointer-events-none border-4 border-emerald-600 text-emerald-600 font-black text-6xl px-4 py-2 rounded-xl uppercase tracking-widest hidden sm:block">
            PAID
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-stone-800 pb-8 mb-8 gap-6 sm:gap-0">
          <div className="flex items-center gap-4">
             <div className="h-16 w-16 rounded-lg bg-stone-900 flex items-center justify-center text-white font-bold text-3xl shadow-lg print:shadow-none">G</div>
             <div>
                <h1 className="text-2xl font-bold text-stone-900 tracking-tight">GraniteFlow</h1>
                <p className="text-stone-500 text-sm uppercase tracking-wider font-semibold">Supply & Logistics</p>
             </div>
          </div>
          <div className="text-left sm:text-right space-y-1">
             <h2 className="text-3xl font-light text-stone-300 print:text-stone-400">INVOICE</h2>
             <div className="text-sm font-medium text-stone-800">#{transaction.refNo}</div>
             <div className="text-xs text-stone-500">Issued: {new Date(transaction.date).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10">
            <div className="flex-1">
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-2">From (Source)</p>
                <h3 className="font-bold text-stone-900 text-lg">{transaction.quarryName}</h3>
                <div className="text-sm text-stone-600 mt-1 space-y-1">
                     <p className="flex items-start">
                         <Truck className="h-4 w-4 mr-2 text-stone-400 shrink-0 mt-0.5" />
                         {transaction.quarryLocation || "No location specified"}
                     </p>
                </div>
            </div>

            <div className="flex-1 sm:text-right">
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider mb-2">To (Customer Delivery)</p>
                <h3 className="font-bold text-stone-900 text-lg">{transaction.customerName}</h3>
                <div className="text-sm text-stone-600 mt-1 space-y-1 flex flex-col sm:items-end">
                     {transaction.destinationAddress && (
                        <p className="flex items-start text-indigo-600 font-medium">
                            <span className="mr-2 sm:order-2">{transaction.destinationAddress}</span>
                            <MapPin className="h-4 w-4 text-indigo-400 sm:order-1 sm:mr-0 sm:ml-2" />
                        </p>
                     )}
                     <p className="flex items-center opacity-70">
                         <span className="mr-2 sm:order-2">{transaction.customerPhone}</span>
                         <Phone className="h-4 w-4 text-stone-400 sm:order-1 sm:mr-0 sm:ml-2" />
                     </p>
                </div>
            </div>
        </div>

        <div className="mb-8 overflow-hidden rounded-lg border border-stone-200">
            <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                    <th className="text-left py-3 px-4 font-bold text-stone-600 uppercase text-xs tracking-wider">Description</th>
                    <th className="text-right py-3 px-4 font-bold text-stone-600 uppercase text-xs tracking-wider">Unit Rate</th>
                    <th className="text-right py-3 px-4 font-bold text-stone-600 uppercase text-xs tracking-wider">Qty (Tons)</th>
                    <th className="text-right py-3 px-4 font-bold text-stone-600 uppercase text-xs tracking-wider">Total</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
                <tr>
                    <td className="py-4 px-4">
                        <p className="text-stone-900 font-bold">{transaction.productName}</p>
                        <p className="text-stone-500 text-xs mt-0.5">Origin: {transaction.quarryName}</p>
                    </td>
                    <td className="py-4 px-4 text-right text-stone-600 font-mono text-sm">₦{(unitSalesRate || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="py-4 px-4 text-right text-stone-600 font-mono text-sm">{(transaction.quantity || 0).toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-bold text-stone-900 font-mono">₦{(transaction.totalInvoice || 0).toLocaleString()}</td>
                </tr>
            </tbody>
            </table>
        </div>

        <div className="flex flex-col sm:flex-row justify-end">
          <div className="w-full sm:w-1/2 lg:w-1/3 bg-stone-50/50 p-6 rounded-xl border border-stone-100">
            <div className="space-y-3">
                <div className="flex justify-between text-sm text-stone-600">
                    <span className="font-medium">Invoice Value</span>
                    <span className="font-mono">₦{(transaction.totalInvoice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                    <span className="font-medium">Amount Paid</span>
                    <span className="font-mono text-emerald-600 font-medium">- ₦{(transaction.deposit || 0).toLocaleString()}</span>
                </div>
                <div className="h-px bg-stone-200 my-2"></div>
                <div className="flex justify-between items-center">
                    <span className="font-bold text-stone-900 uppercase text-xs tracking-wider">Balance Due</span>
                    <span className={`text-xl font-black font-mono ${(transaction.balance || 0) > 0 ? "text-red-600" : "text-stone-900"}`}>
                        ₦{(transaction.balance || 0).toLocaleString()}
                    </span>
                </div>
            </div>
            {(transaction.balance || 0) <= 0 && (
                <div className="mt-4 flex items-center justify-center text-emerald-600 text-xs font-bold uppercase tracking-widest bg-emerald-50 py-2 rounded border border-emerald-100">
                    <CheckCircle className="h-3 w-3 mr-2" /> Fully Settled
                </div>
            )}
          </div>
        </div>

        <div className="mt-12 sm:mt-20 pt-8 border-t border-stone-200">
          <div className="grid grid-cols-2 gap-8 sm:gap-12">
              <div className="text-center">
                  <div className="border-b border-stone-300 w-full mb-3 h-8"></div>
                  <span className="text-xs uppercase tracking-wider text-stone-400 font-medium">Authorized Officer</span>
              </div>
              <div className="text-center">
                   <div className="border-b border-stone-300 w-full mb-3 h-8"></div>
                  <span className="text-xs uppercase tracking-wider text-stone-400 font-medium">Customer Acknowledgment</span>
              </div>
          </div>
          <div className="mt-8 text-center">
              <p className="text-[10px] text-stone-400">
                Generated by {transaction.createdByName} | Ref: {transaction.refNo} | {new Date().toLocaleTimeString()}
              </p>
              <p className="text-[10px] text-stone-400 mt-1 italic tracking-tight">GraniteFlow ERP - Reliable Supply Chain Solutions.</p>
          </div>
        </div>
      </div>
      
      <style>{`
        @media print {
            body { background: white; margin: 0; padding: 0; }
            .print\\:hidden { display: none !important; }
            #receipt-area {
                box-shadow: none;
                border: none;
                padding: 0;
                margin: 0;
                width: 100%;
                border-radius: 0;
            }
        }
      `}</style>
    </div>
  );
};
