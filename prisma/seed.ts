import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: "postgresql://postgres.lydiqnfnbtjakovucxqc:Vinicius0506%23@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// ─── Dados Fictícios ────────────────────────────────────────────────────────

const PROFESSORES_DATA = [
  {
    nome: 'Carlos', sobrenome: 'Mendes', email: 'carlos.mendes@learngo.com',
    pais: 'Brazil', estado: 'São Paulo', cidade: 'São Paulo',
    ocupacao: 'Especialista em Go & Cloud', idiomas: ['Português', 'Inglês'],
    especialidades: ['Go', 'Kubernetes', 'AWS', 'Microserviços'],
    sobre: 'Engenheiro de software com 12 anos de experiência em sistemas distribuídos e linguagem Go. Trabalhei na Google e startups de alto crescimento.',
    rating: 4.9, preco_medio: 120, foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=facearea&facepad=2&w=200&q=80',
  },
  {
    nome: 'Ana', sobrenome: 'Rodrigues', email: 'ana.rodrigues@learngo.com',
    pais: 'Brazil', estado: 'Rio de Janeiro', cidade: 'Rio de Janeiro',
    ocupacao: 'Desenvolvedora Full Stack & Mentora', idiomas: ['Português', 'Inglês', 'Espanhol'],
    especialidades: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    sobre: 'Desenvolvedora apaixonada por educação tech. Ex-instrutora da Alura com mais de 5000 alunos formados.',
    rating: 4.8, preco_medio: 95, foto_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=facearea&facepad=2&w=200&q=80',
  },
  {
    nome: 'David', sobrenome: 'Kim', email: 'david.kim@learngo.com',
    pais: 'United States', estado: 'California', cidade: 'San Francisco',
    ocupacao: 'Math & CS Professor', idiomas: ['Inglês', 'Coreano'],
    especialidades: ['Algoritmos', 'Estrutura de Dados', 'Cálculo', 'Python'],
    sobre: 'Professor universitário com PhD em Ciência da Computação pelo MIT. Especialista em preparação para entrevistas de big tech.',
    rating: 5.0, preco_medio: 180, foto_url: 'https://images.unsplash.com/photo-1487309078313-fad80c3ec1e5?crop=entropy&cs=tinysrgb&fit=facearea&facepad=2&w=200&q=80',
  },
  {
    nome: 'Sarah', sobrenome: 'Jenkins', email: 'sarah.jenkins@learngo.com',
    pais: 'United Kingdom', estado: 'England', cidade: 'London',
    ocupacao: 'UX/UI Designer & Professora', idiomas: ['Inglês', 'Francês'],
    especialidades: ['Figma', 'Design Systems', 'UX Research', 'Prototipagem'],
    sobre: 'Designer sênior com passagem por Spotify, Airbnb e agências criativas europeias. Ensino design centrado no usuário de forma prática.',
    rating: 4.7, preco_medio: 140, foto_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=facearea&facepad=2&w=200&q=80',
  },
  {
    nome: 'Rafael', sobrenome: 'Oliveira', email: 'rafael.oliveira@learngo.com',
    pais: 'Brazil', estado: 'Minas Gerais', cidade: 'Belo Horizonte',
    ocupacao: 'DevOps Engineer & Instrutor', idiomas: ['Português', 'Inglês'],
    especialidades: ['Docker', 'CI/CD', 'Linux', 'Terraform'],
    sobre: 'Especialista em infraestrutura com experiência em pipelines de deploy de grandes empresas do setor financeiro.',
    rating: 4.6, preco_medio: 110, foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=facearea&facepad=2&w=200&q=80',
  },
  {
    nome: 'Yuki', sobrenome: 'Tanaka', email: 'yuki.tanaka@learngo.com',
    pais: 'Japan', estado: 'Tokyo', cidade: 'Tokyo',
    ocupacao: 'Data Scientist & IA Researcher', idiomas: ['Japonês', 'Inglês'],
    especialidades: ['Machine Learning', 'Python', 'TensorFlow', 'Pandas'],
    sobre: 'Pesquisadora de IA com publicações em conferências internacionais. Tornou complexos conceitos de ML acessíveis para mais de 8000 alunos.',
    rating: 4.9, preco_medio: 160, foto_url: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?crop=entropy&cs=tinysrgb&fit=facearea&facepad=2&w=200&q=80',
  },
  {
    nome: 'Leandro', sobrenome: 'Karnal', email: 'leandro.karnal@learngo.com',
    pais: 'Brazil', estado: 'São Paulo', cidade: 'Campinas',
    ocupacao: 'Historiador e Filósofo', idiomas: ['Português', 'Inglês', 'Espanhol', 'Francês'],
    especialidades: ['História', 'Filosofia', 'Ética', 'Sociedade'],
    sobre: 'Professor universitário, escritor e palestrante reconhecido no Brasil. Ministro aulas que unem o conhecimento histórico e reflexões filosóficas de forma acessível.',
    rating: 5.0, preco_medio: 300, foto_url: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?crop=entropy&cs=tinysrgb&fit=facearea&facepad=2&w=200&q=80',
  },
  {
    nome: 'Ludwig', sobrenome: 'Beethoven', email: 'ludwig.beethoven@learngo.com',
    pais: 'Germany', estado: 'North Rhine-Westphalia', cidade: 'Bonn',
    ocupacao: 'Compositor & Pianista', idiomas: ['Alemão', 'Italiano'],
    especialidades: ['Música Clássica', 'Piano', 'Teoria Musical', 'Composição'],
    sobre: 'Mestre da música. Crio cursos para ensinar desde a técnica básica do piano até o avançado de composição para orquestras. A música é uma revelação.',
    rating: 4.8, preco_medio: 250, foto_url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?crop=entropy&cs=tinysrgb&fit=facearea&facepad=2&w=200&q=80',
  },
  {
    nome: 'Gordon', sobrenome: 'Ramsay', email: 'gordon.ramsay@learngo.com',
    pais: 'United Kingdom', estado: 'Scotland', cidade: 'Johnstone',
    ocupacao: 'Chef e Restaurateur', idiomas: ['Inglês', 'Francês'],
    especialidades: ['Gastronomia', 'Cozinha Internacional', 'Gestão de Restaurantes', 'Técnicas Culinárias'],
    sobre: 'Premiado com várias estrelas Michelin. Eu ensino a cozinha de verdade, sem frescuras. Se quer aprender a cozinhar em alto nível, este é o lugar.',
    rating: 4.7, preco_medio: 350, foto_url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?crop=entropy&cs=tinysrgb&fit=facearea&facepad=2&w=200&q=80',
  },
  {
    nome: 'Maiara', sobrenome: 'Rodrigues', email: 'maiara.rodrigues@learngo.com',
    pais: 'Brazil', estado: 'Paraná', cidade: 'Curitiba',
    ocupacao: 'Poliglota e Professora', idiomas: ['Inglês', 'Espanhol', 'Francês', 'Alemão', 'Mandarim'],
    especialidades: ['Inglês', 'Espanhol', 'Técnicas de Memorização', 'Conversação'],
    sobre: 'Especialista no aprendizado rápido de línguas. Falo 6 idiomas fluentes e crio métodos imersivos para você destravar sua fala em poucos meses.',
    rating: 4.9, preco_medio: 110, foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=facearea&facepad=2&w=200&q=80',
  },
];

