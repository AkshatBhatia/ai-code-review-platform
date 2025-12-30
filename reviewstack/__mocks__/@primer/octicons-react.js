/**
 * Mock for @primer/octicons-react
 */

const React = require('react');

// Create mock icon components
const createMockIcon = (name) => {
  const MockIcon = (props) => {
    return React.createElement('svg', {
      'data-testid': `icon-${name}`,
      ...props,
    });
  };
  MockIcon.displayName = name;
  return MockIcon;
};

module.exports = {
  LinkExternalIcon: createMockIcon('LinkExternalIcon'),
  TagIcon: createMockIcon('TagIcon'),
  PlusIcon: createMockIcon('PlusIcon'),
  CheckCircleIcon: createMockIcon('CheckCircleIcon'),
};
