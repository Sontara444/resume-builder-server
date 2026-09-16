const puppeteer = require('puppeteer');

exports.exportToPdf = async (req, res) => {
  const { html, filename } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'HTML content is required for export' });
  }

  let browser;
  try {
    // Launch headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate the PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });

    await browser.close();

    // Send the buffer back to client
    const safeFilename = filename ? `${filename.replace(/[^a-z0-9]/gi, '_')}.pdf` : 'resume.pdf';
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${safeFilename}`);
    // Use res.end for buffer
    res.end(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    if (browser) {
      await browser.close();
    }
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};