const ALUNOS_DATA = [
  { nome: 'Marcos', sobrenome: 'Ferreira', email: 'marcos.ferreira@aluno.com', pais: 'Brazil', cidade: 'Curitiba', estado: 'Paraná' },
  { nome: 'Julia', sobrenome: 'Santos', email: 'julia.santos@aluno.com', pais: 'Brazil', cidade: 'Porto Alegre', estado: 'Rio Grande do Sul' },
  { nome: 'Pedro', sobrenome: 'Alves', email: 'pedro.alves@aluno.com', pais: 'Brazil', cidade: 'Fortaleza', estado: 'Ceará' },
  { nome: 'Larissa', sobrenome: 'Costa', email: 'larissa.costa@aluno.com', pais: 'Brazil', cidade: 'Brasília', estado: 'Distrito Federal' },
  { nome: 'Bruno', sobrenome: 'Lima', email: 'bruno.lima@aluno.com', pais: 'Brazil', cidade: 'Salvador', estado: 'Bahia' },
  { nome: 'Camila', sobrenome: 'Pereira', email: 'camila.pereira@aluno.com', pais: 'Brazil', cidade: 'Recife', estado: 'Pernambuco' },
  { nome: 'Lucas', sobrenome: 'Martins', email: 'lucas.martins@aluno.com', pais: 'Brazil', cidade: 'Manaus', estado: 'Amazonas' },
  { nome: 'Fernanda', sobrenome: 'Gomes', email: 'fernanda.gomes@aluno.com', pais: 'Brazil', cidade: 'Natal', estado: 'Rio Grande do Norte' },
];

