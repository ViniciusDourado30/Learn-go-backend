import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

const outputDir = path.join(__dirname, 'uploads', 'materials');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Gerando PDFs fictícios...');

for (let i = 0; i < 1000; i++) {
  const doc = new PDFDocument();
  const filePath = path.join(outputDir, `aula_${i}.pdf`);
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(25).text(`Material de Apoio #${i}`, 100, 100);
  doc.fontSize(14).text(`Este é um conteúdo simulado para a aula número ${i}.`);
  doc.moveDown();
  doc.text(`Tópicos abordados:
- Introdução
- Teoria
- Prática
- Exercícios resolvidos`);
  
  doc.moveDown();
  doc.fontSize(10).fillColor('gray').text('Gerado pelo sistema de Seed Antigravity.', 0, 700, { align: 'center' });

  doc.end();
}

console.log('PDFs gerados com sucesso!');
