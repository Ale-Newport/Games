import { describeAdapterContract } from '../../../ai/protocols/contract-suite';
import { env } from '../ai-adapter';

describeAdapterContract(env, {
  configs: [undefined, { lang: 'es' }, { puzzle: 'en-3' }],
  playouts: 3,
  maxSteps: 20,
  illegalActions: () => ['g:NOPE+NOPE+NOPE+NOPE', 'pass' as never],
});
