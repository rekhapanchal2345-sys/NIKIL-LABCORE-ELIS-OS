import { runner } from './framework';

// Import all tests to register them with the runner
import './auth.test';
import './billing.test';
import './enterprise-week3.test';
import './patient.test';
import './report.test';
import './sample.test';
import './astm-fsm-parser.test';

async function main() {
  const result = await runner.run();
  if (!result.success) {
    process.exit(1);
  }
}

main().catch(console.error);
