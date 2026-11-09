import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Presentation, PresentationFile } from '@oai/artifact-tool';

const ROOT=process.cwd();
const RUNTIME='/home/guimunhoz/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES ||= path.join(RUNTIME,'node/node_modules');
const SKILL='/home/guimunhoz/.codex/plugins/cache/openai-primary-runtime/presentations/26.1105.12137/skills/presentations';
const BUILD=path.join(ROOT,'.audit-local/2026-11-09/slides-prebanca');
const OUT=path.join(ROOT,'output/prebanca-lexnexo');
const REV=process.env.SLIDES_REV || 'v1';
const W=1280,H=720;
const C={bg:'#10131c',surface:'#171b28',ink:'#1c2333',paper:'#f5f2ea',text:'#f2eee2',muted:'#a7acc0',gold:'#c99a4b',line:'#404554'};
const F={title:'Fraunces 48pt',body:'DM Sans'};
await fs.mkdir(BUILD,{recursive:true});await fs.mkdir(OUT,{recursive:true});
const p=Presentation.create({slideSize:{width:W,height:H}});
const mark=await fs.readFile(path.join(ROOT,'frontend/public/icon-192.png'));
function txt(s,text,x,y,w,h,size=26,color=C.text,bold=false,font=F.body,align='left'){
 const shape=s.shapes.add({geometry:'textbox',name:text.slice(0,70),position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 shape.text=text;shape.text.style={typeface:font,fontSize:size,color,bold,alignment:align,verticalAlignment:'middle',autoFit:'none',wrap:'square',insets:0};return shape;
}
function logo(s,x,y,size){s.images.add({blob:mark,contentType:'image/png',alt:'Monograma original LexNexo',fit:'contain',position:{left:x,top:y,width:size,height:size}})}
function base(title,n){let s=p.slides.add();s.background.fill=C.bg;txt(s,title,76,50,1065,85,46,C.text,false,F.title);logo(s,1163,61,42);txt(s,'LexNexo',76,675,300,22,18,C.muted);txt(s,String(n).padStart(2,'0')+' / 06',1080,675,125,22,18,C.muted,false,F.body,'right');return s;}
function node(s,title,body,x,y,w,h){
 const box=s.shapes.add({geometry:'roundRect',name:'Entidade '+title,position:{left:x,top:y,width:w,height:h},fill:C.surface,line:{fill:C.line,width:1},borderRadius:10});
 txt(s,title,x+19,y+14,w-38,45,31,C.text,false,F.title);txt(s,body,x+19,y+65,w-38,h-75,23,C.muted);return box;
}
function link(s,a,b,label,x,y,w=90,from='right',to='left'){
 s.shapes.connect(a,b,{kind:from==='right'?'straight':'elbow',fromSide:from,toSide:to,line:{fill:C.gold,width:2},tail:{type:'triangle',width:'sm',length:'sm'}});
 if(label)txt(s,label,x,y,w,28,20,C.gold,false,F.body,'center');
}
function notes(s,body,source){s.speakerNotes.text=body+'\n\nFontes: '+source+'\nIdentidade visual: frontend/src/styles/design-system.css e assets/branding. Fontes DM Sans e Fraunces sob SIL OFL, em assets/branding/fonts.';}
// 1
{
 const s=p.slides.add();s.background.fill=C.bg;logo(s,76,74,74);
 txt(s,'LexNexo',76,195,650,140,105,C.text,false,F.title);
 txt(s,'Sistema web de gestão para\nescritórios de advocacia',80,341,650,110,34);
 txt(s,'TDS-2026-038',80,554,640,40,28,C.gold,true);
 txt(s,'Pré-banca de TCC 2026',80,599,620,31,23,C.muted);
 txt(s,'Guilherme Rossato Munhoz\nJoão Henrique Souza Sabino',795,211,410,100,28,C.text,true);
 txt(s,'Tecnologia em Desenvolvimento\nde Sistemas',795,340,410,85,25);
 txt(s,'Orientador\nProf. Sérgio Luiz Tonsig',795,470,410,69,21,C.muted);
 txt(s,'Coorientador\nProf. Francisco Antônio de Souza',795,557,410,74,21,C.muted);
 notes(s,'CLIPE 01. Guilherme, 00:00 a 00:35. Apresente o projeto, grupo 038, curso, integrantes e orientadores. Avance ao slide 2.\nRETORNO NO CLIPE 08. João, 19:15 a 19:45: retorne a esta capa, agradeça em nome dos dois e encerre. Os 15 segundos restantes são margem para corte e transição.','docs/tcc/ROTEIRO_VIDEO_PREBANCA_2026.md; identificação confirmada pelo proprietário.');
}
// 2
{
 const s=base('Organização da rotina do escritório',2);
 txt(s,'O problema',80,200,420,38,24,C.gold,true);
 txt(s,'Clientes em planilhas.\nPrazos em agendas.\nDocumentos em pastas.',80,251,410,151,29);
 txt(s,'Objetivo',80,455,420,38,24,C.gold,true);
 txt(s,'Reunir as informações do caso\ne apoiar o acompanhamento\nda equipe.',80,506,420,115,27);
 const bytes=await fs.readFile(path.join(ROOT,'docs/tcc/diagramas/print_dashboard.png'));
 s.images.add({blob:bytes,contentType:'image/png',alt:'Dashboard real do LexNexo com dados fictícios da demonstração local, captura de 28/10/2026',fit:'contain',position:{left:532,top:196,width:676,height:422}});
 txt(s,'Interface com dados fictícios. Captura de 28/10/2026.',533,630,675,26,18,C.muted);
 notes(s,'CLIPE 01. Guilherme, 00:35 a 03:00. Explique a fragmentação das informações, o objetivo, o público-alvo e a aplicação prática. Use o exemplo cliente, processo, prazo, documento e honorários. Identifique se a gravação usa base local ou sistema publicado. A captura é ilustrativa e datada; a demonstração real acontece no clipe 04. Avance ao slide 3.','docs/tcc/ROTEIRO_VIDEO_PREBANCA_2026.md; docs/tcc/diagramas/print_dashboard.png.');
}
// 3
{
 const s=base('Arquitetura do LexNexo',3);
 txt(s,'Visão dos containers e da comunicação',80,143,1120,40,25,C.muted);
 txt(s,'Equipe do escritório',80,206,330,35,25,C.gold);
 const front=node(s,'Interface','Next.js e React\nVercel',80,260,295,169);
 const api=node(s,'API REST','Django e DRF\nRender',495,260,295,169);
 const db=node(s,'Banco de dados','PostgreSQL\nSupabase',910,260,295,169);
 link(s,front,api,'REST / JSON',375,293,120);link(s,api,db,'ORM',790,293,120);
 const cols=[[80,'Cadastros','BrasilAPI e ViaCEP'],[385,'Andamentos','DataJud e DJEN'],[740,'IA','OpenAI'],[980,'Mensagens','SMTP e Web Push']];
 for(const [x,t,b] of cols){txt(s,t,x,490,270,31,22,C.gold,true);txt(s,b,x,530,285,36,23);}
 txt(s,'Documentos em armazenamento S3. Integrações dependem de configuração e disponibilidade.',80,608,1120,40,20,C.muted);
 notes(s,'CLIPE 02. Guilherme, 03:00 a 04:00: destaque o frontend, a organização em páginas, componentes e serviços e a comunicação HTTP com a API. Termine passando a palavra a João.\nCLIPE 03. João, 04:00 a 05:00: use o mesmo slide para explicar API, ORM, banco e implantação. Justifique as tecnologias. Depois avance ao slide 4.\nO diagrama é um recorte C2 para apresentação. C1, C2, C3 e implantação completos estão separados no RT. A lista de integrações representa módulos implementados; não comprova recebimento de mensagens ou disponibilidade externa.','docs/tcc/diagramas/c4_containers.puml; frontend/package.json; backend/requirements.txt; docs/testes/evidencias/2026-11-09/publicacao.json.');
}
// 4
{
 const s=base('Modelo de dados e módulos',4);
 txt(s,'Recorte dos relacionamentos do caso',80,145,1120,38,25,C.muted);
 const cl=node(s,'Cliente','nome\nescritorio_id',80,242,210,145);
 const pr=node(s,'Processo','cliente_id\nescritorio_id',380,242,210,145);
 const co=node(s,'Contrato','processo_id\nvalor_total',680,242,210,145);
 const pa=node(s,'Parcela','contrato_id\nvalor e status',980,242,210,145);
 link(s,cl,pr,'1 : N',290,278,90);link(s,pr,co,'0 ou 1',590,278,90);link(s,co,pa,'1 : N',890,278,90);
 const ag=node(s,'Agenda','processo e data',255,478,225,119);
 const doc=node(s,'Documento','processo e arquivo',555,478,260,119);
 link(s,pr,ag,'1 : N',305,402,90,'bottom','top');link(s,pr,doc,'1 : N',610,402,90,'bottom','top');
 txt(s,'Módulos da API por domínio. Esquema compartilhado e escopo por escritório.',80,625,1120,37,24,C.text);
 notes(s,'CLIPE 03. João, 05:00 a 06:00: explique os módulos de clientes, processos, agenda e financeiro e os vínculos deste recorte. Cada processo pertence a um cliente. Um processo pode ter zero ou um contrato; o contrato reúne suas parcelas. Eventos e documentos podem se vincular ao processo. O escritório orienta o escopo das consultas. O esquema é compartilhado; não afirmar esquemas separados nem RLS integral.\nAos 06:00, pare os slides e entre no clipe 04 do Guilherme, com o sistema real. Aos 12:00, corte para o editor do João no clipe 05. Os slides retornam apenas no clipe 07.','backend/advocacia/models.py, classes Cliente, Processo, Contrato, Parcela, Agenda e Documento; backend/advocacia/mixins.py.');
}
// 5
{
 const s=base('Resultados da auditoria',5);
 txt(s,'885',80,195,490,180,150,C.text,false,F.title);
 txt(s,'testes automatizados',85,389,520,51,32);
 const rows=[['Django','550'],['Jest','290'],['Playwright','45']];
 for(let i=0;i<rows.length;i++){txt(s,rows[i][0],700,214+i*72,260,53,29,C.muted);txt(s,rows[i][1],1020,209+i*72,185,60,43,C.gold,false,F.title,'right');}
 txt(s,'Cobertura de linhas',80,493,1120,39,24,C.gold,true);
 txt(s,'Backend 91,85%',80,543,420,48,31);txt(s,'Frontend 38,03%',525,543,440,48,31);
 txt(s,'Meta frontend: 70%',965,545,260,45,23,C.muted);
 txt(s,'Práticos publicados: 37 aprovados e 1 bloqueado na inspeção visual de PDF.',80,612,1120,38,23);
 txt(s,'Referência de 09/11/2026. Execuções e repetições entre ambientes não se somam.',80,652,1120,25,18,C.muted);
 notes(s,'CLIPE 07. Guilherme, 17:00 a 17:40. Volte a este slide após o bloco técnico e retome o problema inicial. Cite os resultados efetivamente demonstrados e a integração entre os módulos. As 885 aprovações são a referência da execução final: 550 Django, 290 Jest e 45 do runner Playwright, incluindo 44 cenários de navegador e um HTTP/proxy sem UI. A cobertura é de linhas, medida localmente; não se soma E2E à cobertura Jest. Os práticos têm 37 aprovações e um bloqueio de inspeção visual de aba blob pela ferramenta. A comparação binária independente passou. Passe o slide 6 para João.','docs/testes/evidencias/metricas-atuais.json; docs/testes/evidencias/2026-11-09/execucoes.json; docs/testes/evidencias/2026-11-09/praticos.json.');
}
// 6
{
 const s=base('Limites e evolução',6);
 txt(s,'Limites atuais',80,205,510,45,29,C.gold,true);
 txt(s,'Próximos passos',690,205,510,45,29,C.gold,true);
 const left=['Notificação automática ao cliente\n(RF52) no backlog.','Cobertura frontend abaixo\nda meta.','Entregas e operações externas\nainda exigem comprovação.','Recuperação em nuvem e\navaliação profissional pendentes.'];
 const right=['Ampliar os testes da interface.','Validar entrega das integrações.','Ensaiar a recuperação em nuvem.','Realizar avaliação com profissionais.'];
 for(let i=0;i<4;i++){txt(s,left[i],80,274+i*75,525,66,26);txt(s,right[i],690,274+i*75,525,66,26);}
 txt(s,'Dificuldades técnicas: isolamento por escritório e consistência financeira.',80,611,1120,42,24,C.muted);
 notes(s,'CLIPE 08. João, 17:40 a 19:15. Explique limitações, RF52, testes e integração externa. Diferencie geração/simulação PIX de confirmação bancária. Fale das dificuldades e dos aprendizados conforme a experiência real de vocês. A restauração local de 39 tabelas passou, mas não comprova recuperação integral em nuvem ou arquivos do storage. Como evolução, ampliar cobertura e avaliar o uso com profissionais.\nAos 19:15, retorne ao slide 1. Agradeça em nome dos dois e encerre até 19:45.','docs/testes/DEFEITOS_E_RISCOS.md; docs/testes/evidencias/2026-11-09/restauracao-local.json; docs/tcc/ROTEIRO_VIDEO_PREBANCA_2026.md.');
}
for(const [i,s] of p.slides.items.entries()){
 const blob=await p.export({slide:s,format:'png',scale:1.5});await fs.writeFile(path.join(BUILD,`slide-${i+1}-${REV}.png`),new Uint8Array(await blob.arrayBuffer()));
}
const candidate=path.join(BUILD,`candidate-${REV}.pptx`);await(await PresentationFile.exportPptx(p)).save(candidate);
const {finalizePresentation}=await import(pathToFileURL(path.join(SKILL,'container_tools/artifact_tool_utils.mjs')).href);
const finalPath=path.join(OUT,`LexNexo_PreBanca_${REV}.pptx`);
const result=await finalizePresentation({workspaceDir:ROOT,candidatePath:candidate,finalPath,pythonExecutable:path.join(RUNTIME,'python/bin/python3'),integrityValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(SKILL,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],explicitTotalSlideCount:6,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:[F.title,F.body]},verifyArtifactToolImport:true,receiptPath:path.join(BUILD,`validation-${REV}.json`)});
await fs.copyFile(finalPath,path.join(ROOT,'docs/tcc/TDS-2026-038_Apresentacao_PreBanca_LexNexo.pptx'));
const run=promisify(execFile);
const publicDeck=path.join(ROOT,'docs/tcc/TDS-2026-038_Apresentacao_PreBanca_LexNexo.pptx');
await run(path.join(RUNTIME,'bin/override/soffice'),['-env:UserInstallation='+pathToFileURL(path.join(BUILD,'lo-profile')).href,'--headless','--convert-to','pdf','--outdir',BUILD,publicDeck],{timeout:120000});
await fs.copyFile(path.join(BUILD,'TDS-2026-038_Apresentacao_PreBanca_LexNexo.pdf'),publicDeck.replace(/\.pptx$/,'.pdf'));
console.log(JSON.stringify({finalPath,result},null,2));