const CURSOS_DATA = [
  {
    titulo: 'Go do Zero ao Profissional',
    descricao: 'Aprenda a linguagem Go (Golang) do absoluto zero até criar APIs robustas e microsserviços escaláveis. Abordagem prática com projetos reais.',
    preco: 197.00,
    categoria: 'Programação',
    capa_url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    professorIdx: 0,
    modulos: [
      { titulo: 'Fundamentos de Go', aulas: ['Instalação e Configuração do Ambiente', 'Tipos e Variáveis', 'Funções e Pacotes', 'Controle de Fluxo'] },
      { titulo: 'Structs e Interfaces', aulas: ['Definindo Structs', 'Métodos em Go', 'Interfaces e Polimorfismo', 'Composição'] },
      { titulo: 'Concorrência', aulas: ['Goroutines', 'Channels', 'Select Statement', 'Sync Package'] },
      { titulo: 'APIs REST com Go', aulas: ['Criando um servidor HTTP', 'Roteamento com Gin', 'Middleware e Autenticação', 'Conectando ao Banco de Dados'] },
    ],
  },
  {
    titulo: 'React & TypeScript na Prática',
    descricao: 'Construa aplicações web modernas e escaláveis com React 18 e TypeScript. Do componente ao deploy, passando por hooks, context, e gerenciamento de estado.',
    preco: 167.00,
    categoria: 'Programação',
    capa_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    professorIdx: 1,
    modulos: [
      { titulo: 'Fundamentos React', aulas: ['JSX e Componentes', 'Props e State', 'Event Handling', 'Listas e Chaves'] },
      { titulo: 'Hooks Avançados', aulas: ['useEffect e Ciclo de Vida', 'useContext', 'useReducer', 'Custom Hooks'] },
      { titulo: 'TypeScript no React', aulas: ['Tipando Props e State', 'Generics em Componentes', 'Tipos Utilitários', 'Integração com APIs'] },
      { titulo: 'Projeto Final', aulas: ['Arquitetura do Projeto', 'Gerenciamento de Estado com Zustand', 'Integração com Backend', 'Deploy na Vercel'] },
    ],
  },
  {
    titulo: 'Algoritmos e Estruturas de Dados',
    descricao: 'Prepare-se para entrevistas técnicas nas melhores empresas de tecnologia. Resolva problemas reais do LeetCode e entenda os fundamentos que todo dev precisa dominar.',
    preco: 247.00,
    categoria: 'Programação',
    capa_url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    professorIdx: 2,
    modulos: [
      { titulo: 'Complexidade e Análise', aulas: ['Big O Notation', 'Análise de Tempo e Espaço', 'Melhor e Pior Caso', 'Exercícios Práticos'] },
      { titulo: 'Arrays e Strings', aulas: ['Manipulação de Arrays', 'Sliding Window', 'Two Pointers', 'Problemas Clássicos'] },
      { titulo: 'Árvores e Grafos', aulas: ['Binary Trees', 'BFS e DFS', 'Grafos Dirigidos', 'Algoritmo de Dijkstra'] },
      { titulo: 'Programação Dinâmica', aulas: ['Memoização', 'Tabulation', 'Knapsack Problem', 'Longest Common Subsequence'] },
    ],
  },
  {
    titulo: 'UX/UI Design: Do Figma ao Produto',
    descricao: 'Aprenda a criar interfaces bonitas e funcionais com foco na experiência do usuário. Do wireframe ao protótipo interativo, com metodologias usadas pelas maiores empresas.',
    preco: 147.00,
    categoria: 'Design',
    capa_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    professorIdx: 3,
    modulos: [
      { titulo: 'Fundamentos de Design', aulas: ['Princípios de UI', 'Teoria das Cores', 'Tipografia', 'Grid e Espaçamento'] },
      { titulo: 'Figma Avançado', aulas: ['Components e Auto Layout', 'Variantes', 'Prototipagem Interativa', 'Design Tokens'] },
      { titulo: 'UX Research', aulas: ['User Interviews', 'Heurísticas de Nielsen', 'Testes de Usabilidade', 'Persona e Jornada'] },
      { titulo: 'Design System', aulas: ['Criando do Zero', 'Documentação', 'Handoff para Devs', 'Manutenção'] },
    ],
  },
  {
    titulo: 'Machine Learning com Python',
    descricao: 'Domine os algoritmos de Machine Learning mais utilizados e aprenda a resolver problemas reais com dados. Do pré-processamento ao deploy de modelos.',
    preco: 297.00,
    categoria: 'Programação',
    capa_url: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    professorIdx: 5,
    modulos: [
      { titulo: 'Python para Data Science', aulas: ['NumPy Essencial', 'Pandas na Prática', 'Visualização com Matplotlib', 'Seaborn Avançado'] },
      { titulo: 'Algoritmos Supervisionados', aulas: ['Regressão Linear', 'Árvores de Decisão', 'Random Forest', 'SVM'] },
      { titulo: 'Deep Learning', aulas: ['Redes Neurais', 'Backpropagation', 'TensorFlow & Keras', 'CNNs para Imagens'] },
      { titulo: 'Deploy de Modelos', aulas: ['FastAPI para ML', 'Containerização com Docker', 'Deploy no GCP', 'Monitoramento'] },
    ],
  },
  {
    titulo: 'DevOps na Prática: Docker, CI/CD e Kubernetes',
    descricao: 'Automatize, escale e monitore aplicações como um engenheiro sênior. Aprenda as ferramentas que toda empresa moderna usa em produção.',
    preco: 187.00,
    categoria: 'Programação',
    capa_url: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    professorIdx: 4,
    modulos: [
      { titulo: 'Docker Fundamentos', aulas: ['Containers vs VMs', 'Dockerfile', 'Docker Compose', 'Volumes e Redes'] },
      { titulo: 'CI/CD com GitHub Actions', aulas: ['Pipelines Básicos', 'Testes Automatizados', 'Deploy Automático', 'Secrets e Variáveis'] },
      { titulo: 'Kubernetes', aulas: ['Pods e Deployments', 'Services e Ingress', 'ConfigMaps e Secrets', 'HPA e Escalabilidade'] },
      { titulo: 'Observabilidade', aulas: ['Prometheus e Grafana', 'Logs com ELK Stack', 'Tracing com Jaeger', 'Alertas em Produção'] },
    ],
  },
  {
    titulo: 'História e Filosofia para a Vida',
    descricao: 'Uma viagem intelectual pelos principais pensadores e eventos da humanidade. Entenda o presente compreendendo o passado através das lentes da filosofia.',
    preco: 299.00,
    categoria: 'Humanidades',
    capa_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    professorIdx: 6,
    modulos: [
      { titulo: 'Filosofia Antiga', aulas: ['Sócrates e a Ética', 'A Caverna de Platão', 'Ética a Nicômaco', 'Estoicismo Diário'] },
      { titulo: 'Grandes Guerras', aulas: ['A Primeira Guerra', 'O Período Entreguerras', 'Segunda Guerra Mundial', 'Guerra Fria'] },
      { titulo: 'Modernidade Líquida', aulas: ['Zygmunt Bauman', 'Sociedade do Cansaço', 'O Impacto das Redes Sociais', 'Propósito e Ética'] },
    ],
  },
  {
    titulo: 'O Código da Música Clássica',
    descricao: 'Aprenda a tocar piano, interpretar partituras e compor com a maestria dos gigantes da música erudita.',
    preco: 500.00,
    categoria: 'Música',
    capa_url: 'https://images.unsplash.com/photo-1558556108-7b9586144e51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    professorIdx: 7,
    modulos: [
      { titulo: 'Piano Básico', aulas: ['Postura e Dedilhado', 'Leitura de Partitura', 'Acordes Fundamentais', 'Escalas Maiores e Menores'] },
      { titulo: 'Avançado', aulas: ['Sonata ao Luar', 'Técnicas de Composição', 'Harmonia Clássica', 'Improvisação'] },
    ],
  },
  {
    titulo: 'Gastronomia Nível Michelin',
    descricao: 'Deixe de ser amador e passe a cozinhar como um verdadeiro chef. Técnicas francesas, gestão de cortes e receitas de assinatura.',
    preco: 399.00,
    categoria: 'Culinária',
    capa_url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    professorIdx: 8,
    modulos: [
      { titulo: 'Fundamentos', aulas: ['Cortes de Faca', 'Mise en Place', 'Caldos e Fundos', 'Ovo Perfeito'] },
      { titulo: 'Carnes e Molhos', aulas: ['Selar Carnes', 'Molho Hollandaise', 'Ponto da Carne', 'Beef Wellington'] },
    ],
  },
  {
    titulo: 'Inglês Fluente em 6 Meses',
    descricao: 'Acelere seu aprendizado com métodos comprovados para retenção e imersão. Destrave sua língua e comece a falar naturalmente.',
    preco: 149.00,
    categoria: 'Idiomas',
    capa_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80',
    professorIdx: 9,
    modulos: [
      { titulo: 'Imersão', aulas: ['Como criar ambiente imersivo', 'Shadowing Technique', 'Pronúncia Nativa', 'Os 100 Phrasal Verbs Essenciais'] },
      { titulo: 'Prática Intensiva', aulas: ['Entrevistas de Emprego em Inglês', 'Listening com Podcasts', 'Escrevendo E-mails Profissionais', 'Idioms and Slangs'] },
    ],
  },
];

