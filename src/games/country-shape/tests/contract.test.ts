import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';

describeAdapterContract(env, {
  configs: [undefined, { target: 'BR' }],
  playouts: 4,
  maxSteps: 10,
  illegalActions: () => ['g:XX', 'g:', 'pass' as never],
});
