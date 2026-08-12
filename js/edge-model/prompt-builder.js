/**
 * Edge prompt builder — minimal for tiny smoke-test models (stories15M).
 */
var EdgePrompt = (() => {
  const SYSTEM = 'Continue briefly in French. One or two short sentences.';

  function tripContext() {
    return '';
  }

  function buildMessages(userText, history) {
    // stories15M is a completion toy — keep prompt tiny
    return [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: String(userText || '').slice(0, 200) },
    ];
  }

  return { SYSTEM, tripContext, buildMessages };
})();
