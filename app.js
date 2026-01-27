const SUPABASE_URL = "https://tfkwctmewgsolcaphsbp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma3djdG1ld2dzb2xjYXBoc2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NzgzMTksImV4cCI6MjA4NDU1NDMxOX0.ovEcqdGAbL0e-3KIElG0gFTIsTpcmHo_FuVb_S1eVOg";
const STRIPE_PK = "pk_live_51SrWQV6ILDOjliDIgVHOujhKwwIvtl4zjH9BCCvh5c0U2sydcHKFIDAEdgmQZdCkRER1l9IydrEC5BYE5FLBYjVR00euV5fqz2";
const BE = "https://verify-backend-rzx1.onrender.com";
const PRICES = {
  single: 'price_1SrqvY6ILDOjliDIBaQcBzc3',
  premium: 'price_1StYL46ILDOjliDIe0KBxUqf',
  pro: 'price_1StYLe6ILDOjliDIZamQKL1Y',
  power: 'price_1StYMD6ILDOjliDI6gVqPr7J'
};

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
let stripe;
let currentUser = null;
let selectedFile = null;
let isLoginMode = true;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Stripe
  stripe = Stripe(STRIPE_PK);
  
  // Check session
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      currentUser = session.user;
      updateUIForLoggedInUser();
    }

    // Handle Stripe redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      showStatus('Payment successful! Your account has been upgraded.', false);
      window.history.replaceState({}, '', window.location.pathname);
    } else if (urlParams.get('canceled') === 'true') {
      showStatus('Payment canceled.', true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  });

  // Header buttons
  const signInBtn = document.getElementById('signInBtn');
  if (signInBtn) {
    signInBtn.addEventListener('click', function() {
      currentUser ? showProfile() : openAuthModal(true);
    });
  }

  const getStartedBtn = document.getElementById('getStartedBtn');
  if (getStartedBtn) {
    getStartedBtn.addEventListener('click', function() {
      currentUser ? scrollTo('upload') : openAuthModal(false);
    });
  }

  // Hero buttons
  const heroTryBtn = document.getElementById('heroTryBtn');
  if (heroTryBtn) {
    heroTryBtn.addEventListener('click', function() {
      scrollTo('upload');
    });
  }

  const heroPricingBtn = document.getElementById('heroPricingBtn');
  if (heroPricingBtn) {
    heroPricingBtn.addEventListener('click', function() {
      scrollTo('pricing');
    });
  }

  // Upload
  const uploadArea = document.getElementById('uploadArea');
  if (uploadArea) {
    uploadArea.addEventListener('click', function() {
      document.getElementById('fileInput').click();
    });
  }

  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }

  const scanBtn = document.getElementById('scanBtn');
  if (scanBtn) {
    scanBtn.addEventListener('click', handleScan);
  }

  // Pricing buttons
  const pricingFreeBtn = document.getElementById('pricingFreeBtn');
  if (pricingFreeBtn) {
    pricingFreeBtn.addEventListener('click', function() {
      scrollTo('upload');
    });
  }

  const buySingleBtn = document.getElementById('buySingleBtn');
  if (buySingleBtn) {
    buySingleBtn.addEventListener('click', function() {
      checkout(PRICES.single, 'payment');
    });
  }

  const buyPremiumBtn = document.getElementById('buyPremiumBtn');
  if (buyPremiumBtn) {
    buyPremiumBtn.addEventListener('click', function() {
      checkout(PRICES.premium, 'subscription');
    });
  }

  const buyProBtn = document.getElementById('buyProBtn');
  if (buyProBtn) {
    buyProBtn.addEventListener('click', function() {
      checkout(PRICES.pro, 'subscription');
    });
  }

  const buyPowerBtn = document.getElementById('buyPowerBtn');
  if (buyPowerBtn) {
    buyPowerBtn.addEventListener('click', function() {
      checkout(PRICES.power, 'subscription');
    });
  }

  // Auth modal
  const modalClose = document.getElementById('modalClose');
  if (modalClose) {
    modalClose.addEventListener('click', closeAuthModal);
  }

  const authToggle = document.getElementById('authToggle');
  if (authToggle) {
    authToggle.addEventListener('click', function() {
      isLoginMode = !isLoginMode;
      updateAuthModalUI();
    });
  }

  const authSubmitBtn = document.getElementById('authSubmitBtn');
  if (authSubmitBtn) {
    authSubmitBtn.addEventListener('click', handleAuth);
  }

  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.addEventListener('click', function(e) {
      if (e.target.id === 'authModal') closeAuthModal();
    });
  }

  // Profile
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  const changePasswordBtn = document.getElementById('changePasswordBtn');
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', handlePasswordChange);
  }

  const manageSubBtn = document.getElementById('manageSubBtn');
  if (manageSubBtn) {
    manageSubBtn.addEventListener('click', openCustomerPortal);
  }

  // Profile tabs
  document.querySelectorAll('.profile-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.profile-content').forEach(c => c.style.display = 'none');
      const tabContent = document.getElementById('tab-' + tab.dataset.tab);
      if (tabContent) {
        tabContent.style.display = 'block';
      }
    });
  });

  // FAQ accordion
  document.querySelectorAll('.faq-question').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
});

