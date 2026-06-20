import React, { useState } from 'react';
import { Order, CompanySettings } from '../types';
import { Printer, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import jsPDF from 'jspdf';

interface InvoicePrintableProps {
  order: Order;
  onClose?: () => void;
  settings: CompanySettings;
  isNewOrder?: boolean;
  currentUserEmail?: string;
}

export default function InvoicePrintable({ order, onClose, settings, isNewOrder = false, currentUserEmail }: InvoicePrintableProps) {
  const [showThankYou, setShowThankYou] = useState(isNewOrder);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'generating' | 'sending' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const downloadPDF = async () => {
    const input = document.getElementById('invoice-container');
    if (!input) {
      window.print();
      return;
    }
    
    try {
      // Temporarily set fixed width to ensure full desktop layout for PDF on mobile
      const originalStyle = input.getAttribute('style');
      input.style.width = '1000px';
      input.style.maxWidth = 'none';
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      input.style.top = '0';
      
      // Remove overflow scrolling temporarily
      const unscrollElements = input.querySelectorAll('.overflow-x-auto');
      unscrollElements.forEach(el => {
        (el as HTMLElement).style.overflowX = 'visible';
      });

      // Allow DOM to update
      await new Promise(resolve => setTimeout(resolve, 50));

      const scale = 2; // Higher quality
      const width = input.offsetWidth;
      const height = input.scrollHeight;

      const dataUrl = await domtoimage.toPng(input, {
        quality: 1,
        bgcolor: '#ffffff',
        width: width * scale,
        height: height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`
        }
      });
      
      // Restore styles
      if (originalStyle !== null) {
        input.setAttribute('style', originalStyle);
      } else {
        input.removeAttribute('style');
      }
      unscrollElements.forEach(el => {
        (el as HTMLElement).style.overflowX = '';
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (height * pdfWidth) / width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice_${order.orderNumber}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      // Fallback
      window.print();
    }
  };

  const emailInvoice = async () => {
    const input = document.getElementById('invoice-container');
    if (!input) {
      setEmailStatus('error');
      setStatusMessage('Invoice element not found in current view');
      return;
    }

    setEmailStatus('generating');
    setStatusMessage('Generating official compliance tax invoice PDF...');

    try {
      // Temporarily set fixed width to ensure full desktop layout for PDF
      const originalStyle = input.getAttribute('style');
      input.style.width = '1000px';
      input.style.maxWidth = 'none';
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      input.style.top = '0';
      
      // Remove overflow scrolling temporarily
      const unscrollElements = input.querySelectorAll('.overflow-x-auto');
      unscrollElements.forEach(el => {
        (el as HTMLElement).style.overflowX = 'visible';
      });

      // Allow DOM to update
      await new Promise(resolve => setTimeout(resolve, 50));

      const scale = 1.5; // Optimized scale for high legibility and lightweight SMTP attachments
      const width = input.offsetWidth;
      const height = input.scrollHeight;

      // Use toJpeg to generate a highly compressed image, bypassing any 413 Payload Too Large limits
      const dataUrl = await domtoimage.toJpeg(input, {
        quality: 0.85, 
        bgcolor: '#ffffff',
        width: width * scale,
        height: height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${width}px`,
          height: `${height}px`
        }
      });
      
      // Restore styles
      if (originalStyle !== null) {
        input.setAttribute('style', originalStyle);
      } else {
        input.removeAttribute('style');
      }
      unscrollElements.forEach(el => {
        (el as HTMLElement).style.overflowX = '';
      });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (height * pdfWidth) / width;
      
      pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      // Generate base64 string
      const pdfDataUri = pdf.output('datauristring');
      const base64Content = pdfDataUri.split(',')[1];
      
      // Send to the backend using the customer's email from logged in profile (or fallback to shippingAddress email)
      const recipientEmail = (currentUserEmail || order.shippingAddress.email || '').trim();
      
      if (!recipientEmail) {
        setEmailStatus('error');
        setStatusMessage('Recipient email address could not be identified.');
        return;
      }

      setEmailStatus('sending');
      setStatusMessage(`Dispatching tax invoice PDF via secure SMTP relay connection to ${recipientEmail}...`);

      const response = await fetch('/api/orders/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderEmail: recipientEmail,
          orderId: order.id,
          pdfBase64: base64Content
        })
      });

      const responseText = await response.text();
      let resData: any = {};
      try {
        resData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error("Non-JSON Server Response Received:", responseText);
        if (responseText.includes('413') || responseText.toLowerCase().includes('payload too large') || responseText.toLowerCase().includes('entity too large')) {
          throw new Error('The invoice payload is too large to pass through the server gateway. Try reducing image elements.');
        } else {
          throw new Error(`Server returned HTML error (${response.status}). SMTP gateway might be misconfigured.`);
        }
      }

      if (response.ok) {
        setEmailStatus('success');
        setStatusMessage(`Invoice successfully sent to ${recipientEmail}`);
        setTimeout(() => {
          setEmailStatus('idle');
          setStatusMessage('');
        }, 4000);
      } else {
        setEmailStatus('error');
        setStatusMessage(resData.error || 'SMTP delivery rejected by host gateway.');
      }
    } catch (error: any) {
      console.error('Failed to email PDF invoice:', error);
      setEmailStatus('error');
      setStatusMessage(error.message || 'SMTP operation or PDF generation failed.');
    }
  };

  const isTamilNadu = order.shippingAddress.state.trim().toLowerCase() === 'tamil nadu' || order.shippingAddress.state.trim().toLowerCase() === 'tamilnadu';

  if (showThankYou) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-in fade-in zoom-in duration-300">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h2>
          <p className="text-gray-600 mb-8 border-b border-gray-100 pb-6 text-sm">
            Thank you for purchasing with <b>{settings.companyName}</b>.<br/><br/>
            {order.shippingAddress.fullName}, your order <span className="font-semibold text-gray-900">{order.orderNumber}</span> is confirmed.
          </p>
          <button 
            onClick={() => setShowThankYou(false)}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0 font-sans text-gray-800">
      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-4 print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 border border-gray-200 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </button>
        <div className="flex gap-2">
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg shadow hover:bg-amber-600 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
          <button
            onClick={emailInvoice}
            disabled={emailStatus === 'generating' || emailStatus === 'sending'}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-800 text-white rounded-lg shadow hover:bg-slate-900 duration-150 cursor-pointer disabled:opacity-50"
          >
            <Mail className="w-4 h-4" /> {emailStatus === 'generating' || emailStatus === 'sending' ? 'Emailing...' : 'Email Invoice'}
          </button>
        </div>
      </div>

      {emailStatus !== 'idle' && (
        <div className={`max-w-4xl mx-auto mb-6 p-3 rounded-lg flex items-center justify-between text-xs font-medium border print:hidden transition-all duration-300 ${
          emailStatus === 'generating' || emailStatus === 'sending' 
            ? 'bg-blue-50 text-blue-800 border-blue-200 animate-pulse'
            : emailStatus === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {(emailStatus === 'generating' || emailStatus === 'sending') && (
              <span className="inline-block w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
            )}
            <span>{statusMessage}</span>
          </div>
          {emailStatus === 'error' && (
            <button 
              onClick={() => setEmailStatus('idle')} 
              className="underline hover:text-red-950 font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* Invoice Container */}
      <div id="invoice-container" className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 print:shadow-none print:border-none print:p-0">
        
        {/* Invoice Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-8 text-sm">
          <div>
            <span className="text-amber-500 font-black tracking-widest text-lg block mb-1">{settings.shortName.toUpperCase()}</span>
            <div className="mt-4 text-xs text-gray-600 space-y-1">
              <p className="font-semibold text-sm text-gray-800">{settings.companyName}</p>
              <p className="whitespace-pre-line">{settings.address}</p>
              <p><span className="font-medium text-gray-700">GSTIN:</span> {settings.gstin}</p>
              <p><span className="font-medium text-gray-700">PAN:</span> {settings.gstin ? settings.gstin.substring(2, 12) : 'AAAAA1111A'}</p>
              <p><span className="font-medium text-gray-700">Email:</span> {settings.email} | <span className="font-medium text-gray-700">Tel:</span> {settings.phone}</p>
            </div>
          </div>
          
          <div className="md:text-right">
            <h2 className="text-2xl font-bold uppercase tracking-wider text-slate-800 mb-1">Tax Invoice</h2>
            <p className="text-gray-400 text-xs">(ORIGINAL FOR RECIPIENT)</p>
            
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs md:justify-items-end">
              <span className="text-gray-500 text-right font-medium">Invoice Number:</span>
              <span className="font-bold text-gray-900 text-right">{order.id}</span>
              
              <span className="text-gray-500 text-right font-medium">Invoice Date:</span>
              <span className="text-gray-800 text-right">{new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
              
              <span className="text-gray-500 text-right font-medium">Order Number:</span>
              <span className="text-gray-800 text-right">{order.orderNumber}</span>
              
              <span className="text-gray-500 text-right font-medium">Payment Gateway Ref:</span>
              <span className="text-gray-800 text-right font-mono">{order.paymentReference}</span>
              
              <span className="text-gray-500 text-right font-medium">Method:</span>
              <span className="text-gray-850 text-right">{order.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Billing & Shipping Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 my-6 border-t border-b border-gray-100 text-xs">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Billed To (Recipient)</h3>
            <div className="space-y-1">
              <p className="font-bold text-sm text-gray-900">{order.shippingAddress.fullName}</p>
              {order.shippingAddress.companyName && (
                <p className="font-semibold text-gray-700">{order.shippingAddress.companyName}</p>
              )}
              {order.shippingAddress.gstNumber && (
                <p className="font-medium bg-slate-100 inline-block px-1.5 py-0.5 rounded text-amber-800">
                  GSTIN: {order.shippingAddress.gstNumber.toUpperCase()}
                </p>
              )}
              <p className="mt-2 text-gray-650">{order.shippingAddress.addressLine}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              <p>State Code: {(order.shippingAddress.state.trim().toLowerCase() === 'tamil nadu' || order.shippingAddress.state.trim().toLowerCase() === 'tamilnadu') ? '33' : 'Other'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Delivery Details</h3>
            <div className="space-y-1 text-gray-700">
              <p className="font-medium text-gray-900">Shipment Handled By Partner Logistics</p>
              <p>Tracking Number: <span className="font-mono text-gray-800">CROM-TRK-{Math.floor(100000 + Math.random() * 900000)}</span></p>
              <p className="mt-2"><span className="text-gray-500">Mobile:</span> {order.shippingAddress.phone}</p>
              <p><span className="text-gray-500">Email:</span> {order.shippingAddress.email}</p>
              <p><span className="text-gray-500">Payment Status:</span> <span className="text-green-600 font-semibold uppercase">{order.paymentStatus}</span></p>
            </div>
          </div>
        </div>

        {/* GST Items Table */}
        <div className="overflow-x-auto my-6 print:overflow-visible print:w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-gray-700 font-bold border-b border-gray-250">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3 w-1/3">Item Description</th>
                <th className="py-2.5 px-3">HSN Code</th>
                <th className="py-2.5 px-3">Qty</th>
                <th className="py-2.5 px-3 text-right">Unit Rate<br/><span className="font-normal text-gray-500">(Excl. Tax)</span></th>
                <th className="py-2.5 px-3 text-right">Taxable<br/>Value</th>
                <th className="py-2.5 px-3 text-center">GST<br/>Rate</th>
                {isTamilNadu ? (
                  <>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                  </>
                ) : (
                  <th className="py-2.5 px-3 text-right">IGST</th>
                )}
                <th className="py-2.5 px-3 text-right">Total<br/><span className="font-normal text-gray-500">(Incl. Tax)</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {order.items.map((item, index) => {
                const totalItemTaxable = item.unitPriceExclTax * item.quantity;
                return (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 align-top font-medium text-gray-500">{index + 1}</td>
                    <td className="py-3 px-3 align-top">
                      <div className="font-semibold text-gray-900">{item.name}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">SKU: {item.sku}</div>
                    </td>
                    <td className="py-3 px-3 align-top text-gray-700 font-mono">{item.hsnCode}</td>
                    <td className="py-3 px-3 align-top font-semibold text-gray-900">{item.quantity}</td>
                    <td className="py-3 px-3 align-top text-right">₹{item.unitPriceExclTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 align-top text-right text-gray-900">₹{totalItemTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-3 align-top text-center text-gray-800">{item.gstPercentage}%</td>
                    {isTamilNadu ? (
                      <>
                        <td className="py-3 px-3 align-top text-right text-gray-700">
                          ₹{item.cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}<br/>
                          <span className="text-[9px] text-gray-400">@{(item.gstPercentage / 2)}%</span>
                        </td>
                        <td className="py-3 px-3 align-top text-right text-gray-700">
                          ₹{item.sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}<br/>
                          <span className="text-[9px] text-gray-400">@{(item.gstPercentage / 2)}%</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-3 px-3 align-top text-right text-gray-700">
                        ₹{item.igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}<br/>
                        <span className="text-[9px] text-gray-400">@{item.gstPercentage}%</span>
                      </td>
                    )}
                    <td className="py-3 px-3 align-top text-right font-bold text-gray-900">₹{item.totalAmount.toLocaleString('en-IN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Price Breakdown in Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 text-xs">
          <div>
            <h4 className="font-semibold text-gray-700 mb-2 uppercase tracking-wide">GST Tax Summary Description:</h4>
            <div className="bg-slate-50 p-3 rounded-lg border border-gray-150 text-[11px] text-gray-600 space-y-1.5">
              <p>1. Output Tax is calculated as per CGST/SGST rules on Intra-State sale to Tamil Nadu.</p>
              <p>2. IGST is calculated on Inter-State sale based on Customer State code selection.</p>
              <p>3. All goods are packed with dynamic technical datasheets & safety guidelines.</p>
              <p className="font-medium text-slate-800 mt-2">Electronic Transaction Authorized Code: <span className="font-mono bg-amber-50 text-amber-800 px-1 py-0.5 rounded">CROM-TXN-SUCCESS</span></p>
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-xl border border-gray-150 md:text-right text-xs">
            <div className="flex justify-between md:justify-end gap-x-8">
              <span className="text-gray-500 font-medium">Subtotal (Before Tax):</span>
              <span className="font-semibold text-gray-900">₹{order.subtotalExclTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            
            {order.couponApplied && (
              <div className="flex justify-between md:justify-end gap-x-8 text-green-600 font-medium">
                <span>Coupon ({order.couponApplied.code}) Applied:</span>
                <span>- ₹{order.couponApplied.discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            {isTamilNadu ? (
              <>
                <div className="flex justify-between md:justify-end gap-x-8">
                  <span className="text-gray-500 font-medium">Central GST (CGST):</span>
                  <span className="font-semibold text-gray-900">₹{order.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between md:justify-end gap-x-8">
                  <span className="text-gray-500 font-medium">State GST (SGST):</span>
                  <span className="font-semibold text-gray-900">₹{order.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between md:justify-end gap-x-8">
                <span className="text-gray-500 font-medium">Integrated GST (IGST/Out-of-State):</span>
                <span className="font-semibold text-gray-900">₹{order.totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}

            <div className="flex justify-between md:justify-end gap-x-8 border-t border-gray-200 pt-2 mt-1">
              <span className="text-gray-600 font-medium">Total GST Tax Collected:</span>
              <span className="font-semibold text-gray-900">₹{order.totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>

            <div className="flex justify-between md:justify-end gap-x-8 text-base font-bold text-slate-900 pt-2 border-t border-dashed border-gray-300">
              <span className="uppercase tracking-wide">Grand Total:</span>
              <span className="text-lg text-amber-600">₹{order.grandTotal.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 italic">Amount in words: Rupees {numberToIndianWords(Math.round(order.grandTotal))} Only</p>
          </div>
        </div>

        {/* Invoice Footer (Compliant Declaration) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end pt-8 border-t border-gray-200 text-[11px] text-gray-500">
          <div>
            <span className="font-semibold text-black block mb-1">Terms & Conditions:</span>
            <ul className="list-disc pl-4 space-y-1 text-gray-500">
              <li>Goods once sold strictly cannot be returned or refunded unless under hardware failure and manufacturer recall.</li>
              <li>Warranty eligibility is provided directly by the original brands respectively.</li>
              <li>Interest at 18% per annum will be charged if payment is not cleared on continuous COD terms.</li>
            </ul>
          </div>
          
          <div className="text-right flex flex-col items-end">
            <div className="border border-gray-200 p-2 text-center rounded bg-slate-50 w-44 h-16 flex items-center justify-center mb-1 font-serif text-[10px] text-gray-400">
              Authorized Signature Seal
            </div>
            <p className="font-bold text-gray-800">For {settings.companyName}</p>
            <p className="text-gray-400 font-light">Computer Generated Secure GST Invoice</p>
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple Indian numbering formatting converter helper
function numberToIndianWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convertLessThanThousand(n: number): string {
    let s = '';
    if (n >= 100) {
      s += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      s += tens[Math.floor(n / 10)] + ' ' + ones[n % 10];
    } else if (n > 0) {
      s += ones[n];
    }
    return s.trim();
  }

  let words = '';
  // Indian currency numbering splits: Crores, Lakhs, Thousands, Hundreds
  if (num >= 10000000) {
    words += convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    words += convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    words += convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  words += convertLessThanThousand(num);
  return words.trim();
}
