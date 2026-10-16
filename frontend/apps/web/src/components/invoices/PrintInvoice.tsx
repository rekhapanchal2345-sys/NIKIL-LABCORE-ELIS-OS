"use client";

import React, { useEffect, useRef, useCallback } from "react";

interface InvoiceData {
  invoiceNumber?: string;
  patientName?: string;
  patientUhid?: string;
  patientPhone?: string;
  orderNumber?: string;
  doctorName?: string;
  items?: Array<{
    testName?: string;
    price?: number;
    quantity?: number;
    total?: number;
  }>;
  subtotal?: number;
  discount?: number;
  gstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  netPayable?: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentStatus?: string;
  paymentMode?: string;
  createdAt?: string;
  dueDate?: string;
}

interface PrintInvoiceProps {
  invoice: InvoiceData;
  printType: 'thermal' | 'a4';
  onClose: () => void;
}

export default function PrintInvoice({ invoice, printType, onClose }: PrintInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=800,height=600');

      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${invoice.invoiceNumber || 'Invoice'}</title>
              <style>
                ${printType === 'thermal' ? getThermalStyles() : getA4Styles()}
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
        onClose();
      }
    }
  }, [invoice.invoiceNumber, printType, onClose]);

  useEffect(() => {
    if (printRef.current) {
      handlePrint();
    }
  }, [handlePrint]);

  const getThermalStyles = () => `
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      width: 80mm;
      margin: 0;
      padding: 5mm;
    }
    .header {
      text-align: center;
      border-bottom: 1px dashed #000;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    .header h1 {
      font-size: 16px;
      margin: 0;
      font-weight: bold;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin: 3px 0;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    .items-table th, .items-table td {
      border-bottom: 1px dashed #000;
      padding: 3px 0;
      text-align: left;
    }
    .items-table th {
      font-weight: bold;
      border-bottom: 1px solid #000;
    }
    .total-section {
      border-top: 1px dashed #000;
      padding-top: 5px;
      margin-top: 10px;
    }
    .footer {
      text-align: center;
      margin-top: 15px;
      border-top: 1px dashed #000;
      padding-top: 5px;
      font-size: 10px;
    }
    .bold {
      font-weight: bold;
    }
  `;

  const getA4Styles = () => `
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
    }
    .invoice-container {
      max-width: 210mm;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .company-info h1 {
      font-size: 24px;
      margin: 0 0 5px 0;
      color: #1a1a1a;
    }
    .invoice-details {
      text-align: right;
    }
    .invoice-details h2 {
      font-size: 18px;
      margin: 0 0 10px 0;
      color: #1a1a1a;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 10px;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .info-item {
      margin: 5px 0;
    }
    .info-label {
      font-weight: bold;
      color: #555;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .items-table th {
      background-color: #f5f5f5;
      font-weight: bold;
      padding: 10px;
      text-align: left;
      border: 1px solid #ddd;
    }
    .items-table td {
      padding: 10px;
      border: 1px solid #ddd;
    }
    .items-table .amount {
      text-align: right;
    }
    .totals-section {
      margin-top: 20px;
      width: 300px;
      margin-left: auto;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
    .total-row.grand-total {
      font-weight: bold;
      font-size: 16px;
      border-top: 2px solid #000;
      border-bottom: 2px solid #000;
      padding: 10px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 11px;
      color: #666;
    }
    .status-paid {
      color: #22c55e;
      font-weight: bold;
    }
    .status-pending {
      color: #ef4444;
      font-weight: bold;
    }
    .status-partial {
      color: #f59e0b;
      font-weight: bold;
    }
  `;

  const formatCurrency = (amount?: number) => {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (printType === 'thermal') {
    return (
      <div className="hidden">
        <div ref={printRef}>
          <div className="header">
            <h1>LABCORE ELIS</h1>
            <p>Diagnostic Laboratory</p>
            <p>GSTIN: 29ABCDE1234F1Z5</p>
          </div>

          <div className="row">
            <span>Invoice: {invoice.invoiceNumber}</span>
            <span>Date: {formatDate(invoice.createdAt)}</span>
          </div>

          <div className="row">
            <span>Patient: {invoice.patientName}</span>
          </div>
          <div className="row">
            <span>UHID: {invoice.patientUhid}</span>
          </div>
          <div className="row">
            <span>Ph: {invoice.patientPhone}</span>
          </div>

          <div className="row">
            <span>Order: {invoice.orderNumber}</span>
          </div>
          <div className="row">
            <span>Doctor: {invoice.doctorName}</span>
          </div>

          <table className="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td>{item.testName}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="total-section">
            <div className="row">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount && invoice.discount > 0 && (
              <div className="row">
                <span>Discount:</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="row">
              <span>CGST:</span>
              <span>{formatCurrency(invoice.cgstAmount)}</span>
            </div>
            <div className="row">
              <span>SGST:</span>
              <span>{formatCurrency(invoice.sgstAmount)}</span>
            </div>
            <div className="row bold">
              <span>TOTAL:</span>
              <span>{formatCurrency(invoice.netPayable)}</span>
            </div>
            <div className="row">
              <span>Paid:</span>
              <span>{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="row bold">
              <span>Balance:</span>
              <span>{formatCurrency(invoice.pendingAmount)}</span>
            </div>
          </div>

          <div className="row">
            <span>Mode: {invoice.paymentMode}</span>
          </div>
          <div className="row">
            <span>Status: {invoice.paymentStatus}</span>
          </div>

          <div className="footer">
            <p>Thank you for choosing LabCore</p>
            <p>Get well soon!</p>
            <p>{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden">
      <div ref={printRef} className="invoice-container">
        <div className="header">
          <div className="company-info">
            <h1>LABCORE ELIS</h1>
            <p>Enterprise Laboratory Information System</p>
            <p>123 Healthcare Avenue, Medical District</p>
            <p>City: 560001 | Phone: +91-9876543210</p>
            <p>GSTIN: 29ABCDE1234F1Z5 | Email: billing@labcore.com</p>
          </div>
          <div className="invoice-details">
            <h2>TAX INVOICE</h2>
            <p><strong>Invoice No:</strong> {invoice.invoiceNumber}</p>
            <p><strong>Date:</strong> {formatDate(invoice.createdAt)}</p>
            <p><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</p>
          </div>
        </div>

        <div className="section">
          <div className="section-title">BILL TO</div>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Patient Name:</span> {invoice.patientName}
            </div>
            <div className="info-item">
              <span className="info-label">UHID:</span> {invoice.patientUhid}
            </div>
            <div className="info-item">
              <span className="info-label">Phone:</span> {invoice.patientPhone}
            </div>
            <div className="info-item">
              <span className="info-label">Order No:</span> {invoice.orderNumber}
            </div>
            <div className="info-item">
              <span className="info-label">Referring Doctor:</span> {invoice.doctorName}
            </div>
            <div className="info-item">
              <span className="info-label">Payment Status:</span>
              <span className={`status-${invoice.paymentStatus?.toLowerCase()}`}>
                {invoice.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">SERVICES / TESTS</div>
          <table className="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th className="amount">Qty</th>
                <th className="amount">Rate</th>
                <th className="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.testName}</td>
                  <td className="amount">{item.quantity || 1}</td>
                  <td className="amount">{formatCurrency(item.price)}</td>
                  <td className="amount">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="section">
          <div className="totals-section">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.discount && invoice.discount > 0 && (
              <div className="total-row">
                <span>Discount:</span>
                <span>-{formatCurrency(invoice.discount)}</span>
              </div>
            )}
            <div className="total-row">
              <span>CGST (9%):</span>
              <span>{formatCurrency(invoice.cgstAmount)}</span>
            </div>
            <div className="total-row">
              <span>SGST (9%):</span>
              <span>{formatCurrency(invoice.sgstAmount)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Grand Total:</span>
              <span>{formatCurrency(invoice.netPayable)}</span>
            </div>
            <div className="total-row">
              <span>Amount Paid:</span>
              <span>{formatCurrency(invoice.paidAmount)}</span>
            </div>
            <div className="total-row">
              <span>Balance Due:</span>
              <span>{formatCurrency(invoice.pendingAmount)}</span>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">PAYMENT DETAILS</div>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Payment Mode:</span> {invoice.paymentMode}
            </div>
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className={`status-${invoice.paymentStatus?.toLowerCase()}`}>
                {invoice.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="footer">
          <p><strong>Terms & Conditions:</strong></p>
          <p>1. Payment is due within 30 days from invoice date.</p>
          <p>2. Goods once sold will not be taken back.</p>
          <p>3. Subject to local jurisdiction only.</p>
          <p>4. This is a computer-generated invoice and does not require signature.</p>
          <br />
          <p><strong>Bank Details:</strong></p>
          <p>Bank Name: ABC Bank | Account No: 1234567890 | IFSC: ABCD0123456</p>
          <br />
          <p>Generated by LabCore ELIS | {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
