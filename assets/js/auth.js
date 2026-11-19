/**
 * Authentication & Form Validation Logic
 * Handles Role Selection, Password Visibility, Validation, Supabase Auth & Demo Access
 */

document.addEventListener('DOMContentLoaded', () => {
  initRoleSelector();
  initPasswordToggles();
  initPasswordStrengthMeter();
  initLoginForm();
  initRegisterForm();
  initForgotPasswordModal();
  initDemoCredentials();
});

// Role Switcher
function initRoleSelector() {
  const roleOptions = document.querySelectorAll('.role-option');
  const roleInput = document.getElementById('selected-role');

  roleOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      roleOptions.forEach(r => r.classList.remove('active'));
      opt.classList.add('active');
      const role = opt.getAttribute('data-role');
      if (roleInput) {
        roleInput.value = role;
      }
      Toast.show(`Role selected: ${role.toUpperCase()}`, 'info', 'Role Changed', 2000);
    });
  });
}

// Password Visibility Toggle
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.setAttribute('aria-label', 'Hide password');
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
      } else {
        input.type = 'password';
        btn.setAttribute('aria-label', 'Show password');
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
      }
    });
  });
}

// Password Strength Meter
function initPasswordStrengthMeter() {
  const passwordInput = document.getElementById('reg-password');
  const strengthBar = document.getElementById('strength-bar');
  const strengthText = document.getElementById('strength-text');

  if (!passwordInput || !strengthBar || !strengthText) return;

  passwordInput.addEventListener('input', () => {
    const val = passwordInput.value;
    let score = 0;

    if (val.length >= 8) score += 25;
    if (/[A-Z]/.test(val)) score += 25;
    if (/[0-9]/.test(val)) score += 25;
    if (/[^A-Za-z0-9]/.test(val)) score += 25;

    strengthBar.style.width = score + '%';

    if (score === 0) {
      strengthBar.style.backgroundColor = 'transparent';
      strengthText.textContent = 'Password strength';
    } else if (score <= 25) {
      strengthBar.style.backgroundColor = 'var(--color-danger)';
      strengthText.textContent = 'Weak';
    } else if (score <= 50) {
      strengthBar.style.backgroundColor = 'var(--color-warning)';
      strengthText.textContent = 'Fair';
    } else if (score <= 75) {
      strengthBar.style.backgroundColor = 'var(--color-primary)';
      strengthText.textContent = 'Good';
    } else {
      strengthBar.style.backgroundColor = 'var(--color-success)';
      strengthText.textContent = 'Strong';
    }
  });
}

// Login Form Handling with Supabase Integration
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const role = document.getElementById('selected-role') ? document.getElementById('selected-role').value : 'patient';

    let isValid = true;

    // Validate email
    const emailError = document.getElementById('email-error');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = 'Please enter a valid email address.';
      emailError.classList.add('visible');
      isValid = false;
    } else {
      emailError.classList.remove('visible');
    }

    // Validate password
    const passwordError = document.getElementById('password-error');
    if (!password || password.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters.';
      passwordError.classList.add('visible');
      isValid = false;
    } else {
      passwordError.classList.remove('visible');
    }

    if (!isValid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Authenticating...';

    Toast.show('Verifying credentials...', 'info', 'Authentication');

    try {
      const res = await SupabaseService.signIn(email, password);

      if (res.success) {
        let userProfile = {
          name: email.split('@')[0],
          email: email,
          role: role,
          id: res.user ? res.user.id : 'demo-user',
          loginTime: new Date().toISOString()
        };

        // If real Supabase session, try to get profile row
        if (!res.isSimulated && res.user) {
          const profile = await SupabaseService.getProfile(res.user.id);
          if (profile) {
            userProfile.name = profile.full_name || userProfile.name;
            userProfile.role = profile.role || role;
          }
        }

        StorageHelper.set('med_app_user', userProfile);

        Toast.show('Welcome back! Redirecting to dashboard...', 'success', 'Login Successful');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Portal';
        Toast.show(res.error || 'Login failed. Please check credentials.', 'error', 'Authentication Failed');
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In to Portal';
      Toast.show(err.message || 'An unexpected error occurred.', 'error', 'Error');
    }
  });
}

