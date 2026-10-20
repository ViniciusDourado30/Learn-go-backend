import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: "postgresql://postgres.lydiqnfnbtjakovucxqc:Vinicius0506%23@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const VIDEOS = [
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ", 
  "https://www.youtube.com/watch?v=kJQP7kiw5Fk", 
  "https://www.youtube.com/watch?v=JGwWNGJdvx8", 
  "https://www.youtube.com/watch?v=9bZkp7q19f0", 
  "https://www.youtube.com/watch?v=RgKAFK5djSk", 
  "https://www.youtube.com/watch?v=OPf0YbXqDm0", 
  "https://www.youtube.com/watch?v=09R8_2nJtjg", 
  "https://www.youtube.com/watch?v=fRh_vgS2dFE", 
  "https://www.youtube.com/watch?v=YQHsXMglC9A", 
  "https://www.youtube.com/watch?v=V1bFr2SWP1I", 
];

async function main() {
  console.log("Expansão da Seed de Dados (LearnGo)...");

  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  
  const aulas = await prisma.aula.findMany({
    include: { modulo: { include: { curso: true } } }
  });
  console.log(`Encontradas ${aulas.length} aulas. Adicionando materiais, vídeos e dúvidas...`);

  const alunos = await prisma.user.findMany({ where: { role: 'ALUNO' } });
  const professores = await prisma.user.findMany({ where: { role: 'PROFESSOR' } });

  let vIdx = 0;
  for (const aula of aulas) {
    const videoUrl = VIDEOS[vIdx % VIDEOS.length];
    await prisma.aula.update({ where: { id: aula.id }, data: { video_url: videoUrl } });
    vIdx++;

    await prisma.materialAula.deleteMany({ where: { aulaId: aula.id } });
    
    for (let i = 1; i <= Math.floor(Math.random() * 3) + 1; i++) {
        const materialName = `Material_Aula_${aula.id.substring(0,4)}_${i}.pdf`;
        const materialPath = path.join(uploadsDir, materialName);
        fs.writeFileSync(materialPath, `Conteúdo simulado do ${materialName} referente a aula ${aula.titulo}.`);
        
        await prisma.materialAula.create({
            data: {
                aulaId: aula.id,
                nome: `Apostila ${i} - ${aula.titulo}`,
                url: `/uploads/${materialName}`,
            }
        });
    }

    await prisma.duvidaAula.deleteMany({ where: { aulaId: aula.id } });
    
    if (alunos.length > 0) {
        const numDuvidas = Math.floor(Math.random() * 4); 
        for (let d = 0; d < numDuvidas; d++) {
            const aluno = alunos[Math.floor(Math.random() * alunos.length)];
            const duvida = await prisma.duvidaAula.create({
                data: {
                    aulaId: aula.id,
                    alunoId: aluno.id,
                    texto: `Tenho uma dúvida sobre a aula de ${aula.titulo}. Como faço para aplicar o conceito demonstrado no minuto ${Math.floor(Math.random()*10)}:${Math.floor(Math.random()*59)}?`,
                    curtidas: Math.floor(Math.random() * 20)
                }
            });

            if (Math.random() > 0.4 && professores.length > 0) {
                const prof = professores[Math.floor(Math.random() * professores.length)];
                await prisma.respostaDuvida.create({
                    data: {
                        duvidaId: duvida.id,
                        autorId: prof.id,
                        texto: `Olá ${aluno.nome}! Excelente pergunta. Você pode baixar o material anexo nesta aula, lá tem um exemplo prático dessa exata situação.`,
                        is_teacher: true,
                        curtidas: Math.floor(Math.random() * 10)
                    }
                });
            }
        }
    }
  }

  const marcos = alunos.find(a => a.email === 'marcos.ferreira@aluno.com');
  if (marcos) {
    const matriculas = await prisma.matriculaCurso.findMany({ where: { alunoId: marcos.id } });
    for (const mat of matriculas) {
      const curso = await prisma.curso.findUnique({
        where: { id: mat.cursoId },
        include: { modulos: { include: { aulas: true } } }
      });
      
      let aulasConcluidas = 0;
      let totalAulas = 0;
      
      if (curso) {
        for (const mod of curso.modulos) {
            for (const aula of mod.aulas) {
                totalAulas++;
                if (Math.random() > 0.2) {
                    await prisma.progressoAula.upsert({
                        where: { alunoId_aulaId: { alunoId: marcos.id, aulaId: aula.id } },
                        update: { concluida: true },
                        create: { alunoId: marcos.id, aulaId: aula.id, concluida: true }
                    });
                    aulasConcluidas++;
                }
            }
        }
        
        const progressoPercent = totalAulas > 0 ? Math.round((aulasConcluidas / totalAulas) * 100) : 0;
        await prisma.matriculaCurso.update({
            where: { id: mat.id },
            data: { progresso: progressoPercent }
        });
      }
    }
  }

  console.log("Expansão concluída com sucesso!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