// Utility functions
function scrollTo(id) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

function showStatus(msg, isError) {
  const statusMsg = document.getElementById('statusMsg');
  if (statusMsg) {
    statusMsg.innerHTML = '<div class="msg ' + (isError ? 'error' : 'success') + '">' + msg + '</div>';
  }
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Auth functions
function openAuthModal(login) {
  isLoginMode = login;
  updateAuthModalUI();
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.classList.add('active');
  }
  const authMsg = document.getElementById('authMsg');
  if (authMsg) {
    authMsg.style.display = 'none';
  }
}

function closeAuthModal() {
  const authModal = document.getElementById('authModal');
  if (authModal) {
    authModal.classList.remove('active');
  }
  const authEmail = document.getElementById('authEmail');
  if (authEmail) {
    authEmail.value = '';
  }
  const authPassword = document.getElementById('authPassword');
  if (authPassword) {
    authPassword.value = '';
  }
  const authMsg = document.getElementById('authMsg');
  if (authMsg) {
    authMsg.style.display = 'none';
  }
}

function updateAuthModalUI() {
  const modalTitle = document.getElementById('modalTitle');
  if (modalTitle) {
    modalTitle.textContent = isLoginMode ? 'Sign In' : 'Create Account';
  }
  
  const modalSubtitle = document.getElementById('modalSubtitle');
  if (modalSubtitle) {
    modalSubtitle.textContent = isLoginMode ? 'Welcome back!' : 'Get started free.';
  }
  
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  if (authSubmitBtn) {
    authSubmitBtn.textContent = isLoginMode ? 'Sign In' : 'Create Account';
  }
  
  const authToggle = document.getElementById('authToggle');
  if (authToggle) {
    authToggle.textContent = isLoginMode ? "Don't have an account? Sign up" : 'Already have an account? Sign in';
  }
}

async function handleAuth() {
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const authMsg = document.getElementById('authMsg');
  
  if (!authEmail || !authPassword || !authMsg) return;
  
  const email = authEmail.value;
  const password = authPassword.value;

  if (!email || password.length < 8) {
    authMsg.textContent = 'Valid email and 8+ character password required';
    authMsg.className = 'msg error';
    authMsg.style.display = 'block';
    return;
  }

  try {
    if (isLoginMode) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentUser = data.user;
      closeAuthModal();
      updateUIForLoggedInUser();
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      authMsg.textContent = 'Check your email for verification link!';
      authMsg.className = 'msg success';
      authMsg.style.display = 'block';
    }
  } catch (error) {
    authMsg.textContent = error.message;
    authMsg.className = 'msg error';
    authMsg.style.display = 'block';
  }
}

function updateUIForLoggedInUser() {
  const signInBtn = document.getElementById('signInBtn');
  if (signInBtn) {
    signInBtn.textContent = 'My Account';
  }
  const getStartedBtn = document.getElementById('getStartedBtn');
  if (getStartedBtn) {
    getStartedBtn.textContent = 'Scan Now';
  }
}

async function handleLogout() {
  await supabase.auth.signOut();
  currentUser = null;
  const signInBtn = document.getElementById('signInBtn');
  if (signInBtn) {
    signInBtn.textContent = 'Sign In';
  }
  const getStartedBtn = document.getElementById('getStartedBtn');
  if (getStartedBtn) {
    getStartedBtn.textContent = 'Get Started';
  }
  const profile = document.getElementById('profile');
  if (profile) {
    profile.classList.remove('active');
  }
  window.location.reload();
}

// Profile functions
async function showProfile() {
  const profile = document.getElementById('profile');
  if (profile) {
    profile.classList.add('active');
    profile.scrollIntoView({ behavior: 'smooth' });
  }

  if (currentUser) {
    const profileEmail = document.getElementById('profileEmail');
    if (profileEmail) {
      profileEmail.textContent = currentUser.email;
    }
    const profileJoined = document.getElementById('profileJoined');
    if (profileJoined) {
      profileJoined.textContent = new Date(currentUser.created_at).toLocaleDateString();
    }
    await loadUserData();
    await loadScanHistory();
  }
}