const COMENTARIOS_AVALIACOES = [
  'Excelente professor! Explica de forma clara e objetiva. Recomendo muito.',
  'Conteúdo muito bem estruturado. Aprendi muito mais do que esperava.',
  'As aulas práticas fizeram toda a diferença. Consegui aplicar no trabalho em semanas.',
  'Professor muito atencioso, responde todas as dúvidas rapidamente.',
  'Melhor curso que já fiz sobre o assunto. Vale cada centavo.',
  'Metodologia incrível. Difícil fica fácil com essa didática.',
  'Curso atualizado e com exemplos reais. Perfeito para o mercado de trabalho.',
  'Já recomendei para toda a minha equipe. Material excepcional.',
  'Consegui minha primeira vaga como dev após concluir este curso.',
  'Qualidade de ensino de universidade a um preço acessível.',
];

const DIAS_SEMANA = [1, 2, 3, 4, 5]; // Segunda a Sexta
const HORARIOS = ['08:00', '10:00', '14:00', '16:00', '18:00', '20:00'];

// ─── Função Principal ────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  const senha = await bcrypt.hash('senha123', 10);

  // ── 1. Criar Professores ─────────────────────────────────────────────────
  console.log('👨‍🏫 Criando professores...');
  const professoresUsers: any[] = [];
  const professoresProfiles: any[] = [];

  for (const p of PROFESSORES_DATA) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        nome: p.nome, sobrenome: p.sobrenome, email: p.email, password: senha,
        role: 'PROFESSOR', idade: Math.floor(Math.random() * 20) + 28,
        pais: p.pais, estado: p.estado, cidade: p.cidade, telefone: `+55 11 9${Math.floor(Math.random() * 90000000) + 10000000}`,
      },
    });

    const profile = await prisma.professorProfile.upsert({
      where: { userId: user.id },
      update: { rating: p.rating, total_reviews: Math.floor(Math.random() * 150) + 20 },
      create: {
        userId: user.id, nome: p.nome, sobrenome: p.sobrenome, idade: 30, pais: p.pais,
        estado: p.estado, cidade: p.cidade, ocupacao: p.ocupacao, sobre: p.sobre,
        foto_url: p.foto_url, idiomas: p.idiomas, especialidades: p.especialidades,
        rating: p.rating, total_reviews: Math.floor(Math.random() * 150) + 20,
        preco_medio: p.preco_medio, duracao_aula: 60, intervalo_aula: 15,
      },
    });

    professoresUsers.push(user);
    professoresProfiles.push(profile);
    console.log(`  ✓ Prof. ${p.nome} ${p.sobrenome}`);
  }

  // ── 2. Criar Alunos ──────────────────────────────────────────────────────
  console.log('\n🎓 Criando alunos...');
  const alunosUsers: any[] = [];

  for (const a of ALUNOS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        nome: a.nome, sobrenome: a.sobrenome, email: a.email, password: senha,
        role: 'ALUNO', idade: Math.floor(Math.random() * 15) + 18,
        pais: a.pais, estado: a.estado, cidade: a.cidade,
      },
    });

    await prisma.alunoProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id, nome: a.nome, sobrenome: a.sobrenome, idade: 20,
        pais: a.pais, estado: a.estado, cidade: a.cidade, ocupacao: 'Estudante',
        idioma: 'Português',
      },
    });

    alunosUsers.push(user);
    console.log(`  ✓ Aluno ${a.nome} ${a.sobrenome}`);
  }

  // ── 3. Criar Cursos ──────────────────────────────────────────────────────
  console.log('\n📚 Criando cursos com módulos e aulas...');
  const cursosCriados: any[] = [];

  const TECH_VIDEOS = [
    'https://www.youtube.com/watch?v=kqtD5dpn9C8',
    'https://www.youtube.com/watch?v=8hly31xKli0',
    'https://www.youtube.com/watch?v=PkZNo7MFOUg',
    'https://www.youtube.com/watch?v=zOjov-2OZ0E',
    'https://www.youtube.com/watch?v=rfscVS0vtbw',
    'https://www.youtube.com/watch?v=bMknfKXIFA8',
    'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
    'https://www.youtube.com/watch?v=mU6anWqZJcc',
    'https://www.youtube.com/watch?v=pQN-pnXPaVg',
    'https://www.youtube.com/watch?v=vLnPwxZdW4Y',
    'https://www.youtube.com/watch?v=bRyvMaJ3wXQ', // Beethoven 9th
    'https://www.youtube.com/watch?v=WJTWJbHIE9s', // History
    'https://www.youtube.com/watch?v=P4tPQY1D89E', // Cooking
    'https://www.youtube.com/watch?v=N4k-x2Q-Iok', // English learning
  ];

  for (const c of CURSOS_DATA) {
    const professor = professoresProfiles[c.professorIdx];

    // Verifica se o curso já existe
    const existing = await prisma.curso.findFirst({ where: { titulo: c.titulo } });
    if (existing) {
      cursosCriados.push(existing);
      console.log(`  ↩ Curso já existe: ${c.titulo}`);
      continue;
    }

    const curso = await prisma.curso.create({
      data: {
        titulo: c.titulo, descricao: c.descricao, preco: c.preco,
        categoria: c.categoria, capa_url: c.capa_url, professorId: professor.id,
        cliques: Math.floor(Math.random() * 500) + 50,
        modulos: {
          create: c.modulos.map((mod, modIdx) => ({
            titulo: mod.titulo, ordem: modIdx + 1,
            aulas: {
              create: mod.aulas.map((aulaTitle, aulaIdx) => {
                const duracao = Math.floor(Math.random() * 35) + 10; // entre 10 e 45 min
                const randomVideo = TECH_VIDEOS[Math.floor(Math.random() * TECH_VIDEOS.length)];
                return {
                  titulo: aulaTitle,
                  ordem: aulaIdx + 1,
                  video_url: randomVideo,
                  duracao_minutos: duracao,
                  materiais: {
                    create: Array.from({ length: Math.floor(Math.random() * 3) + 1 }).map((_, i) => ({
                      nome: i === 0 ? `Apostila - ${aulaTitle}.pdf` : i === 1 ? `Exercícios Práticos.pdf` : `Links Complementares.pdf`,
                      url: `http://localhost:3000/uploads/materials/aula_${Math.floor(Math.random() * 1000)}.pdf` // Vamos gerar isso externamente ou mockar links diferentes
                    }))
                  },
                  duvidas: {
                    create: Array.from({ length: Math.floor(Math.random() * 4) }).map(() => {
                      const alunoRand = alunosUsers[Math.floor(Math.random() * alunosUsers.length)];
                      const temResposta = Math.random() > 0.5;
                      const p = [
                        "Como eu faço para debugar isso de forma mais fácil?",
                        "Achei essa parte muito abstrata. Existe alguma analogia para explicar melhor?",
                        "Isso funciona no Windows e no Linux da mesma forma?",
                        "Alguém encontrou algum erro ao rodar o comando no minuto 5:00?",
                        "Professor, há alguma documentação recomendada para me aprofundar nisso?",
                        "Consegui fazer, mas meu código ficou com o triplo do tamanho haha",
                        "Alguém pode me explicar a linha 14 novamente?",
                        "Ainda se usa isso hoje em dia ou é só conceito base?"
                      ][Math.floor(Math.random() * 8)];
                      
                      return {
                        texto: p,
                        alunoId: alunoRand.id,
                        curtidas: Math.floor(Math.random() * 10),
                        respostas: temResposta ? {
                          create: [
                            {
                              texto: "Excelente pergunta! Recomendo olhar a documentação oficial para mais detalhes.",
                              autorId: professor.userId,
                              is_teacher: true,
                              curtidas: Math.floor(Math.random() * 5),
                            }
                          ]
                        } : undefined
                      }
                    })
                  }
                };
              }),
            },
          })),
        },
      },
    });

    cursosCriados.push(curso);
    console.log(`  ✓ Curso: ${c.titulo}`);
  }

  // ── 4. Matricular Alunos nos Cursos ──────────────────────────────────────
  console.log('\n📝 Matriculando alunos nos cursos...');
  for (const aluno of alunosUsers) {
    // Cada aluno se matricula em 2-4 cursos aleatórios
    const qtd = Math.floor(Math.random() * 3) + 2;
    const cursosShuffled = [...cursosCriados].sort(() => Math.random() - 0.5).slice(0, qtd);

    for (const curso of cursosShuffled) {
      try {
        await prisma.matriculaCurso.create({
          data: {
            alunoId: aluno.id, cursoId: curso.id,
            progresso: Math.floor(Math.random() * 80) + 10,
          },
        });
      } catch {
        // Ignora se já existe (unique constraint)
      }
    }
  }
  console.log('  ✓ Matrículas criadas');

  // ── 5. Criar Disponibilidade dos Professores ─────────────────────────────
  console.log('\n🗓️ Criando disponibilidade dos professores...');
  for (const prof of professoresProfiles) {
    // 3-5 dias por semana com 2-4 horários cada
    const diasDisponiveis = [...DIAS_SEMANA].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 3);

    for (const dia of diasDisponiveis) {
      const horariosDodia = [...HORARIOS].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 2) + 2);
      for (const hora of horariosDodia) {
        const [h, m] = hora.split(':').map(Number);
        const fimH = h + 1;
        await prisma.disponibilidadeBloco.create({
          data: {
            professorId: prof.id, dia_semana: dia,
            hora_inicio: hora, hora_fim: `${String(fimH).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
            preco: prof.preco_medio,
          },
        });
      }
    }
  }
  console.log('  ✓ Disponibilidades criadas');

  // ── 6. Criar Aulas Agendadas ─────────────────────────────────────────────
  console.log('\n📅 Criando aulas agendadas...');
  const statusOptions = ['CONFIRMADA', 'CONFIRMADA', 'CONFIRMADA', 'PENDENTE_PAGAMENTO'];
  const hoje = new Date();

  for (let i = 0; i < 15; i++) {
    const aluno = alunosUsers[i % alunosUsers.length];
    const profUser = professoresUsers[i % professoresUsers.length];
    const profProfile = professoresProfiles[i % professoresProfiles.length];
    const diasOffset = Math.floor(Math.random() * 30) - 10; // -10 a +20 dias
    const dataAula = new Date(hoje);
    dataAula.setDate(dataAula.getDate() + diasOffset);
    const hora = HORARIOS[i % HORARIOS.length];
    const [h] = hora.split(':').map(Number);

    await prisma.aulaAgendada.create({
      data: {
        alunoId: aluno.id, professorId: profProfile.id,
        data_aula: dataAula.toISOString().split('T')[0],
        hora_inicio: hora, hora_fim: `${String(h + 1).padStart(2, '0')}:00`,
        preco_cobrado: profProfile.preco_medio,
        assunto: ['Concorrência em Go', 'Hooks do React', 'Algoritmos de Grafo', 'Figma Components', 'Redes Neurais', 'Docker Swarm'][i % 6],
        link_reuniao: `https://meet.jit.si/learngo-${Math.random().toString(36).substring(7)}`,
        status: statusOptions[i % statusOptions.length],
      },
    });
  }
  console.log('  ✓ Aulas agendadas criadas');

  // ── 7. Criar Avaliações ──────────────────────────────────────────────────
  console.log('\n⭐ Criando avaliações...');
  for (const aluno of alunosUsers.slice(0, 6)) {
    for (let pi = 0; pi < Math.floor(Math.random() * 3) + 1; pi++) {
      const profProfile = professoresProfiles[pi % professoresProfiles.length];
      try {
        await prisma.avaliacao.create({
          data: {
            alunoId: aluno.id, professorId: profProfile.id,
            nota: Math.floor(Math.random() * 2) + 4, // 4 ou 5
            comentario: COMENTARIOS_AVALIACOES[Math.floor(Math.random() * COMENTARIOS_AVALIACOES.length)],
          },
        });
      } catch {
        // Ignora avaliação duplicada
      }
    }
  }

  // Recalcular ratings
  for (const prof of professoresProfiles) {
    const agg = await prisma.avaliacao.aggregate({
      where: { professorId: prof.id },
      _avg: { nota: true }, _count: { nota: true },
    });
    if (agg._count.nota > 0) {
      await prisma.professorProfile.update({
        where: { id: prof.id },
        data: {
          rating: Math.round((agg._avg.nota || 5) * 10) / 10,
          total_reviews: agg._count.nota,
        },
      });
    }
  }
  console.log('  ✓ Avaliações criadas e ratings recalculados');

  // ── 8. Criar Notificações de Exemplo ─────────────────────────────────────
  console.log('\n🔔 Criando notificações...');
  const notifExemplos = [
    { tipo: 'class', titulo: 'Aula confirmada', descricao: 'Sua aula foi confirmada para amanhã às 14:00. Boa sorte!' },
    { tipo: 'review', titulo: 'Nova avaliação recebida', descricao: 'Um aluno deixou 5 estrelas na sua avaliação. Continue o ótimo trabalho!' },
    { tipo: 'live', titulo: 'Lembrete de aula', descricao: 'Você tem uma aula em 30 minutos. Prepare seu ambiente!' },
    { tipo: 'message', titulo: 'Boas-vindas à Learn&Go!', descricao: 'Seu cadastro foi realizado com sucesso. Explore os cursos disponíveis.' },
  ];

  for (const user of [...professoresUsers, ...alunosUsers]) {
    const notif = notifExemplos[Math.floor(Math.random() * notifExemplos.length)];
    await prisma.notificacao.create({
      data: { userId: user.id, tipo: notif.tipo, titulo: notif.titulo, descricao: notif.descricao },
    });
  }
  console.log('  ✓ Notificações criadas');

  // ─── Resumo ─────────────────────────────────────────────────────────────
  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('📊 Resumo:');
  console.log(`  • ${professoresUsers.length} professores`);
  console.log(`  • ${alunosUsers.length} alunos`);
  console.log(`  • ${cursosCriados.length} cursos`);
  console.log(`  • Módulos, aulas, matrículas, agendamentos e avaliações criados`);
  console.log('\n🔑 Login de todos os usuários: senha123');
  console.log('   Exemplo professor: carlos.mendes@learngo.com');
  console.log('   Exemplo aluno: marcos.ferreira@aluno.com');
}

main()
  .catch((e) => { console.error('❌ Erro no seed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
