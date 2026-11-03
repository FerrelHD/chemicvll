import assert from 'node:assert';

console.log('Testing Auto-Save Persist Across All Stores with Mock LocalStorage...');

// Mock localStorage for Node test runner
const mockStorage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => mockStorage.set(key, String(value)),
  removeItem: (key: string) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

// Now import the stores
async function runTests() {
  const { useCareerStore } = await import('../../stores/useCareerStore');
  const { useTaskStore } = await import('../../stores/useTaskStore');
  const { useFinanceStore } = await import('../../stores/useFinanceStore');
  const { useDropzoneStore } = await import('../../stores/useDropzoneStore');
  const { useDevStore } = await import('../../stores/useDevStore');

  // Test 1: Career Store persistence
  useCareerStore.getState().addItem({
    entity_name: 'Tech Corp',
    role_or_program: 'Software Engineer',
    category: 'job',
    stage: 'applied',
    applied_date: '2026-11-01',
    deadline: null,
    platform_source: 'LinkedIn',
    work_type: 'remote',
    location: 'Jakarta',
    resume_version: 'CV_2026.pdf',
    stipend_or_salary: '15.000.000',
    contact_person: 'HR',
    next_follow_up_date: null,
    portal_url: null,
    notes: 'First test application',
  });
  const careerRaw = mockStorage.get('chemicvll-career-storage');
  assert.ok(careerRaw, 'Career storage must be written to localStorage');
  const parsedCareer = JSON.parse(careerRaw!);
  assert.strictEqual(parsedCareer.state.items[0].entity_name, 'Tech Corp');
  console.log('Test 1 Passed: useCareerStore auto-saves to localStorage');

  // Test 2: Task Store persistence
  useTaskStore.getState().addTask('Prepare for Interview', 1, true);
  const taskRaw = mockStorage.get('chemicvll-task-storage');
  assert.ok(taskRaw, 'Task storage must be written to localStorage');
  const parsedTask = JSON.parse(taskRaw!);
  assert.strictEqual(parsedTask.state.tasks[0].title, 'Prepare for Interview');
  console.log('Test 2 Passed: useTaskStore auto-saves to localStorage');

  // Test 3: Finance Store persistence
  useFinanceStore.getState().addWallet({
    name: 'Bank Jago',
    type: 'bank',
    balance: 1500000,
    color: '#7C3AED',
    card_label: 'Kantong Utama',
    account_number: '1234',
    holder_name: 'FERREL',
    expiry: '10/28',
  });
  const financeRaw = mockStorage.get('chemicvll-finance-storage');
  assert.ok(financeRaw, 'Finance storage must be written to localStorage');
  const parsedFinance = JSON.parse(financeRaw!);
  const jago = parsedFinance.state.wallets.find((w: any) => w.name === 'Bank Jago');
  assert.ok(jago, 'Bank Jago wallet must be saved');
  assert.strictEqual(jago.balance, 1500000);
  console.log('Test 3 Passed: useFinanceStore auto-saves to localStorage');

  // Test 4: Dropzone Store persistence
  useDropzoneStore.getState().addItem('https://github.com/FerrelHD/chemicvll', 'link');
  const dropzoneRaw = mockStorage.get('chemicvll-dropzone-storage');
  assert.ok(dropzoneRaw, 'Dropzone storage must be written to localStorage');
  const parsedDropzone = JSON.parse(dropzoneRaw!);
  assert.strictEqual(parsedDropzone.state.items[0].content, 'https://github.com/FerrelHD/chemicvll');
  console.log('Test 4 Passed: useDropzoneStore auto-saves to localStorage');

  // Test 5: Dev Store persistence
  useDevStore.getState().addProject({
    name: 'Go Microservice',
    description: 'API Gateway',
    status: 'active',
    color_code: '#00ADD8',
    repo_url: null,
    prod_url: null,
    local_path: 'C:\\dev\\go',
    start_command: 'go run main.go',
    default_port: 8080,
    target_date: null,
  });
  const devRaw = mockStorage.get('chemicvll-dev-storage');
  assert.ok(devRaw, 'Dev storage must be written to localStorage');
  const parsedDev = JSON.parse(devRaw!);
  const goProj = parsedDev.state.projects.find((p: any) => p.name === 'Go Microservice');
  assert.ok(goProj, 'Go project must be saved');
  assert.strictEqual(goProj.default_port, 8080);
  console.log('Test 5 Passed: useDevStore auto-saves to localStorage');

  console.log('All 5 stores verified: Auto-Save persist works 100% reliably!');
}

runTests();
