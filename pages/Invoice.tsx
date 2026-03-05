import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/UI';
import { ArrowLeft, Printer, Download, Mail, Phone, MapPin, Truck, CreditCard, Tag } from 'lucide-react';

// Declare html2pdf as a global variable since it's loaded via CDN
declare var html2pdf: any;

const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    const convertLessThanOneThousand = (n: number): string => {
        if (n === 0) return '';

        let res = '';
        if (n >= 100) {
            res += ones[Math.floor(n / 100)] + ' Hundred ';
            n %= 100;
        }

        if (n >= 10 && n <= 19) {
            res += teens[n - 10] + ' ';
        } else if (n >= 20 || n === 0) {
            res += tens[Math.floor(n / 10)] + ' ';
            res += ones[n % 10] + ' ';
        } else if (n > 0) {
            res += ones[n] + ' ';
        }

        return res.trim();
    };

    if (num === 0) return 'Zero';

    const billions = Math.floor(num / 1000000000);
    const millions = Math.floor((num % 1000000000) / 1000000);
    const thousands = Math.floor((num % 1000000) / 1000);
    const remainder = Math.floor(num % 1000);

    let result = '';
    if (billions > 0) result += convertLessThanOneThousand(billions) + ' Billion ';
    if (millions > 0) result += convertLessThanOneThousand(millions) + ' Million ';
    if (thousands > 0) result += convertLessThanOneThousand(thousands) + ' Thousand ';
    if (remainder > 0) result += convertLessThanOneThousand(remainder);

    return result.trim();
};

