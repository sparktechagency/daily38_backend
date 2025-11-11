import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
export const generatePDF = async (htmlContent: string, paymentID: string) => {
     const browser = await puppeteer.launch();
     const page = await browser.newPage();

     await page.setContent(htmlContent); // Set HTML content
     const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
     });

     const rollBackToRootUploadDir = path.resolve(__dirname, './../../../uploads/');

     const pdfPath = path.join(rollBackToRootUploadDir, 'doc', `payment_${paymentID}_invoice.pdf`);
     console.log("🚀 ~ generatePDF ~ pdfPath:", pdfPath)

     // Save the PDF to disk
     fs.writeFileSync(pdfPath, pdfBuffer);

     await browser.close();

     // return pdfPath;
    return `/doc/payment_${paymentID}_invoice.pdf`;
};
