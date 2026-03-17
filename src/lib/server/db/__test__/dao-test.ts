/**
 * DAO integration test — runs against :memory: SQLite
 * Usage: NODE_ENV=test npx tsx src/lib/server/db/__test__/dao-test.ts
 */

// Must set before importing anything that calls getDatabase()
process.env['NODE_ENV'] = 'test';

import { getDatabase, resetDatabase } from '../database.js';
import { CandidateDAO } from '../candidate-dao.js';
import { JobDAO } from '../job-dao.js';
import { AssessmentDAO } from '../assessment-dao.js';
import { SettingsDAO } from '../settings-dao.js';
import { ChatHistoryDAO } from '../chat-history-dao.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  PASS: ${label}`);
    passed++;
  } else {
    console.error(`  FAIL: ${label}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n[${name}]`);
}

// ── CandidateDAO ──────────────────────────────────────────────────────────────
section('CandidateDAO');
const candidateDAO = new CandidateDAO();

const newCandidate = candidateDAO.create({
  name: '张三',
  phone: '13800138000',
  email: 'zhangsan@example.com',
  position: '前端工程师',
  resumeText: '熟悉 Vue/React',
  skills: ['Vue', 'React', 'TypeScript'],
  experience: 3,
  education: '本科'
});
assert(newCandidate.id.length > 0, 'create: returns candidate with id');
assert(newCandidate.name === '张三', 'create: name matches');
assert(Array.isArray(newCandidate.skills) && newCandidate.skills.includes('Vue'), 'create: skills parsed');

const fetched = candidateDAO.getById(newCandidate.id);
assert(fetched !== undefined, 'getById: found candidate');
assert(fetched?.email === 'zhangsan@example.com', 'getById: email matches');

candidateDAO.update(newCandidate.id, { experience: 5, skills: ['Vue', 'React', 'TypeScript', 'Node.js'] });
const updated = candidateDAO.getById(newCandidate.id);
assert(updated?.experience === 5, 'update: experience updated');
assert(updated?.skills.length === 4, 'update: skills updated');

const searchResults = candidateDAO.search('张三');
assert(searchResults.length >= 1, 'search: found by name');
const searchEmail = candidateDAO.search('zhangsan');
assert(searchEmail.length >= 1, 'search: found by email substring');

const all = candidateDAO.getAll();
assert(all.length >= 1, 'getAll: returns at least one');

candidateDAO.delete(newCandidate.id);
const deleted = candidateDAO.getById(newCandidate.id);
assert(deleted === undefined, 'delete: candidate removed');

// ── JobDAO ────────────────────────────────────────────────────────────────────
section('JobDAO');
const jobDAO = new JobDAO();

const newJob = jobDAO.create({
  title: '前端工程师',
  department: '技术部',
  description: '负责前端开发',
  requirements: ['3年经验', '熟悉 Vue'],
  skills: ['Vue', 'TypeScript'],
  weights: [{ name: '技术能力', weight: 0.6, score: 0 }, { name: '沟通能力', weight: 0.4, score: 0 }]
});
assert(newJob.id.length > 0, 'create: returns job with id');
assert(newJob.title === '前端工程师', 'create: title matches');
assert(Array.isArray(newJob.requirements) && newJob.requirements.length === 2, 'create: requirements parsed');
assert(newJob.weights.length === 2, 'create: weights parsed');

const fetchedJob = jobDAO.getById(newJob.id);
assert(fetchedJob !== undefined, 'getById: found job');

jobDAO.update(newJob.id, { department: '产品部' });
const updatedJob = jobDAO.getById(newJob.id);
assert(updatedJob?.department === '产品部', 'update: department updated');

const allJobs = jobDAO.getAll();
assert(allJobs.length >= 1, 'getAll: returns at least one');

// ── AssessmentDAO ─────────────────────────────────────────────────────────────
section('AssessmentDAO');
const assessmentDAO = new AssessmentDAO();

// Re-create candidate and job for FK constraints
const c2 = candidateDAO.create({ name: '李四', phone: '', email: 'lisi@example.com', position: '后端', resumeText: '', skills: [], experience: 2, education: '硕士' });
const j2 = jobDAO.create({ title: '后端工程师', department: '技术部', description: '', requirements: [], skills: [], weights: [] });

const newAssessment = assessmentDAO.create({
  candidateId: c2.id,
  jobId: j2.id,
  scores: [{ name: '技术', weight: 1, score: 85 }],
  totalScore: 85,
  strengths: ['逻辑清晰'],
  weaknesses: ['沟通一般'],
  suggestions: ['加强表达'],
  aiProvider: 'openai'
});
assert(newAssessment.id.length > 0, 'create: returns assessment with id');
assert(newAssessment.totalScore === 85, 'create: totalScore matches');
assert(newAssessment.strengths[0] === '逻辑清晰', 'create: strengths parsed');

const fetchedAssessment = assessmentDAO.getById(newAssessment.id);
assert(fetchedAssessment !== undefined, 'getById: found assessment');

const byCandidate = assessmentDAO.getByCandidateId(c2.id);
assert(byCandidate.length === 1, 'getByCandidateId: found 1 result');

const byJob = assessmentDAO.getByJobId(j2.id);
assert(byJob.length === 1, 'getByJobId: found 1 result');

assessmentDAO.delete(newAssessment.id);
assert(assessmentDAO.getById(newAssessment.id) === undefined, 'delete: assessment removed');

// ── SettingsDAO ───────────────────────────────────────────────────────────────
section('SettingsDAO');
const settingsDAO = new SettingsDAO();

settingsDAO.set('ai_provider', 'openai');
settingsDAO.set('theme', 'light');

assert(settingsDAO.get('ai_provider') === 'openai', 'set/get: ai_provider correct');
assert(settingsDAO.get('theme') === 'light', 'set/get: theme correct');
assert(settingsDAO.get('nonexistent') === undefined, 'get: missing key returns undefined');

// upsert
settingsDAO.set('ai_provider', 'claude');
assert(settingsDAO.get('ai_provider') === 'claude', 'set: upsert works');

const allSettings = settingsDAO.getAll();
assert(typeof allSettings === 'object' && allSettings['theme'] === 'light', 'getAll: returns map');

// ── ChatHistoryDAO ────────────────────────────────────────────────────────────
section('ChatHistoryDAO');
const chatHistoryDAO = new ChatHistoryDAO();

const sessionId = 'session-001';
const msg1 = chatHistoryDAO.create(sessionId, { role: 'user', content: '你好' });
const msg2 = chatHistoryDAO.create(sessionId, { role: 'assistant', content: '您好，有什么可以帮您？' });

assert(msg1.id.length > 0, 'create: user message has id');
assert(msg2.role === 'assistant', 'create: assistant message role correct');

const history = chatHistoryDAO.getBySessionId(sessionId);
assert(history.length === 2, 'getBySessionId: returns 2 messages');
assert(history[0].content === '你好', 'getBySessionId: order correct (ASC)');

chatHistoryDAO.deleteSession(sessionId);
const afterDelete = chatHistoryDAO.getBySessionId(sessionId);
assert(afterDelete.length === 0, 'deleteSession: messages removed');

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} PASS, ${failed} FAIL`);
resetDatabase();
if (failed > 0) {
  process.exit(1);
}
