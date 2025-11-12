import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export interface IOrderDetails {
  postID: string;
  orderId: string;
  paymentID: string;
  postName: string;
  postDescription?: string;
  customerName: string;
  customerEmail: string;
  providerName: string;
  providerEmail: string;
  totalBudgetPaidByCustomer: number;
  adminCommission: number;
  providerReceiveAmount: number;
  adminCommissionPercentage: number;
}

export const generatePDFKit = async (orderDetails: IOrderDetails): Promise<{pdfFullPath:string,pdfPathForDB:string} | any> => {
  return new Promise((resolve, reject) => {
    try {
      // Define file path
      const uploadsDir = path.join(process.cwd(), 'uploads', 'doc');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `invoice_${orderDetails.orderId}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Invoice ${orderDetails.orderId}`,
          Author: 'Boolbi Daily38',
        },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // === Header: Logo + Company ===
      const logoUrl = 'https://i.ibb.co.com/HDk3yp1K/logo.png';
      let logoBuffer: Buffer | null = null;

      // Download logo
      const axios = require('axios');
      axios.get(logoUrl, { responseType: 'arraybuffer' })
        .then((res: any) => {
          logoBuffer = Buffer.from(res.data);
          if (logoBuffer) {
            doc.image(logoBuffer, doc.page.width / 2 - 35, 40, { width: 70 });
          }
        })
        .catch(() => {
          // Silently fail if logo not available
        })
        .finally(() => {
          // Continue rendering even if logo fails
          renderPDF();
        });

      const renderPDF = () => {
        // Company Name
        doc.moveDown(8);
        doc.font('Helvetica-Bold').fontSize(22).fillColor('#003366').text('Boolbi Daily38', { align: 'center' });
        doc.fontSize(10).fillColor('#666').text('Germany, Europe', { align: 'center' });
        doc.text('Email: support@boolbidaily38.com | Phone: +06 223 456 678', { align: 'center' });
        doc.moveDown(1);

        // Invoice Title
        doc.fontSize(18).font('Helvetica-Bold').fillColor('#003366').text('INVOICE', { align: 'center' });
        doc.moveDown(0.5);
        doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(1);

        // === Invoice Info ===
        const startY = doc.y;
        doc.fontSize(11).fillColor('#000');

        // Left: Customer
        doc.text('Bill To:', 50, startY);
        doc.font('Helvetica').text(orderDetails.customerName, 50, doc.y + 5);
        doc.text(orderDetails.customerEmail, 50, doc.y + 5);

        // Right: Invoice Details
        const rightX = 350;
        doc.font('Helvetica-Bold').text('Invoice ID:', rightX, startY);
        doc.font('Helvetica').text(orderDetails.orderId, rightX, doc.y + 5);
        doc.text(`Post ID: ${orderDetails.postID}`, rightX, doc.y + 5);
        doc.text(`Payment ID: ${orderDetails.paymentID}`, rightX, doc.y + 5);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, rightX, doc.y + 5);

        doc.moveDown(2);

        // === Post Details Table ===
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#003366').text('Post Details', 50);
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const rowHeight = 25;
        const col1 = 50, col2 = 200, col3 = 450;

        // Header
        doc.rect(40, tableTop - 5, 520, rowHeight).fill('#f0f0f0');
        doc.fillColor('#003366').font('Helvetica-Bold').fontSize(11);
        doc.text('Post Name', col1 + 10, tableTop + 6);
        doc.text('Description', col2 + 10, tableTop + 6);
        doc.text('Price', col3 + 10, tableTop + 6, { width: 80, align: 'right' });

        let currentY = tableTop + rowHeight;

        // Post Row
        doc.rect(40, currentY - 5, 520, rowHeight).fill('#ffffff');
        doc.fillColor('#000').font('Helvetica').fontSize(11);
        doc.text(orderDetails.postName, col1 + 10, currentY + 6, { width: 140 });
        const desc = orderDetails.postDescription || 'No description';
        doc.text(desc.length > 50 ? desc.substring(0, 47) + '...' : desc, col2 + 10, currentY + 6, { width: 240 });
        doc.text(`${orderDetails.totalBudgetPaidByCustomer.toFixed(2)} /-`, col3 + 10, currentY + 6, { width: 80, align: 'right' });

        currentY += rowHeight + 10;
        doc.moveDown(3);

        // /* // === Pricing Breakdown ===
        // doc.fontSize(12).font('Helvetica-Bold').fillColor('#003366').text('Payment Summary', 50);
        // doc.moveDown(0.5);

        // const pricingTop = doc.y;
        // const priceRowHeight = 22;

        // // Sub Total
        // doc.text('Total Budget Paid by Customer', 50, pricingTop + 6);
        // doc.text(`${orderDetails.totalBudgetPaidByCustomer.toFixed(2)} /-`, 450, pricingTop + 6, { width: 100, align: 'right' });

        // // Admin Commission
        // doc.text(`Admin Commission (${orderDetails.adminCommissionPercentage}%)`, 50, doc.y + priceRowHeight);
        // doc.text(`-${orderDetails.adminCommission.toFixed(2)} /-`, 450, doc.y, { width: 100, align: 'right' });

        // // Provider Receives
        // doc.font('Helvetica-Bold').fillColor('#003366');
        // doc.text('Provider Receive Amount', 50, doc.y + priceRowHeight + 5);
        // doc.text(`${orderDetails.providerReceiveAmount.toFixed(2)} /-`, 450, doc.y + 5, { width: 100, align: 'right' });

        // // Final Line
        // doc.lineWidth(0.5).moveTo(40, doc.y + 25).lineTo(560, doc.y + 25).stroke();

        // doc.moveDown(3); */

        // === Pricing Breakdown ===
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#003366').text('Payment Summary', 50);
doc.moveDown(0.5);

const pricingTop = doc.y;
const priceRowHeight = 20; // Define the row height

// Add padding and adjust for the table border
const padding = 10;
const tableTop2 = pricingTop + 10 + padding; // Adjust top for padding
const tableTop3 = pricingTop + 5 + 10; // Adjust top for padding
const tableHeight = priceRowHeight * 4; // Assuming 4 rows in the table (Sub Total, Admin Commission, Provider, and Final)

doc.lineWidth(1); // Set border width
doc.strokeColor('#003366'); // Set the border color to #003366

// Draw the outer border of the table with padding
doc.rect(50 - padding, tableTop2 - padding, 500 + 2 * padding, tableHeight + 2 * padding).stroke(); // Outer border with padding

// Table headers (Description and Amount)
doc.fontSize(11).font('Helvetica-Bold').fillColor('#003366').text('Description', 50, tableTop2 + padding);
doc.text('Amount (USD)', 450, tableTop2 + padding, { width: 100, align: 'right' });

// Draw the header line below the table header
//doc.lineWidth(0.5).moveTo(50, tableTop3 + priceRowHeight + padding).lineTo(550, tableTop2 + priceRowHeight + padding).stroke(); // Table header border

// Sub Total row (remove extra padding below header)
doc.font('Helvetica').fillColor('#000000');
doc.fontSize(11).fillColor('#000000').text('Total Budget Paid by Customer', 50, tableTop2 + priceRowHeight + padding);
doc.text(`${orderDetails.totalBudgetPaidByCustomer.toFixed(2)} /-`, 450, tableTop2 + priceRowHeight + padding, { width: 100, align: 'right' });

// Admin Commission row
doc.font('Helvetica').fillColor('#000000');
doc.text(`Admin Commission (${orderDetails.adminCommissionPercentage}%)`, 50, tableTop2 + priceRowHeight * 2 + padding);
doc.text(`-${orderDetails.adminCommission.toFixed(2)} /-`, 450, tableTop2 + priceRowHeight * 2 + padding, { width: 100, align: 'right' });

// Provider Receives row
doc.font('Helvetica').fillColor('#000000');
doc.text('Provider Receive Amount', 50, tableTop2 + priceRowHeight * 3 + padding);
doc.text(`${orderDetails.providerReceiveAmount.toFixed(2)} /-`, 450, tableTop2 + priceRowHeight * 3 + padding, { width: 100, align: 'right' });

// Final horizontal line to close the table
doc.lineWidth(0.5).moveTo(50, tableTop2 + priceRowHeight * 4 + padding + 25).lineTo(550, tableTop2 + priceRowHeight * 4 + padding + 25).stroke();

// Additional space after the pricing table
doc.moveDown(3);


        
        // === Provider Info ===
        doc.fontSize(10).fillColor('#555');
        doc.text(`Provider: ${orderDetails.providerName}`, 50);
        doc.text(orderDetails.providerEmail, 50, doc.y + 5);

        // === Footer ===
        doc.moveDown(4);
        doc.fontSize(9).fillColor('#777').text('Thank you for your business!', { align: 'center' });
        doc.text('- Boolbi Daily38 Team', { align: 'center' });

        // Finalize
        doc.end();
      };

      stream.on('finish', () => {
        // resolve(filePath);
        resolve({pdfFullPath:filePath,pdfPathForDB:`/doc/${fileName}`});
      });

      stream.on('error', (err) => {
        reject(err);
      });

      doc.on('error', (err) => {
        reject(err);
      });

    } catch (err) {
      reject(err);
    }
  });
};