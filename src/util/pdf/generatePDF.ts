import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
export const generatePDF = async (htmlContent: string, paymentID: string) => {
     const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-gpu', // Disable GPU hardware acceleration
            '--window-size=1280x1024', // Set a window size
        ]
    });
     const page = await browser.newPage();

     await page.setContent(htmlContent); // Set HTML content
     const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
     });

     const rollBackToRootUploadDir = path.resolve(__dirname, './../../../uploads/');

     const pdfFullPath = path.join(rollBackToRootUploadDir, 'doc', `payment_${paymentID}_invoice.pdf`);
     console.log("🚀 ~ generatePDF ~ pdfPath:", pdfFullPath)

      // Save the PDF to disk
    try {
        fs.writeFileSync(pdfFullPath, pdfBuffer);
    } catch (error) {
       console.log("🚀 ~ generatePDF ~ error:", error)
    }

     await browser.close();

     // return pdfPath;
    return {
     pdfFullPath,
     pdfPathForDB: `/doc/payment_${paymentID}_invoice.pdf`
    };
};
