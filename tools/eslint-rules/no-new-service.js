// Simple ESLint rule: disallow `new` for identifiers that end with "Service"
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow `new` expressions for classes that end with Service; prefer dependency injection',
      recommended: 'error',
    },
    schema: [],
    messages: {
      avoidNewService: 'Do not instantiate service classes with `new`. Use Dependency Injection (e.g., constructor injection) instead.'
    }
  },
  create(context) {
    return {
      NewExpression(node) {
        const callee = node.callee;
        if (callee && callee.type === 'Identifier' && /Service$/.test(callee.name)) {
          context.report({ node, messageId: 'avoidNewService' });
        }
      }
    };
  }
};