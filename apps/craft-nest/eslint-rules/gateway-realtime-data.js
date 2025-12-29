module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce realtime data flows through specific gateway patterns',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: null,
    schema: [],
  },
  create(context) {
    const GATEWAY_PATTERN = /(Gateway|Socket)$/;
    const REALTIME_METHOD_PATTERNS = /(emit|broadcast|send|push|notify)/i;
    
    return {
      // Check class methods that emit data but are not in gateway classes
      'MethodDefinition'(node) {
        // Skip if method name doesn't match realtime patterns
        if (!REALTIME_METHOD_PATTERNS.test(node.key.name)) {
          return;
        }

        // Get containing class name
        let className = null;
        let parent = node.parent;
        while (parent) {
          if (parent.type === 'ClassDeclaration' && parent.id) {
            className = parent.id.name;
            break;
          }
          parent = parent.parent;
        }

        // If we found a class name and it's not a Gateway/Socket
        if (className && !GATEWAY_PATTERN.test(className)) {
          context.report({
            node,
            message: 'Realtime data methods should only exist in Gateway classes. Move this to a proper Gateway class.',
          });
        }
      },
      
      // Check calls to socket.io methods outside of gateways
      'CallExpression[callee.property.name=/^(emit|broadcast|send)$/]'(node) {
        let inGateway = false;
        let parent = node.parent;
        
        while (parent) {
          if (
            parent.type === 'ClassDeclaration' && 
            parent.id && 
            GATEWAY_PATTERN.test(parent.id.name)
          ) {
            inGateway = true;
            break;
          }
          parent = parent.parent;
        }
        
        if (!inGateway) {
          context.report({
            node,
            message: 'Socket operations should only be performed within Gateway classes',
          });
        }
      }
    };
  }
};