async function loadUserData() {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) return;

    const response = await fetch(BE + '/user-info', {
      headers: { 'Authorization': 'Bearer ' + session.session.access_token }
    });

    if (response.ok) {
      const data = await response.json();
      const profilePlan = document.getElementById('profilePlan');
      if (profilePlan) {
        profilePlan.textContent = capitalizeFirst(data.planType || 'Free');
      }
      const profileScans = document.getElementById('profileScans');
      if (profileScans) {
        profileScans.textContent = data.scansRemaining ?? '--';
      }
      const subPlan = document.getElementById('subPlan');
      if (subPlan) {
        subPlan.textContent = capitalizeFirst(data.planType || 'Free');
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

async function loadScanHistory() {
  try {
    const { data: scans, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const tbody = document.getElementById('scanHistoryBody');
    if (!tbody) return;

    if (scans && scans.length > 0) {
      tbody.innerHTML = scans.map(function(scan) {
        return '<tr>' +
          '<td>' + new Date(scan.created_at).toLocaleDateString() + '</td>' +
          '<td>Image</td>' +
          '<td>' + Math.round(scan.score * 100) + '%</td>' +
          '<td><span class="scan-result-badge ' + (scan.is_ai ? 'ai' : 'human') + '">' +
            (scan.is_ai ? 'AI Generated' : 'Human Made') + '</span></td>' +
        '</tr>';
      }).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">No scans yet</td></tr>';
    }
  } catch (error) {
    console.error('Error loading scan history:', error);
  }
}

async function handlePasswordChange() {
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  const passwordMsg = document.getElementById('passwordMsg');
  
  if (!newPassword || !confirmPassword || !passwordMsg) return;

  if (newPassword.value.length < 8) {
    passwordMsg.innerHTML = '<div class="msg error">Password must be at least 8 characters</div>';
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordMsg.innerHTML = '<div class="msg error">Passwords do not match</div>';
    return;
  }

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value });
    if (error) throw error;
    passwordMsg.innerHTML = '<div class="msg success">Password updated successfully</div>';
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error) {
    passwordMsg.innerHTML = '<div class="msg error">' + error.message + '</div>';
  }
}

async function openCustomerPortal() {
  try {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session) {
      openAuthModal(true);
      return;
    }

    const response = await fetch(BE + '/create-portal-session', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + session.session.access_token,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Error: ' + (data.error || 'Could not open subscription portal'));
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

// File upload and scan
function handleFileSelect(e) {
  selectedFile = e.target.files[0];
  if (selectedFile) {
    const preview = document.getElementById('filePreview');
    if (!preview) return;
    
    preview.innerHTML = '<strong>' + selectedFile.name + '</strong> (' + (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB)';

    if (selectedFile.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(selectedFile);
      preview.appendChild(document.createElement('br'));
      preview.appendChild(img);
    }

    preview.style.display = 'block';
    const scanBtn = document.getElementById('scanBtn');
    if (scanBtn) {
      scanBtn.disabled = false;
      scanBtn.textContent = 'Analyze File';
    }
    const resultCard = document.getElementById('resultCard');
    if (resultCard) {
      resultCard.style.display = 'none';
    }
  }
}

async function handleScan() {
  if (!selectedFile) return;

  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    openAuthModal(true);
    return;
  }

  const scanBtn = document.getElementById('scanBtn');
  if (scanBtn) {
    scanBtn.disabled = true;
    scanBtn.textContent = 'Analyzing…';
  }

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const response = await fetch(BE + '/scan', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + session.session.access_token },
      body: formData
    });

    const data = await response.json();

    if (data.error) {
      if (data.error === 'SCAN_LIMIT_REACHED') {
        showStatus('Scan limit reached. <a href="#pricing">Upgrade your plan</a>', true);
      } else {
        throw new Error(data.error);
      }
      if (scanBtn) {
        scanBtn.disabled = false;
        scanBtn.textContent = 'Analyze File';
      }
      return;
    }

    // Show results
    const resultCard = document.getElementById('resultCard');
    const score = Math.round(data.aiScore * 100);

    const resultScore = document.getElementById('resultScore');
    if (resultScore) {
      resultScore.textContent = score + '%';
      resultScore.style.color = data.isAI ? 'var(--danger)' : 'var(--success)';
    }

    const resultVerdict = document.getElementById('resultVerdict');
    if (resultVerdict) {
      resultVerdict.textContent = data.isAI ? 'Likely AI-Generated' : 'Likely Human-Made';
      resultVerdict.style.color = data.isAI ? 'var(--danger)' : 'var(--success)';
    }

    if (resultCard) {
      resultCard.style.display = 'block';
    }

    if (data.scansRemaining !== undefined) {
      showStatus('Scans remaining: ' + data.scansRemaining, false);
    }

    if (scanBtn) {
      scanBtn.textContent = 'Scan Complete';
    }
  } catch (error) {
    showStatus(error.message, true);
    if (scanBtn) {
      scanBtn.disabled = false;
      scanBtn.textContent = 'Analyze File';
    }
  }
}

// Checkout
async function checkout(priceId, mode) {
  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    openAuthModal(true);
    return;
  }

  try {
    const response = await fetch(BE + '/create-checkout', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + session.session.access_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ priceId: priceId, mode: mode })
    });

    const data = await response.json();

    if (data.sessionId) {
      stripe.redirectToCheckout({ sessionId: data.sessionId });
    } else {
      alert('Checkout error: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    alert('Checkout error: ' + error.message);
  }
}
