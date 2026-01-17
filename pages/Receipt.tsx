
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button, Badge } from '../components/UI';
import { ArrowLeft, Printer, Download, Phone, Mail, CheckCircle, MapPin, Truck, CreditCard, User, DollarSign } from 'lucide-react';

// Declare html2pdf as a global variable since it's loaded via CDN
declare var html2pdf: any;

export const Receipt: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { transactions } = useData();
    const navigate = useNavigate();
    const [downloading, setDownloading] = useState(false);

    const transaction = transactions.find(t => t.id === id);

    if (!transaction) {
        return <div className="min-h-screen flex items-center justify-center text-stone-500 font-medium">Loading invoice details...</div>;
    }

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const element = document.getElementById('receipt-area');
        if (!element) return;

        setDownloading(true);

        const opt = {
            margin: 0,
            filename: `Invoice-${transaction.refNo}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            setDownloading(false);
        });
    };

    return (
        <div className="min-h-screen bg-stone-100/50 py-8 px-4">
            <div className="max-w-[850px] mx-auto">
                <div className="flex justify-between mb-6 gap-3 print:hidden">
                    <Button variant="secondary" onClick={() => navigate('/transactions')}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
                            <Download className="h-4 w-4 mr-2" /> {downloading ? 'Generating PDF...' : 'Download PDF'}
                        </Button>
                        <Button onClick={handlePrint} className="bg-primary-600 hover:bg-primary-700 shadow-glow">
                            <Printer className="h-4 w-4 mr-2" /> Print Invoice
                        </Button>
                    </div>
                </div>

                {/* Fixed Width Paper Container */}
                <div className="overflow-x-auto pb-8 rounded-xl">
                    <div className="bg-white p-12 shadow-2xl border border-stone-200 print:shadow-none print:border-0 w-[850px] mx-auto relative overflow-hidden shrink-0" id="receipt-area">

                        {/* Cleared Stamp */}
                        {(transaction.balance || 0) >= 0 && (
                            <div className="absolute top-12 right-12 opacity-20 transform rotate-12 pointer-events-none border-4 border-emerald-600 text-emerald-600 font-black text-6xl px-4 py-2 rounded-xl uppercase tracking-widest">
                                PAID
                            </div>
                        )}

                        {/* Company Header */}
                        <div className="flex justify-between items-start border-b-2 border-stone-800 pb-10 mb-10">
                            <div className="flex items-center gap-5">
                                <div className="h-20 w-20 rounded-2xl bg-stone-900 flex items-center justify-center text-white font-bold text-4xl shadow-xl print:shadow-none">G</div>
                                <div>
                                    <h1 className="text-3xl font-black text-stone-900 tracking-tight leading-none">GraniteFlow</h1>
                                    <p className="text-stone-500 text-sm mt-1 uppercase tracking-[0.2em] font-black opacity-60">Reliable Supply & Logistics</p>
                                </div>
                            </div>
                            <div className="text-right space-y-1">
                                <h2 className="text-4xl font-light text-stone-300 print:text-stone-400 tracking-[0.1em]">INVOICE</h2>
                                <div className="text-base font-black text-stone-800 tracking-widest uppercase">#{transaction.refNo}</div>
                                <div className="text-xs text-stone-400 font-bold">Date: {new Date(transaction.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                            </div>
                        </div>

                        {/* Client & Delivery Info */}
                        <div className="flex justify-between gap-12 mb-12 bg-stone-50 p-8 rounded-[2rem] border border-stone-100">
                            <div className="flex-1">
                                <p className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em] mb-3">Billed To</p>
                                <h3 className="font-black text-stone-900 text-2xl tracking-tight">{transaction.customerName}</h3>
                                <div className="text-sm text-stone-600 mt-4 space-y-1.5 font-medium">
                                    <p className="flex items-center">
                                        <Phone className="h-3.5 w-3.5 mr-3 text-stone-400" />
                                        {transaction.customerPhone}
                                    </p>
                                    {transaction.customerEmail && (
                                        <p className="flex items-center">
                                            <Mail className="h-3.5 w-3.5 mr-3 text-stone-400" />
                                            {transaction.customerEmail}
                                        </p>
                                    )}
                                    <p className="flex items-center text-primary-700 font-bold">
                                        <MapPin className="h-3.5 w-3.5 mr-3 text-primary-400" />
                                        {transaction.destinationAddress}
                                    </p>
                                </div>
                            </div>
                            <div className="w-px bg-stone-200"></div>
                            <div className="flex-1 text-right flex flex-col items-end">
                                <p className="text-[10px] uppercase font-black text-stone-400 tracking-[0.2em] mb-3">Invoice Summary</p>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-stone-800">Supply Duration: Immediate</p>
                                    <div className="mt-4">
                                        <Badge color={transaction.balance < 0 ? 'red' : 'green'}>
                                            {transaction.balance < 0 ? 'OUTSTANDING DEBT' : 'PAYMENT CLEARED'}
                                        </Badge>
                                    </div>
                                    <p className="text-[10px] text-stone-400 font-bold uppercase mt-4">Invoice Type: Service Rendered</p>
                                </div>
                            </div>
                        </div>

                        {/* Multi-Product Items Table */}
                        <div className="mb-10 overflow-hidden rounded-[1.5rem] border border-stone-200 shadow-sm">
                            <table className="w-full">
                                <thead className="bg-stone-50 border-b border-stone-200 text-white">
                                    <tr>
                                        <th className="text-left py-5 px-8 font-black bg-stone-800 text-white/90 uppercase text-[10px] tracking-widest">Product / Logistics</th>
                                        <th className="text-right py-5 px-3 font-black bg-stone-800 text-white/90 uppercase text-[10px] tracking-widest">Tons</th>
                                        <th className="text-right py-5 px-3 font-black bg-stone-800 text-white/90 uppercase text-[10px] tracking-widest">Rate</th>
                                        <th className="text-right py-5 px-3 font-black bg-stone-800 text-white/90 uppercase text-[10px] tracking-widest">Transport</th>
                                        <th className="text-right py-5 px-3 font-black bg-stone-800 text-white/90 uppercase text-[10px] tracking-widest">Other</th>
                                        <th className="text-right py-5 px-8 font-black bg-stone-800 text-white/90 uppercase text-[10px] tracking-widest">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 bg-white">
                                    {transaction.items?.map((item, index) => (
                                        <tr key={index} className="hover:bg-stone-50/50 transition-colors">
                                            <td className="py-6 px-8">
                                                <p className="text-stone-900 font-black text-lg mb-1">{item.productName}</p>
                                                <div className="flex flex-wrap gap-x-6 gap-y-1 opacity-70">
                                                    <span className="text-[10px] text-stone-500 font-black uppercase flex items-center">
                                                        <Truck className="h-3 w-3 mr-1.5 text-primary-500" /> {item.quarryName}
                                                    </span>
                                                    {item.quarryLocation && (
                                                        <span className="text-[10px] text-stone-500 font-black uppercase flex items-center">
                                                            <MapPin className="h-3 w-3 mr-1.5 text-primary-500" /> {item.quarryLocation}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-stone-500 font-black uppercase flex items-center">
                                                        <CreditCard className="h-3 w-3 mr-1.5 text-primary-500" /> {item.truckPlateNumber} / {item.driverName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-3 text-right text-stone-800 font-mono text-xs font-black">{(item.quantity || 0).toLocaleString()}</td>
                                            <td className="py-6 px-3 text-right text-stone-700 font-mono text-xs font-bold">₦{(item.salesPrice || 0).toLocaleString()}</td>
                                            <td className="py-6 px-3 text-right text-stone-700 font-mono text-xs font-bold">₦{(item.transportCost || 0).toLocaleString()}</td>
                                            <td className="py-6 px-3 text-right text-stone-700 font-mono text-xs font-bold">₦{(item.otherExpenses || 0).toLocaleString()}</td>
                                            <td className="py-6 px-8 text-right font-black text-stone-900 font-mono text-base">₦{(item.subtotal || item.totalInvoice || 0).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="flex justify-end mt-12">
                            <div className="w-[400px] bg-stone-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                    <DollarSign className="h-32 w-32" />
                                </div>

                                <div className="space-y-5 relative z-10">
                                    <div className="flex justify-between items-center opacity-60">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Order Subtotal</span>
                                        <span className="font-mono text-sm font-bold">₦{(transaction.totalInvoice || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Deposit</span>
                                        <span className="font-mono text-lg font-black text-emerald-400">+ ₦{(transaction.deposit || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="h-px bg-white/10 my-6"></div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] mb-3">Ledger Balance</span>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-4xl font-black font-mono ${transaction.balance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                                                {transaction.balance > 0 ? '+' : transaction.balance < 0 ? '-' : ''}₦{Math.abs(transaction.balance || 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <span className="text-[9px] mt-3 font-black uppercase opacity-40 tracking-widest">
                                            {transaction.balance < 0 ? 'Account Debit Remaining' : 'Ledger Fully Settled'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Signatures */}
                        <div className="mt-24 pt-12 border-t border-stone-100">
                            <div className="flex justify-between gap-24">
                                <div className="flex-1 text-center">
                                    <div className="border-b-2 border-stone-800/10 w-full mb-5 h-16"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Approved Authority</span>
                                </div>
                                <div className="flex-1 text-center">
                                    <div className="border-b-2 border-stone-800/10 w-full mb-5 h-16"></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Customer Acceptance</span>
                                </div>
                            </div>
                            <div className="mt-16 text-center">
                                <p className="text-[10px] text-stone-300 font-black uppercase tracking-[0.2em]">
                                    GraniteFlow Enterprise System • Ref: {transaction.refNo}
                                </p>
                                <p className="text-[9px] text-stone-400 mt-3 font-bold uppercase tracking-widest opacity-40">Generated via Secure Ledger Node</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @media print {
            /* Reset Global Page Container Layouts for print */
            body, html, #root {
                height: auto !important;
                overflow: visible !important;
                background: white !important;
            }
            
            /* Hide the common ERP UI elements */
            aside, header, nav, footer, .print\\:hidden, button, .flex-col.sm\\:flex-row.justify-between.mb-6 { 
                display: none !important; 
            }

            /* Un-trap the main content area from h-screen and overflow-hidden wrappers */
            .flex.h-screen, .flex.flex-col, main, .flex.flex-1 {
                display: block !important;
                height: auto !important;
                overflow: visible !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
            }

            /* Isolate the receipt area */
            #receipt-area {
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                width: 100% !important;
                border-radius: 0 !important;
                position: static !important;
                overflow: visible !important;
                padding-bottom: 40px !important;
            }

            /* Ensure text is dark and legible */
            .text-stone-300 { color: #a8a29e !important; }
            .text-stone-500 { color: #78716c !important; }
            .bg-stone-900 { background-color: #1c1917 !important; -webkit-print-color-adjust: exact; }
            .bg-stone-50 { background-color: #fafaf9 !important; -webkit-print-color-adjust: exact; }
            
            @page {
                size: auto;
                margin: 10mm;
            }
        }
      `}</style>
        </div>
    );
};
