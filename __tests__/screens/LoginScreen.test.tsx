/**
 * LoginScreen Component Tests
 * Tests for login screen UI and functionality
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginScreen } from '../../src/screens/LoginScreen';
import { useAuthStore } from '../../src/stores/authStore';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock auth store
jest.mock('../../src/stores/authStore');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('LoginScreen', () => {
  let mockLogin: jest.Mock;
  let mockNavigation: any;

  beforeEach(() => {
    mockLogin = jest.fn();
    mockNavigation = {
      navigate: jest.fn(),
    };

    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      user: null,
      loading: false,
      error: null,
      initialized: true,
      setUser: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      signup: jest.fn(),
      logout: jest.fn(),
      initialize: jest.fn(),
      clearError: jest.fn(),
    });

    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render email and password inputs', () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      expect(getByTestId('email-input')).toBeTruthy();
      expect(getByTestId('password-input')).toBeTruthy();
    });

    it('should render login button', () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      expect(getByTestID('login-button')).toBeTruthy();
    });

    it('should render signup link', () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      expect(getByTestId('signup-link')).toBeTruthy();
    });

    it('should display correct title and subtitle', () => {
      const { getByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      expect(getByText('Welcome Back')).toBeTruthy();
      expect(getByText('Sign in to continue')).toBeTruthy();
    });
  });

  describe('User Interaction', () => {
    it('should update email input', () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const emailInput = getByTestId('email-input');
      fireEvent.changeText(emailInput, 'test@test.com');

      expect(emailInput.props.value).toBe('test@test.com');
    });

    it('should update password input', () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const passwordInput = getByTestId('password-input');
      fireEvent.changeText(passwordInput, 'password123');

      expect(passwordInput.props.value).toBe('password123');
    });

    it('should call login on button press with valid inputs', async () => {
      mockLogin.mockResolvedValue(undefined);

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@test.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
      });
    });

    it('should show alert when email is empty', async () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Please enter both email and password'
        );
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show alert when password is empty', async () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const emailInput = getByTestId('email-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@test.com');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Please enter both email and password'
        );
      });
      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should navigate to signup screen on link press', () => {
      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const signupLink = getByTestId('signup-link');
      fireEvent.press(signupLink);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
    });
  });

  describe('Error Handling', () => {
    it('should show alert on login error', async () => {
      const mockError = new Error('Invalid credentials');
      mockLogin.mockRejectedValue(mockError);

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@test.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Login Failed',
          'Invalid credentials'
        );
      });
    });
  });

  describe('Loading State', () => {
    it('should disable inputs while loading', async () => {
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { getByTestId } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@test.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // Inputs should be disabled during loading
      await waitFor(() => {
        expect(emailInput.props.editable).toBe(false);
        expect(passwordInput.props.editable).toBe(false);
        expect(loginButton.props.accessibilityState?.disabled).toBe(true);
      });
    });

    it('should show activity indicator while loading', async () => {
      mockLogin.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { getByTestId, queryByText } = render(
        <LoginScreen navigation={mockNavigation} />
      );

      const emailInput = getByTestId('email-input');
      const passwordInput = getByTestId('password-input');
      const loginButton = getByTestId('login-button');

      fireEvent.changeText(emailInput, 'test@test.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);

      // Login button text should not be visible
      await waitFor(() => {
        expect(queryByText('Login')).toBeNull();
      });
    });
  });
});

