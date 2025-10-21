/**
 * MessageBubble Component Tests
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { MessageBubble } from '../../src/components/MessageBubble';
import { Message } from '../../src/types';

describe('MessageBubble', () => {
  const mockMessage: Message = {
    id: '1',
    text: 'Hello world',
    senderId: 'user1',
    timestamp: new Date('2025-01-20T10:30:00'),
    readBy: ['user1'],
  };

  it('should render message text', () => {
    const { getByText } = render(
      <MessageBubble message={mockMessage} isSent={true} />
    );

    expect(getByText('Hello world')).toBeTruthy();
  });

  it('should render timestamp', () => {
    const { getByText } = render(
      <MessageBubble message={mockMessage} isSent={true} />
    );

    // Timestamp should be formatted (e.g., "10:30 AM")
    expect(getByText(/\d{1,2}:\d{2}\s?(AM|PM)/i)).toBeTruthy();
  });

  it('should apply sent styles when isSent is true', () => {
    const { getByTestId } = render(
      <MessageBubble message={mockMessage} isSent={true} />
    );

    const bubble = getByTestId('message-bubble');
    expect(bubble).toBeTruthy();
  });

  it('should apply received styles when isSent is false', () => {
    const { getByTestId } = render(
      <MessageBubble message={mockMessage} isSent={false} />
    );

    const bubble = getByTestId('message-bubble');
    expect(bubble).toBeTruthy();
  });

  it('should show pending indicator for pending messages', () => {
    const pendingMessage: Message = {
      ...mockMessage,
      pending: true,
    };

    const { getByText } = render(
      <MessageBubble message={pendingMessage} isSent={true} />
    );

    // Pending icon should be shown
    expect(getByText('◷')).toBeTruthy();
  });

  it('should show failed indicator for failed messages', () => {
    const failedMessage: Message = {
      ...mockMessage,
      failed: true,
    };

    const { getByText } = render(
      <MessageBubble message={failedMessage} isSent={true} />
    );

    // Failed icon should be shown
    expect(getByText('!')).toBeTruthy();
  });

  it('should show checkmark for successfully sent messages', () => {
    const { getByText } = render(
      <MessageBubble message={mockMessage} isSent={true} />
    );

    // Success checkmark should be shown
    expect(getByText('✓')).toBeTruthy();
  });

  it('should not show status icon for received messages', () => {
    const { queryByText } = render(
      <MessageBubble message={mockMessage} isSent={false} />
    );

    // No status icons for received messages
    expect(queryByText('◷')).toBeNull();
    expect(queryByText('!')).toBeNull();
    expect(queryByText('✓')).toBeNull();
  });
});


