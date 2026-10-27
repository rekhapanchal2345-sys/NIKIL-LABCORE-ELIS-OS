const assert = require('assert');
const { authenticateUser, requirePermission, AI_PERMISSIONS, USER_ROLES } = require('../src/middlewares/authMiddleware');

console.log("=================================================");
console.log("🧪 Starting LabCore ELIS Auth Middleware Test Suite...");
console.log("=================================================");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(err);
  }
}

// Helper to create mock request/response
function createMocks(headers = {}) {
  const req = { headers };
  const res = {
    statusCode: null,
    jsonData: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    }
  };
  const next = () => { req.nextCalled = true; };
  return { req, res, next };
}

runTest("authenticateUser - Valid Token (ADMIN)", () => {
  const { req, res, next } = createMocks({ authorization: 'Bearer some_token' });
  authenticateUser(req, res, next);

  assert.strictEqual(req.nextCalled, true);
  assert.ok(req.user);
  assert.strictEqual(req.user.role, 'ADMIN');
  assert.ok(req.user.permissions.includes(AI_PERMISSIONS.AI_TRAIN));
});

runTest("authenticateUser - Valid Token (PATHOLOGIST)", () => {
  const { req, res, next } = createMocks({ authorization: 'Bearer pathologist_token' });
  authenticateUser(req, res, next);

  assert.strictEqual(req.nextCalled, true);
  assert.ok(req.user);
  assert.strictEqual(req.user.role, 'PATHOLOGIST');
  assert.ok(req.user.permissions.includes(AI_PERMISSIONS.AI_PREDICT));
});

runTest("authenticateUser - Valid Token (RESEARCHER)", () => {
  const { req, res, next } = createMocks({ authorization: 'Bearer researcher_token' });
  authenticateUser(req, res, next);

  assert.strictEqual(req.nextCalled, true);
  assert.ok(req.user);
  assert.strictEqual(req.user.role, 'RESEARCHER');
  assert.ok(req.user.permissions.includes(AI_PERMISSIONS.AI_DEPLOY));
});

runTest("authenticateUser - Missing Token", () => {
  const { req, res, next } = createMocks();
  authenticateUser(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.jsonData.success, false);
  assert.strictEqual(res.jsonData.message, 'Authentication token required');
});

runTest("authenticateUser - Error handling (Exception in try block)", () => {
  // Pass a request object that will cause an error when trying to access headers
  const req = {
    get headers() {
      throw new Error("Simulated unexpected error");
    }
  };
  const res = {
    statusCode: null,
    jsonData: null,
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.jsonData = data;
      return this;
    }
  };
  const next = () => { req.nextCalled = true; };

  authenticateUser(req, res, next);

  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.jsonData.success, false);
  assert.strictEqual(res.jsonData.message, 'Authentication failed. Invalid or expired security token.');
  assert.strictEqual(req.nextCalled, undefined);
});

runTest("requirePermission - User has permission", () => {
  const { req, res, next } = createMocks();
  req.user = { permissions: [AI_PERMISSIONS.AI_TRAIN] };
  const middleware = requirePermission(AI_PERMISSIONS.AI_TRAIN);

  middleware(req, res, next);
  assert.strictEqual(req.nextCalled, true);
});

runTest("requirePermission - User lacks permission", () => {
  const { req, res, next } = createMocks();
  req.user = { permissions: [AI_PERMISSIONS.AI_VIEW] };
  const middleware = requirePermission(AI_PERMISSIONS.AI_TRAIN);

  middleware(req, res, next);
  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(res.jsonData.success, false);
  assert.strictEqual(res.jsonData.message, `Forbidden: User lacks '${AI_PERMISSIONS.AI_TRAIN}' permission to perform this AI operation.`);
});

runTest("requirePermission - Unauthenticated user", () => {
  const { req, res, next } = createMocks();
  // req.user is undefined
  const middleware = requirePermission(AI_PERMISSIONS.AI_TRAIN);

  middleware(req, res, next);
  assert.strictEqual(res.statusCode, 401);
  assert.strictEqual(res.jsonData.success, false);
  assert.strictEqual(res.jsonData.message, 'Unauthenticated user');
});

console.log("=================================================");
console.log(`📊 Auth Middleware Test Results: ${passedTests} / ${totalTests} Passed (${Math.round(passedTests/totalTests*100)}%)`);
console.log("=================================================");

if (passedTests !== totalTests) {
  process.exit(1);
}
