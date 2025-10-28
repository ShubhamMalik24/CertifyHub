const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateCertificate = async (data) => {
  const { studentName, courseTitle, completionDate, instructorName, certificateId, grade, overallScore } = data;

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0
  });

  const fileName = `certificate_${Date.now()}.pdf`;
  const filePath = path.join(__dirname, '../../uploads', fileName);

  doc.pipe(fs.createWriteStream(filePath));

  // Page dimensions
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const centerX = pageWidth / 2;

  // Elegant gradient background (simulated with rectangles)
  doc.rect(0, 0, pageWidth, pageHeight).fillColor('#f8fafc').fill();
  
  // Top decorative banner
  doc.rect(0, 0, pageWidth, 80)
     .fillAndStroke('#3b82f6', '#3b82f6')
     .fill();
  
  // Bottom decorative banner
  doc.rect(0, pageHeight - 60, pageWidth, 60)
     .fillAndStroke('#1e40af', '#1e40af')
     .fill();

  // Ornamental corner elements
  // Top-left corner
  doc.moveTo(0, 80)
     .lineTo(60, 80)
     .lineTo(60, 100)
     .lineTo(40, 100)
     .lineTo(40, 120)
     .lineTo(0, 120)
     .fillColor('#60a5fa')
     .fill();

  // Top-right corner
  doc.moveTo(pageWidth, 80)
     .lineTo(pageWidth - 60, 80)
     .lineTo(pageWidth - 60, 100)
     .lineTo(pageWidth - 40, 100)
     .lineTo(pageWidth - 40, 120)
     .lineTo(pageWidth, 120)
     .fillColor('#60a5fa')
     .fill();

  // Bottom-left corner
  doc.moveTo(0, pageHeight - 60)
     .lineTo(60, pageHeight - 60)
     .lineTo(60, pageHeight - 80)
     .lineTo(40, pageHeight - 80)
     .lineTo(40, pageHeight - 100)
     .lineTo(0, pageHeight - 100)
     .fillColor('#1e3a8a')
     .fill();

  // Bottom-right corner
  doc.moveTo(pageWidth, pageHeight - 60)
     .lineTo(pageWidth - 60, pageHeight - 60)
     .lineTo(pageWidth - 60, pageHeight - 80)
     .lineTo(pageWidth - 40, pageHeight - 80)
     .lineTo(pageWidth - 40, pageHeight - 100)
     .lineTo(pageWidth, pageHeight - 100)
     .fillColor('#1e3a8a')
     .fill();

  // Main decorative border
  doc.rect(50, 100, pageWidth - 100, pageHeight - 180)
     .lineWidth(4)
     .strokeColor('#3b82f6')
     .stroke();

  // Inner elegant border
  doc.rect(60, 110, pageWidth - 120, pageHeight - 200)
     .lineWidth(1.5)
     .strokeColor('#60a5fa')
     .stroke();

  // Double inner border for elegance
  doc.rect(65, 115, pageWidth - 130, pageHeight - 210)
     .lineWidth(0.5)
     .strokeColor('#93c5fd')
     .stroke();

  // CertifyHub Logo/Brand (Top Banner)
  doc.fillColor('#ffffff')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('CertifyHub', 0, 25, { align: 'center' });

  doc.fillColor('#e0f2fe')
     .fontSize(12)
     .font('Helvetica')
     .text('Learning Management System', 0, 55, { align: 'center' });

  // Certificate Header with elegant styling
  doc.fillColor('#1e293b')
     .fontSize(48)
     .font('Helvetica-Bold')
     .text('CERTIFICATE', 0, 135, { align: 'center' });

  doc.fillColor('#3b82f6')
     .fontSize(22)
     .font('Helvetica-Oblique')
     .text('of Achievement', 0, 190, { align: 'center' });

  // Elegant decorative divider
  const dividerY = 225;
  doc.moveTo(centerX - 150, dividerY)
     .lineTo(centerX - 30, dividerY)
     .lineWidth(2)
     .strokeColor('#f59e0b')
     .stroke();
  
  // Central ornament
  doc.circle(centerX, dividerY, 8)
     .fillColor('#f59e0b')
     .fill();
  
  doc.moveTo(centerX + 30, dividerY)
     .lineTo(centerX + 150, dividerY)
     .lineWidth(2)
     .strokeColor('#f59e0b')
     .stroke();

  // Certification text
  doc.fillColor('#475569')
     .fontSize(16)
     .font('Helvetica')
     .text('This is proudly presented to', 0, 250, { align: 'center' });

  // Student name - elegant and prominent
  doc.fillColor('#0f172a')
     .fontSize(36)
     .font('Helvetica-Bold')
     .text(studentName, 0, 285, { align: 'center' });

  // Name underline decoration
  doc.moveTo(centerX - 180, 325)
     .lineTo(centerX + 180, 325)
     .lineWidth(1.5)
     .strokeColor('#cbd5e1')
     .stroke();

  // Achievement text
  doc.fillColor('#475569')
     .fontSize(15)
     .font('Helvetica')
     .text('for successfully completing the course', 0, 345, { align: 'center' });

  // Course title - elegant box design
  const courseBoxY = 375;
  doc.rect(centerX - 250, courseBoxY - 5, 500, 45)
     .fillColor('#eff6ff')
     .fill();

  doc.rect(centerX - 250, courseBoxY - 5, 500, 45)
     .lineWidth(1)
     .strokeColor('#3b82f6')
     .stroke();

  doc.fillColor('#1e40af')
     .fontSize(24)
     .font('Helvetica-Bold')
     .text(courseTitle, 100, courseBoxY + 8, { 
       width: pageWidth - 200, 
       align: 'center' 
     });

  // Details section with better layout
  const detailsY = 450;
  const leftCol = 150;
  const rightCol = pageWidth - 320;

  // Date section
  doc.fillColor('#64748b')
     .fontSize(11)
     .font('Helvetica-Bold')
     .text('DATE OF COMPLETION', leftCol, detailsY);
     
  doc.fillColor('#0f172a')
     .fontSize(14)
     .font('Helvetica')
     .text(completionDate.toLocaleDateString('en-US', { 
       year: 'numeric', 
       month: 'long', 
       day: 'numeric' 
     }), leftCol, detailsY + 18);

  // Certificate ID section
  if (certificateId) {
    doc.fillColor('#64748b')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('CERTIFICATE ID', rightCol, detailsY);
       
    doc.fillColor('#0f172a')
       .fontSize(13)
       .font('Helvetica')
       .text(certificateId, rightCol, detailsY + 18);
  }

  // Grade and Score section (if available)
  if (grade || overallScore) {
    const gradeY = detailsY + 50;
    const gradeCol = centerX - 80;
    
    doc.fillColor('#64748b')
       .fontSize(11)
       .font('Helvetica-Bold')
       .text('GRADE', gradeCol, gradeY);
       
    doc.fillColor('#0f172a')
       .fontSize(14)
       .font('Helvetica')
       .text(grade || 'Pass', gradeCol, gradeY + 18);

    if (overallScore) {
      doc.fillColor('#64748b')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('SCORE', gradeCol + 100, gradeY);
         
      doc.fillColor('#0f172a')
         .fontSize(14)
         .font('Helvetica')
         .text(`${overallScore}%`, gradeCol + 100, gradeY + 18);
    }
  }

  // Instructor signature section - elegant design
  const sigY = pageHeight - 180;
  const sigCol = centerX - 100;
  
  doc.fillColor('#64748b')
     .fontSize(11)
     .font('Helvetica')
     .text('Authorized Signature', sigCol, sigY);

  // Signature line
  doc.moveTo(sigCol, sigY + 35)
     .lineTo(sigCol + 200, sigY + 35)
     .lineWidth(1)
     .strokeColor('#94a3b8')
     .stroke();

  doc.fillColor('#0f172a')
     .fontSize(15)
     .font('Helvetica-Bold')
     .text(instructorName, sigCol, sigY + 40);

  doc.fillColor('#64748b')
     .fontSize(10)
     .font('Helvetica-Oblique')
     .text('Course Instructor', sigCol + 40, sigY + 58);

  // Official seal/badge representation (right side)
  const sealX = pageWidth - 180;
  const sealY = sigY + 10;
  
  // Outer circle
  doc.circle(sealX, sealY, 35)
     .lineWidth(2)
     .strokeColor('#3b82f6')
     .stroke();
  
  // Inner circle
  doc.circle(sealX, sealY, 30)
     .lineWidth(1)
     .strokeColor('#60a5fa')
     .stroke();
  
  // Star in center (simplified)
  doc.fillColor('#3b82f6')
     .fontSize(24)
     .font('Helvetica-Bold')
     .text('✓', sealX - 8, sealY - 10);
  
  doc.fillColor('#1e40af')
     .fontSize(8)
     .font('Helvetica-Bold')
     .text('CERTIFIED', sealX - 22, sealY + 42);

  // Bottom banner content
  const bottomTextY = pageHeight - 38;
  
  doc.fillColor('#ffffff')
     .fontSize(9)
     .font('Helvetica')
     .text('This certificate verifies the successful completion of the course requirements', 
           100, bottomTextY, { width: pageWidth - 200, align: 'center' });

  // Verification code/URL - bottom left
  if (certificateId) {
    doc.fillColor('#e0f2fe')
       .fontSize(8)
       .font('Helvetica')
       .text(`Verify: certifyhub.com/verify/${certificateId}`, 60, pageHeight - 25);
  }

  // Issue date - bottom right
  doc.fillColor('#e0f2fe')
     .fontSize(8)
     .font('Helvetica')
     .text(`Issued: ${new Date().toLocaleDateString('en-US')}`, 
           pageWidth - 180, pageHeight - 25);

  doc.end();

  return `/uploads/${fileName}`;
};

module.exports = {
  generateCertificate
};
