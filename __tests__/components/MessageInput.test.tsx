/**
 * MessageInput Component Tests
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MessageInput } from '../../src/components/MessageInput';

describe('MessageInput', () => {
  it('should render text input', () => {
    const mockOnSend = jest.fn();
    const { getByTestId } = render(<MessageInput onSend={mockOnSend} />);

    expect(getByTestId('message-input')).toBeTruthy();
  });

  it('should render send button', () => {
    const mockOnSend = jest.fn();
    const { getByTestId } = render(<MessageInput onSend={mockOnSend} />);

    expect(getByTestId('send-button')).toBeTruthy();
  });

  it('should call onSend with trimmed text when send button is pressed', () => {
    const mockOnSend = jest.fn();
    const { getByTestId } = render(<MessageInput onSend={mockOnSend} />);

    const input = getByTestId('message-input');
    const sendButton = getByTestId('send-button');

    fireEvent.changeText(input, '  Hello world  ');
    fireEvent.press(sendButton);

    expect(mockOnSend).toHaveBeenCalledWith('Hello world');
  });

  it('should clear input after sending', () => {
    const mockOnSend = jest.fn();
    const { getByTestId } = render(<MessageInput onSend={mockOnSend} />);

    const input = getByTestId('message-input');
    const sendButton = getByTestId('send-button');

    fireEvent.changeText(input, 'Hello world');
    fireEvent.press(sendButton);

    expect(input.props.value).toBe('');
  });

  it('should not call onSend when text is empty', () => {
    const mockOnSend = jest.fn();
    const { getByTestId } = render(<MessageInput onSend={mockOnSend} />);

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should not call onSend when text is only whitespace', () => {
    const mockOnSend = jest.fn();
    const { getByTestId } = render(<MessageInput onSend={mockOnSend} />);

    const input = getByTestId('message-input');
    const sendButton = getByTestId('send-button');

    fireEvent.changeText(input, '   ');
    fireEvent.press(sendButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should disable input when disabled prop is true', () => {
    const mockOnSend = jest.fn();
    const { getByTestId } = render(<MessageInput onSend={mockOnSend} disabled={true} />);

    const input = getByTestId('message-input');
    expect(input.props.editable).toBe(false);
  });

  it('should not call onSend when disabled', () => {
    const mockOnSend = jest.fn();
    const { getByTestId } = render(<MessageInput onSend={mockOnSend} disabled={true} />);

    const input = getByTestId('message-input');
    const sendButton = getByTestId('send-button');

    fireEvent.changeText(input, 'Hello');
    fireEvent.press(sendButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });
});

