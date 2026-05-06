import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';
import { User } from '../../user/entities/user.entity';
import { UploadService } from '../../upload/upload.service';
import { AppLogger } from '../../../common/logger/app-logger.service';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(User)    private readonly userRepo:    Repository<User>,
    private readonly uploadService: UploadService,
    private readonly logger:        AppLogger,
  ) {}

  async generateInvoice(paymentId: string): Promise<string> {
    this.logger.info('Fatura üretimi başladı', { service: 'InvoiceService' }, { paymentId });

    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
      relations: ['consultant'],
    });
    if (!payment) throw new NotFoundException('Ödeme bulunamadı');

    // Fatura numarası üret: INV-2026-001234
    const invoiceNumber = await this.generateInvoiceNumber();

    // HTML fatura içeriği
    const html = this.buildInvoiceHtml({
      invoiceNumber,
      date:         new Date(payment.created_at).toLocaleDateString('tr-TR'),
      consultant:   payment.consultant,
      amount:       Number(payment.amount),
      currency:     payment.currency,
      packageKey:   payment.package_key || 'Ek Kredi',
      provider:     payment.provider,
      paymentId:    payment.provider_payment_id || '-',
    });

    // HTML → PDF (puppeteer veya fallback)
    const pdfBuffer = await this.htmlToPdf(html);

    // Storage'a yükle
    const s3Key = `invoices/${payment.consultant_id}/${invoiceNumber}.pdf`;
    const { provider } = await this.uploadService.getProvider();
    await provider.putObject(s3Key, pdfBuffer, 'application/pdf');

    // payments tablosunu güncelle
    await this.paymentRepo.update(paymentId, {
      invoice_url:    s3Key,
      invoice_number: invoiceNumber,
    });

    this.logger.info('Fatura üretildi', { service: 'InvoiceService' }, {
      paymentId, invoiceNumber, s3Key
    });

    return s3Key;
  }

  private buildInvoiceHtml(data: {
    invoiceNumber: string;
    date:          string;
    consultant:    User;
    amount:        number;
    currency:      string;
    packageKey:    string;
    provider:      string;
    paymentId:     string;
  }): string {
    return `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; }
    .logo { font-size: 24px; font-weight: 800; color: #10b981; letter-spacing: -1px; }
    .invoice-title { font-size: 32px; font-weight: 900; color: #1e293b; text-align: right; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin: 40px 0; }
    .info-box h4 { margin: 0 0 12px; font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; }
    .info-box p { margin: 4px 0; font-size: 14px; font-weight: 600; color: #334155; }
    table { width: 100%; border-collapse: collapse; margin: 40px 0; }
    th { background: #f8fafc; padding: 15px 12px; text-align: left; font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; }
    td { padding: 20px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; font-weight: 500; }
    .total-row td { font-weight: 900; font-size: 18px; border-top: 2px solid #1e293b; color: #1e293b; padding-top: 25px; }
    .footer { margin-top: 80px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 30px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">WELLBEING METRIC</div>
    <div>
      <div class="invoice-title">FATURA</div>
      <div style="font-size:14px; color:#64748b; font-weight:700; text-align:right;"># ${data.invoiceNumber}</div>
      <div style="font-size:14px; color:#64748b; font-weight:700; text-align:right;">Tarih: ${data.date}</div>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h4>Müşteri Bilgileri</h4>
      <p style="font-size: 18px; color: #1e293b;">${data.consultant.full_name}</p>
      <p>${data.consultant.email}</p>
    </div>
    <div class="info-box" style="text-align: right;">
      <h4>Ödeme Detayları</h4>
      <p>Ödeme Yöntemi: ${data.provider.toUpperCase()}</p>
      <p>İşlem ID: ${data.paymentId}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50%;">AÇIKLAMA</th>
        <th style="text-align: center;">ADET</th>
        <th style="text-align: right;">BİRİM FİYAT</th>
        <th style="text-align: right;">TOPLAM</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <div style="font-weight: 700; color: #1e293b;">${data.packageKey}</div>
          <div style="font-size: 12px; color: #64748b; font-weight: 400; margin-top: 4px;">Platform Hizmet Bedeli</div>
        </td>
        <td style="text-align: center;">1</td>
        <td style="text-align: right;">${data.amount.toFixed(2)} ${data.currency}</td>
        <td style="text-align: right;">${data.amount.toFixed(2)} ${data.currency}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2"></td>
        <td style="text-align: right; color: #64748b; font-size: 14px;">GENEL TOPLAM</td>
        <td style="text-align: right;">${data.amount.toFixed(2)} ${data.currency}</td>
      </tr>
    </tfoot>
  </table>

  <div class="footer">
    <strong>Wellbeing Metric Teknolojileri A.Ş.</strong><br/>
    Email: platform@wellbeingmetric.com · Web: www.wellbeingmetric.com<br/>
    Bu fatura elektronik ortamda oluşturulmuştur.
  </div>
</body>
</html>`;
  }

  private async htmlToPdf(html: string): Promise<Buffer> {
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: 'new'
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
      });
      await browser.close();
      return Buffer.from(pdf);
    } catch (err) {
      this.logger.warn('Puppeteer ile PDF üretimi başarısız — HTML fallback kullanılıyor', 
        { service: 'InvoiceService' }, 
        { error: err.message }
      );
      return Buffer.from(html, 'utf-8');
    }
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.paymentRepo.count({
      where: { status: 'completed' }
    });
    return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }
}