export const Invoice: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { transactions } = useData();
    const navigate = useNavigate();
    const [downloading, setDownloading] = useState(false);

    const transaction = transactions.find(t => t.id === id);

    const amountInWords = useMemo(() => {
        if (!transaction) return '';
        const total = transaction.totalInvoice || 0;
        return `${numberToWords(total)} Naira Only.`;
    }, [transaction]);

    if (!transaction) {
        return <div className="min-h-screen flex items-center justify-center text-stone-500 font-medium">Loading invoice details...</div>;
    }

    const handlePrint = () => {
        window.print();
    };

    const handleDownload = () => {
        const element = document.getElementById('invoice-area');
        if (!element) return;

        setDownloading(true);

        const opt = {
            margin: 0,
            filename: `Invoice-${transaction.refNo}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            setDownloading(false);
        });
    };

    return (
        <div className="min-h-screen bg-stone-100 py-12 px-4 selection:bg-primary-100 selection:text-primary-900">
            <div className="max-w-[850px] mx-auto">
                {/* Actions Toolbar */}
                <div className="flex flex-wrap justify-between mb-6 gap-3 print:hidden px-2">
                    <Button
                        variant="secondary"
                        onClick={() => navigate('/transactions')}
                        className="rounded-full shadow-sm text-[10px] md:text-xs h-9 px-4"
                    >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> <span className="hidden sm:inline">Back to Dashboard</span><span className="sm:hidden">Back</span>
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={handleDownload}
                            disabled={downloading}
                            className="rounded-full shadow-sm text-[10px] md:text-xs h-9 px-4"
                        >
                            <Download className="h-3.5 w-3.5 mr-1.5" /> {downloading ? '...' : 'PDF'}
                        </Button>
                        <Button
                            onClick={handlePrint}
                            className="bg-primary-900 hover:bg-primary-800 rounded-full shadow-md text-[10px] md:text-xs h-9 px-4"
                        >
                            <Printer className="h-3.5 w-3.5 mr-1.5" /> <span className="hidden sm:inline">Print Invoice</span><span className="sm:hidden">Print</span>
                        </Button>
                    </div>
                </div>

                <div className="w-full overflow-x-auto pb-8 print:overflow-visible print:pb-0">
                    {/* Main Invoice Content */}
                    <div
                        className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-100 w-[800px] mx-auto min-h-[1100px] relative overflow-hidden flex flex-col print:shadow-none print:border-0"
                        id="invoice-area"
                    >
                        {/* Status Stamp */}
                        <div className="absolute top-48 left-12 z-0 opacity-80 pointer-events-none">
                            <div className={`border-2 ${transaction.balance >= 0 ? 'border-emerald-700/50 text-emerald-700 bg-emerald-50/50' : 'border-primary-900/50 text-primary-900 bg-primary-50/50'} font-black text-2xl px-6 py-2.5 rounded-xl uppercase tracking-[0.15em] transform -rotate-12 shadow-sm`}>
                                {transaction.balance >= 0 ? 'FULFILLMENT PAID' : 'PART PAYMENT'}
                            </div>
                        </div>
                        <div className="p-12 pb-24 flex-1">
                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-12 border-b-4 border-primary-900 pb-8">
                                <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 bg-primary-900 flex items-center justify-center text-white font-bold text-4xl rounded-2xl shadow-lg ring-4 ring-primary-50">BM</div>
                                    <div>
                                        <h1 className="text-3xl font-black text-stone-900 tracking-tight leading-none uppercase text-primary-900">B.M. MARUPH</h1>
                                        <h2 className="text-xl font-black text-stone-700 tracking-tight leading-none uppercase mt-1">GLOBAL RESOURCES</h2>
                                        <p className="text-stone-500 text-[9px] mt-2 uppercase tracking-[0.1em] font-black">GRANITE, SHARP SAND, HAULAGE, FILLING SAND</p>
                                        <p className="text-stone-400 text-[8px] mt-1 font-bold uppercase">CAC: 3174302</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-4xl font-light text-stone-300 tracking-[0.1em] mb-2 uppercase">Payment Invoice</h2>
                                    <div className="space-y-1 text-sm font-bold text-stone-800">
                                        <p>Invoice No: <span className="font-black text-primary-900 underline decoration-primary-900/10">INV-{transaction.refNo}</span></p>
                                        <p>Date: {new Date(transaction.date).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                                        <p>Status: <span className="text-emerald-600 font-black">VALID DOCUMENT</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Info */}
                            <div className="grid grid-cols-2 gap-12 mb-12">
                                <div>
                                    <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest mb-3">Invoiced To:</p>
                                    <div className="space-y-1 p-3.5 bg-stone-50 border border-stone-100 rounded-xl">
                                        <h3 className="font-black text-lg text-stone-900 tracking-tight">{transaction.customerName}</h3>
                                        <div className="text-[11px] text-stone-600 font-bold space-y-1 pt-2">
                                            <p className="flex items-start text-stone-800"><MapPin className="h-3.5 w-3.5 mr-2.5 text-stone-400 shrink-0 mt-0.5" /> {transaction.destinationAddress}</p>
                                            <p className="flex items-center"><Phone className="h-3.5 w-3.5 mr-2.5 text-stone-400" /> {transaction.customerPhone}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-3.5 border-l-4 border-primary-900 bg-stone-50 rounded-r-xl">
                                        <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest mb-1">Our Address:</p>
                                        <p className="text-[10px] font-bold text-stone-800 leading-tight">55, Kugba Road, Beside Feelmore Filling Station, Abeokuta, Ogun State.</p>
                                        <p className="text-[10px] font-bold text-primary-900 mt-1">Tel: 08032618021, 08022575620</p>
                                    </div>
                                </div>
                                <div className="text-right space-y-4 pt-8">
                                    <div className="space-y-1.5 text-xs font-black text-stone-500 uppercase tracking-widest">
                                        <p className="flex items-center justify-end"><Tag className="h-3 w-3 mr-2" /> TIN NO.: <span className="text-stone-900 ml-2">12345678</span></p>
                                        <p className="flex items-center justify-end"><Tag className="h-3 w-3 mr-2" /> VAT No: <span className="text-stone-900 ml-2">20786211-001</span></p>
                                        <p>PH: +{transaction.customerPhone}</p>
                                    </div>
                                    <div className="pt-4">
                                        <p className="text-[10px] uppercase font-black text-stone-400 tracking-widest mb-2">Transport Ref:</p>
                                        <p className="text-sm font-black text-primary-900">REF-{transaction.id?.substring(0, 8).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Transaction Details (Quarry/Vehicle) */}
                            <div className="mb-8 grid grid-cols-3 gap-6 bg-primary-50/30 p-6 rounded-2xl border border-primary-50">
                                <div>
                                    <p className="text-[9px] uppercase font-black text-primary-900/40 tracking-widest mb-1.5">Quarry Source</p>
                                    <p className="text-sm font-black text-stone-800 truncate">{transaction.items?.[0]?.quarryName || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-black text-primary-900/40 tracking-widest mb-1.5">Vehicle Details</p>
                                    <p className="text-sm font-black text-stone-800 flex items-center">
                                        <Truck className="h-3.5 w-3.5 mr-2 text-primary-900" />
                                        {transaction.items?.[0]?.truckPlateNumber || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-black text-primary-900/40 tracking-widest mb-1.5">Assigned Driver</p>
                                    <p className="text-sm font-black text-stone-800 flex items-center">
                                        <CreditCard className="h-3.5 w-3.5 mr-2 text-primary-900" />
                                        {transaction.items?.[0]?.driverName || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <div className="mb-12 overflow-hidden border border-stone-100 rounded-2xl shadow-sm">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-stone-50 border-b border-stone-100">
                                            <th className="text-left py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Description / Material</th>
                                            <th className="text-center py-4 px-3 text-[10px] font-black uppercase tracking-widest text-stone-400">Qty (Tons)</th>
                                            <th className="text-right py-4 px-3 text-[10px] font-black uppercase tracking-widest text-stone-400">Unit Price (NGN)</th>
                                            <th className="text-right py-4 px-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Extension Total (NGN)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-50">
                                        {transaction.items?.map((item, index) => (
                                            <tr key={index}>
                                                <td className="py-5 px-6">
                                                    <p className="font-black text-stone-800 text-base">{item.productName}</p>
                                                    <p className="text-[10px] text-stone-400 font-bold uppercase mt-1">Order Ref: ORD-{index + 1} • Standard Supply</p>
                                                </td>
                                                <td className="py-5 px-3 text-center text-stone-800 font-mono text-sm font-bold">{(item.quantity || 0).toLocaleString()}</td>
                                                <td className="py-5 px-3 text-right text-stone-800 font-mono text-sm font-bold">{item.salesPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td className="py-5 px-6 text-right text-stone-900 font-black font-mono text-lg">{item.totalInvoice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Section */}
                            <div className="flex justify-between items-start gap-12">
                                <div className="flex-1 space-y-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-2">Total Amount in Words:</p>
                                        <p className="text-base font-black italic text-primary-900 border-l-4 border-primary-900 pl-4 py-2">{amountInWords}</p>
                                    </div>

                                    <div className="mt-8 p-6 bg-stone-50 rounded-2xl border border-stone-100 border-t-4 border-t-primary-900">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary-900 mb-2">ACCOUNT DETAILS:</p>
                                                <div className="space-y-0.5 text-[11px] font-black text-stone-800">
                                                    <p>BM Maruph Global Resource</p>
                                                    <p>FCMB Bank</p>
                                                    <p className="text-lg text-primary-900 font-mono tracking-tighter">4233924017</p>
                                                </div>
                                            </div>
                                            <div className="border-l border-stone-200 pl-4">
                                                <p className="text-[10px] font-black text-stone-900 mb-4 tracking-tight uppercase tracking-widest">AUTHORIZED BY</p>
                                                <div className="h-10 border-b border-stone-200 mb-2"></div>
                                                <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Manager's Signature</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 mt-4 italic">
                                        <div className="text-[9px] font-bold text-stone-400 leading-relaxed">
                                            Note: Returns are only accepted within 24 hours of supply. Please verify material quality at the point of delivery.
                                        </div>
                                        <div className="text-right">
                                            <div className="h-10 border-b border-stone-200 mb-2"></div>
                                            <p className="text-[9px] font-black uppercase text-stone-400 tracking-widest">Customer's Signature</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-[260px] space-y-3">
                                    <div className="p-5 bg-primary-900 rounded-2xl text-white shadow-xl shadow-primary-900/20">
                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between items-center text-[10px] font-bold text-primary-200">
                                                <span>Subtotal</span>
                                                <span className="font-mono">{transaction.totalInvoice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-end border-t border-primary-800 pt-3">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-primary-300">Total Due</span>
                                            <div className="text-right">
                                                <p className="text-[9px] font-bold text-primary-400 mb-0.5 uppercase tracking-tighter">NGN (Naira)</p>
                                                <p className="text-xl font-black font-mono leading-none tracking-tighter">
                                                    {transaction.totalInvoice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 text-center">
                                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">
                                            Billing Terms: Due on Receipt
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer System Bar */}
                        <div className="bg-stone-900 p-8 text-center mt-auto">
                            <p className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-2">
                                B.M. MARUPH GLOBAL RESOURCES SYSTEM
                            </p>
                            <p className="text-[8px] font-bold text-stone-500 uppercase tracking-widest">
                                Official Confirmation of Transaction • Generated on {new Date().toISOString()} • App v1.3.0
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    #invoice-area {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        box-shadow: none !important;
                        position: static !important;
                    }
                    @page {
                        size: A4;
                        margin: 0;
                    }
                }
            `}</style>
        </div>
    );
};
