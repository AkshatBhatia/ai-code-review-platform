/**
 * Mock components factory to avoid Jest scope issues
 * These are used in test mocks to avoid referencing React in jest.mock() factories
 */

// Simple mock component factories that don't require React in scope
export const mockPrimerComponents = () => ({
  Box: 'div',
  Textarea: 'textarea', 
  Button: 'button',
  ActionList: 'ul',
  'ActionList.Item': 'li',
  'ActionList.TrailingAction': 'button',
  Avatar: 'img',
  BranchName: 'span',
  Link: 'a',
  Text: 'span',
  Spinner: 'div',
  Octicon: 'span'
});

export const mockRecoilComponents = () => ({
  RecoilRoot: 'div',
  useRecoilValue: () => null,
  useRecoilState: () => [null, () => {}],
  useSetRecoilState: () => () => {},
  atom: () => ({}),
  selector: () => ({})
});

// Mock component creators that use React.createElement to avoid JSX scope issues
export const createMockComponent = (displayName: string) => {
  const MockComponent = (props: any) => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': `mock-${displayName.toLowerCase()}`,
      ...props
    }, props.children);
  };
  MockComponent.displayName = `Mock${displayName}`;
  return MockComponent;
};

export const createMockInputComponent = (testId: string) => {
  const MockInput = (props: any) => {
    const React = require('react');
    return React.createElement('textarea', {
      'data-testid': testId,
      onChange: props.onChange || (() => {}),
      value: props.value || '',
      ...props
    });
  };
  return MockInput;
};

export const createMockButtonComponent = (testId: string) => {
  const MockButton = (props: any) => {
    const React = require('react');
    return React.createElement('button', {
      'data-testid': testId,
      onClick: props.onClick || (() => {}),
      disabled: props.disabled || false,
      ...props
    }, props.children || 'Button');
  };
  return MockButton;
};