// Registration Form Handling with Supabase Integration
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;
    const terms = document.getElementById('reg-terms').checked;
    const role = document.getElementById('selected-role') ? document.getElementById('selected-role').value : 'patient';

    let isValid = true;

    // Name check
    const nameError = document.getElementById('name-error');
    if (!name) {
      nameError.textContent = 'Please enter your full name.';
      nameError.classList.add('visible');
      isValid = false;
    } else {
      nameError.classList.remove('visible');
    }

    // Email check
    const emailError = document.getElementById('email-error');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.textContent = 'Please provide a valid email.';
      emailError.classList.add('visible');
      isValid = false;
    } else {
      emailError.classList.remove('visible');
    }

    // Password check
    const passwordError = document.getElementById('password-error');
    if (!password || password.length < 8) {
      passwordError.textContent = 'Password must be at least 8 characters.';
      passwordError.classList.add('visible');
      isValid = false;
    } else {
      passwordError.classList.remove('visible');
    }

    // Confirm password
    const confirmError = document.getElementById('confirm-error');
    if (password !== confirmPassword) {
      confirmError.textContent = 'Passwords do not match.';
      confirmError.classList.add('visible');
      isValid = false;
    } else {
      confirmError.classList.remove('visible');
    }

    // Terms check
    const termsError = document.getElementById('terms-error');
    if (!terms) {
      termsError.textContent = 'You must accept the terms of service.';
      termsError.classList.add('visible');
      isValid = false;
    } else {
      termsError.classList.remove('visible');
    }

    if (!isValid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    Toast.show('Provisioning account in Supabase...', 'info', 'Registration');

    try {
      const res = await SupabaseService.signUp(email, password, role, name);

      if (res.success) {
        const newUser = {
          name: name,
          email: email,
          role: role,
          id: res.user ? res.user.id : 'demo-user',
          registeredAt: new Date().toISOString()
        };
        StorageHelper.set('med_app_user', newUser);

        Toast.show('Account created successfully! Redirecting...', 'success', 'Registered');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1000);
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account & Enter Dashboard';
        Toast.show(res.error || 'Registration failed.', 'error', 'Registration Error');
      }
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account & Enter Dashboard';
      Toast.show(err.message || 'An error occurred during registration.', 'error', 'Error');
    }
  });
}

// Forgot Password Modal & Action
function initForgotPasswordModal() {
  const forgotLink = document.getElementById('forgot-password-link');
  const sendBtn = document.getElementById('send-reset-btn');
  const emailInput = document.getElementById('reset-email');

  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      Modal.open('forgot-password-modal');
      const loginEmail = document.getElementById('login-email');
      if (loginEmail && emailInput && loginEmail.value.trim()) {
        emailInput.value = loginEmail.value.trim();
      }
    });
  }

  if (sendBtn && emailInput) {
    sendBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        Toast.show('Please provide a valid email address.', 'error', 'Validation');
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';

      const res = await SupabaseService.resetPassword(email);

      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Recovery Link';
      Modal.close('forgot-password-modal');

      if (res.success) {
        Toast.show(res.message, 'success', 'Password Reset');
      } else {
        Toast.show(res.error || 'Failed to send reset link.', 'error', 'Error');
      }
    });
  }
}

// Quick Fill Demo Credentials (For College Evaluator / Student Demo)
function initDemoCredentials() {
  const patientBtn = document.getElementById('demo-patient-btn');
  const caregiverBtn = document.getElementById('demo-caregiver-btn');

  if (patientBtn) {
    patientBtn.addEventListener('click', () => {
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      const patientRole = document.querySelector('[data-role="patient"]');

      if (emailInput && passInput) {
        emailInput.value = 'patient.demo@medicare.local';
        passInput.value = 'Patient@1234';
        if (patientRole) patientRole.click();
        Toast.show('Filled demo Patient credentials', 'info', 'Demo Helper');
      }
    });
  }

  if (caregiverBtn) {
    caregiverBtn.addEventListener('click', () => {
      const emailInput = document.getElementById('login-email');
      const passInput = document.getElementById('login-password');
      const caregiverRole = document.querySelector('[data-role="caregiver"]');

      if (emailInput && passInput) {
        emailInput.value = 'caregiver.demo@medicare.local';
        passInput.value = 'Caregiver@1234';
        if (caregiverRole) caregiverRole.click();
        Toast.show('Filled demo Caregiver credentials', 'info', 'Demo Helper');
      }
    });
  }
}
