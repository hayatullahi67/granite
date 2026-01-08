
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
        <div className="max-w-4xl mx-auto py-4 sm:py-8 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between mb-6 gap-3 print:hidden">
                <Button variant="secondary" onClick={() => navigate('/transactions')}>
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="secondary" onClick={handleDownload} disabled={downloading}>
                        <Download className="h-4 w-4 mr-2" /> {downloading ? 'Generating PDF...' : 'Download PDF'}
                    </Button>
                    <Button onClick={handlePrint} className="bg-primary-600 hover:bg-primary-700 shadow-glow">
                        <Printer className="h-4 w-4 mr-2" /> Print Invoice
                    </Button>
                </div>
            </div>

            <div className="bg-white p-6 sm:p-10 shadow-xl border border-stone-200 print:shadow-none print:border-0 rounded-none sm:rounded-xl relative overflow-hidden" id="receipt-area">

                {/* Cleared Stamp */}
                {(transaction.balance || 0) >= 0 && (
                    <div className="absolute top-10 right-10 opacity-20 transform rotate-12 pointer-events-none border-4 border-emerald-600 text-emerald-600 font-black text-6xl px-4 py-2 rounded-xl uppercase tracking-widest hidden sm:block">
                        PAID
                    </div>
                )}

                {/* Company Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-stone-800 pb-8 mb-8 gap-6 sm:gap-0">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-lg bg-stone-900 flex items-center justify-center text-white font-bold text-3xl shadow-lg print:shadow-none">G</div>
                        <div>
                            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">GraniteFlow</h1>
                            <p className="text-stone-500 text-sm uppercase tracking-wider font-semibold">Reliable Supply & Logistics</p>
                        </div>
                    </div>
                    <div className="text-left sm:text-right space-y-1">
                        <h2 className="text-3xl font-light text-stone-300 print:text-stone-400">INVOICE</h2>
                        <div className="text-sm font-bold text-stone-800 tracking-widest uppercase">#{transaction.refNo}</div>
                        <div className="text-xs text-stone-500">Date: {new Date(transaction.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</div>
                    </div>
                </div>

                {/* Client & Delivery Info */}
                <div className="flex flex-col sm:flex-row justify-between gap-8 mb-10 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                    <div className="flex-1">
                        <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest mb-2">Billed To</p>
                        <h3 className="font-bold text-stone-900 text-xl">{transaction.customerName}</h3>
                        <div className="text-sm text-stone-600 mt-2 space-y-1">
                            <p className="flex items-center">
                                <Phone className="h-3.5 w-3.5 mr-2 text-stone-400" />
                                {transaction.customerPhone}
                            </p>
                            {transaction.customerEmail && (
                                <p className="flex items-center">
                                    <Mail className="h-3.5 w-3.5 mr-2 text-stone-400" />
                                    {transaction.customerEmail}
                                </p>
                            )}
                            <p className="flex items-center text-primary-700 font-bold">
                                <MapPin className="h-3.5 w-3.5 mr-2 text-primary-400" />
                                {transaction.destinationAddress}
                            </p>
                        </div>
                    </div>
                    <div className="w-px bg-stone-200 hidden sm:block"></div>
                    <div className="flex-1 sm:text-right flex flex-col sm:items-end">
                        <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest mb-2">Invoice Summary</p>
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-stone-800">Supply Duration: Immediate</p>
                            {/* <p className="text-sm text-stone-500">Clerk Ref: {transaction.createdByName}</p> */}
                            <div className="mt-3">
                                <Badge color={transaction.balance < 0 ? 'red' : 'green'}>
                                    {transaction.balance < 0 ? 'OUTSTANDING DEBT' : 'PAYMENT CLEARED'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Multi-Product Items Table */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-stone-200">
                    <table className="w-full">
                        <thead className="bg-stone-50 border-b border-stone-200">
                            <tr>
                                <th className="text-left py-4 px-6 font-black text-stone-600 uppercase text-[10px] tracking-widest">Product / Logistics</th>
                                <th className="text-right py-4 px-2 font-black text-stone-600 uppercase text-[10px] tracking-widest">Qty</th>
                                <th className="text-right py-4 px-2 font-black text-stone-600 uppercase text-[10px] tracking-widest">Rate</th>
                                <th className="text-right py-4 px-2 font-black text-stone-600 uppercase text-[10px] tracking-widest">Transport</th>
                                <th className="text-right py-4 px-2 font-black text-stone-600 uppercase text-[10px] tracking-widest">Other</th>
                                <th className="text-right py-4 px-6 font-black text-stone-600 uppercase text-[10px] tracking-widest">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white">
                            {transaction.items?.map((item, index) => (
                                <tr key={index} className="hover:bg-stone-50/50 transition-colors">
                                    <td className="py-5 px-6">
                                        <p className="text-stone-900 font-black text-base leading-none mb-1">{item.productName}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            <span className="text-[10px] text-stone-400 font-bold uppercase flex items-center">
                                                <Truck className="h-2.5 w-2.5 mr-1" /> {item.quarryName}
                                            </span>
                                            {item.quarryLocation && (
                                                <span className="text-[10px] text-stone-400 font-bold uppercase flex items-center">
                                                    <MapPin className="h-2.5 w-2.5 mr-1" /> {item.quarryLocation}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-stone-400 font-bold uppercase flex items-center">
                                                <CreditCard className="h-2.5 w-2.5 mr-1" /> {item.truckPlateNumber} / {item.driverName}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-2 text-right text-stone-700 font-mono text-xs font-bold">{(item.quantity || 0).toLocaleString()}</td>
                                    <td className="py-5 px-2 text-right text-stone-700 font-mono text-xs">₦{(item.salesPrice || 0).toLocaleString()}</td>
                                    <td className="py-5 px-2 text-right text-stone-700 font-mono text-xs">₦{(item.transportCost || 0).toLocaleString()}</td>
                                    <td className="py-5 px-2 text-right text-stone-700 font-mono text-xs">₦{(item.otherExpenses || 0).toLocaleString()}</td>
                                    <td className="py-5 px-6 text-right font-black text-stone-900 font-mono text-base">₦{(item.subtotal || item.totalInvoice || 0).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Section */}
                <div className="flex flex-col sm:flex-row justify-end mt-10">
                    <div className="w-full sm:w-1/2 lg:w-2/5 bg-stone-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <DollarSign className="h-24 w-24" />
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center opacity-70">
                                <span className="text-[10px] font-black uppercase tracking-widest">New Order Total</span>
                                <span className="font-mono text-sm font-bold">₦{(transaction.totalInvoice || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Total Paid In</span>
                                <span className="font-mono text-base font-black text-emerald-400">+ ₦{(transaction.deposit || 0).toLocaleString()}</span>
                            </div>
                            <div className="h-px bg-white/10 my-4"></div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-2">Final Ledger Balance</span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-3xl font-black font-mono ${transaction.balance < 0 ? "text-red-400" : "text-emerald-400"}`}>
                                        {transaction.balance > 0 ? '+' : transaction.balance < 0 ? '-' : ''}₦{Math.abs(transaction.balance || 0).toLocaleString()}
                                    </span>
                                </div>
                                <span className="text-[9px] mt-2 font-bold uppercase opacity-50 tracking-widest">
                                    {transaction.balance < 0 ? 'Debt Remaining in Ledger' : 'No Outstanding / Account Clear'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="mt-20 pt-10 border-t border-stone-100">
                    <div className="grid grid-cols-2 gap-12 sm:gap-20">
                        <div className="text-center">
                            <div className="border-b-2 border-stone-200 w-full mb-4 h-12"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Officer's Approval</span>
                        </div>
                        <div className="text-center">
                            <div className="border-b-2 border-stone-200 w-full mb-4 h-12"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">Customer Reception</span>
                        </div>
                    </div>
                    <div className="mt-12 text-center">
                        <p className="text-[10px] text-stone-300 font-bold uppercase tracking-widest">
                            GraniteFlow Intelligent ERP System • Internal Ref: {transaction.refNo}
                        </p>
                        <p className="text-[9px] text-stone-300 mt-2 font-medium">Thank you for your business. Quality granite supplies delivered with integrity.</p>
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
