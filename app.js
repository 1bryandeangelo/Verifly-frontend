const SUPABASE_URL = “https://tfkwctmewgsolcaphsbp.supabase.co”;
const SUPABASE_ANON_KEY = “eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRma3djdG1ld2dzb2xjYXBoc2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5NzgzMTksImV4cCI6MjA4NDU1NDMxOX0.ovEcqdGAbL0e-3KIElG0gFTIsTpcmHo_FuVb_S1eVOg”;
const STRIPE_PK = “pk_live_51SrWQV6ILDOjliDIgVHOujhKwwIvtl4zjH9BCCvh5c0U2sydcHKFIDAEdgmQZdCkRER1l9IydrEC5BYE5FLBYjVR00euV5fqz2”;
const BE = “https://verify-backend-rzx1.onrender.com”;
const PRICES = {
single: ‘price_1SrqvY6ILDOjliDIBaQcBzc3’,
starter: ‘price_1StYL46ILDOjliDIe0KBxUqf’,
pro: ‘price_1StYLe6ILDOjliDIZamQKL1Y’,
power: ‘price_1StYMD6ILDOjliDI6gVqPr7J’
};

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const stripe = Stripe(STRIPE_PK);

let currentUser = null;
let selectedFile = null;
let isLoginMode = true;

// Initialize on DOM ready
document.addEventListener(‘DOMContentLoaded’, function() {
// Check session
supabase.auth.getSession().then(({ data: { session } }) => {
if (session?.user) {
currentUser = session.user;
updateUIForLoggedInUser();
}
});

// Handle Stripe redirect
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get(‘success’) === ‘true’) {
showStatus(‘Payment successful! Your account has been upgraded.’, false);
window.history.replaceState({}, ‘’, window.location.pathname);
} else if (urlParams.get(‘canceled’) === ‘true’) {
showStatus(‘Payment canceled.’, true);
window.history.replaceState({}, ‘’, window.location.pathname);
}

// Bind events
bindEvents();
});

function bindEvents() {
// Header buttons
document.getElementById(‘signInBtn’).addEventListener(‘click’, function() {
currentUser ? showProfile() : openAuthModal(true);
});

document.getElementById(‘getStartedBtn’).addEventListener(‘click’, function() {
currentUser ? scrollTo(‘upload’) : openAuthModal(false);
});

// Hero buttons
document.getElementById(‘heroTryBtn’).addEventListener(‘click’, function() {
scrollTo(‘upload’);
});

document.getElementById(‘heroPricingBtn’).addEventListener(‘click’, function() {
scrollTo(‘pricing’);
});

// Upload
document.getElementById(‘uploadArea’).addEventListener(‘click’, function() {
document.getElementById(‘fileInput’).click();
});

document.getElementById(‘fileInput’).addEventListener(‘change’, handleFileSelect);
document.getElementById(‘scanBtn’).addEventListener(‘click’, handleScan);

// Pricing buttons
document.getElementById(‘pricingFreeBtn’).addEventListener(‘click’, function() {
scrollTo(‘upload’);
});

document.getElementById(‘buySingleBtn’).addEventListener(‘click’, function() {
checkout(PRICES.single, ‘payment’);
});

document.getElementById(‘buyStarterBtn’).addEventListener(‘click’, function() {
checkout(PRICES.starter, ‘subscription’);
});

document.getElementById(‘buyProBtn’).addEventListener(‘click’, function() {
checkout(PRICES.pro, ‘subscription’);
});

document.getElementById(‘buyPowerBtn’).addEventListener(‘click’, function() {
checkout(PRICES.power, ‘subscription’);
});

// Auth modal
document.getElementById(‘modalClose’).addEventListener(‘click’, closeAuthModal);

document.getElementById(‘authToggle’).addEventListener(‘click’, function() {
isLoginMode = !isLoginMode;
updateAuthModalUI();
});

document.getElementById(‘authSubmitBtn’).addEventListener(‘click’, handleAuth);

document.getElementById(‘authModal’).addEventListener(‘click’, function(e) {
if (e.target.id === ‘authModal’) closeAuthModal();
});

// Profile
document.getElementById(‘logoutBtn’).addEventListener(‘click’, handleLogout);
document.getElementById(‘changePasswordBtn’).addEventListener(‘click’, handlePasswordChange);
document.getElementById(‘manageSubBtn’).addEventListener(‘click’, openCustomerPortal);

// Profile tabs
document.querySelectorAll(’.profile-tab’).forEach(function(tab) {
tab.addEventListener(‘click’, function() {
document.querySelectorAll(’.profile-tab’).forEach(t => t.classList.remove(‘active’));
tab.classList.add(‘active’);
document.querySelectorAll(’.profile-content’).forEach(c => c.style.display = ‘none’);
document.getElementById(‘tab-’ + tab.dataset.tab).style.display = ‘block’;
});
});

// FAQ accordion
document.querySelectorAll(’.faq-question’).forEach(function(btn) {
btn.addEventListener(‘click’, function() {
const item = btn.parentElement;
const isOpen = item.classList.contains(‘open’);
document.querySelectorAll(’.faq-item’).forEach(i => i.classList.remove(‘open’));
if (!isOpen) item.classList.add(‘open’);
});
});
}

// Utility functions
function scrollTo(id) {
document.getElementById(id).scrollIntoView({ behavior: ‘smooth’ });
}

function showStatus(msg, isError) {
document.getElementById(‘statusMsg’).innerHTML = ‘<div class="msg ' + (isError ? 'error' : 'success') + '">’ + msg + ‘</div>’;
}

function capitalizeFirst(str) {
return str.charAt(0).toUpperCase() + str.slice(1);
}

// Auth functions
function openAuthModal(login) {
isLoginMode = login;
updateAuthModalUI();
document.getElementById(‘authModal’).classList.add(‘active’);
document.getElementById(‘authMsg’).style.display = ‘none’;
}

function closeAuthModal() {
document.getElementById(‘authModal’).classList.remove(‘active’);
document.getElementById(‘authEmail’).value = ‘’;
document.getElementById(‘authPassword’).value = ‘’;
document.getElementById(‘authMsg’).style.display = ‘none’;
}

function updateAuthModalUI() {
document.getElementById(‘modalTitle’).textContent = isLoginMode ? ‘Sign In’ : ‘Create Account’;
document.getElementById(‘modalSubtitle’).textContent = isLoginMode ? ‘Welcome back!’ : ‘Get started free.’;
document.getElementById(‘authSubmitBtn’).textContent = isLoginMode ? ‘Sign In’ : ‘Create Account’;
document.getElementById(‘authToggle’).textContent = isLoginMode ? “Don’t have an account? Sign up” : ‘Already have an account? Sign in’;
}

async function handleAuth() {
const email = document.getElementById(‘authEmail’).value;
const password = document.getElementById(‘authPassword’).value;
const msgEl = document.getElementById(‘authMsg’);

if (!email || password.length < 8) {
msgEl.textContent = ‘Valid email and 8+ character password required’;
msgEl.className = ‘msg error’;
msgEl.style.display = ‘block’;
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
msgEl.textContent = ‘Check your email for verification link!’;
msgEl.className = ‘msg success’;
msgEl.style.display = ‘block’;
}
} catch (error) {
msgEl.textContent = error.message;
msgEl.className = ‘msg error’;
msgEl.style.display = ‘block’;
}
}

function updateUIForLoggedInUser() {
document.getElementById(‘signInBtn’).textContent = ‘My Account’;
document.getElementById(‘getStartedBtn’).textContent = ‘Scan Now’;
}

async function handleLogout() {
await supabase.auth.signOut();
currentUser = null;
document.getElementById(‘signInBtn’).textContent = ‘Sign In’;
document.getElementById(‘getStartedBtn’).textContent = ‘Get Started’;
document.getElementById(‘profile’).classList.remove(‘active’);
window.location.reload();
}

// Profile functions
async function showProfile() {
document.getElementById(‘profile’).classList.add(‘active’);
document.getElementById(‘profile’).scrollIntoView({ behavior: ‘smooth’ });

if (currentUser) {
document.getElementById(‘profileEmail’).textContent = currentUser.email;
document.getElementById(‘profileJoined’).textContent = new Date(currentUser.created_at).toLocaleDateString();
await loadUserData();
await loadScanHistory();
}
}

async function loadUserData() {
try {
const { data: session } = await supabase.auth.getSession();
if (!session?.session) return;

```
const response = await fetch(BE + '/user-info', {
  headers: { 'Authorization': 'Bearer ' + session.session.access_token }
});

if (response.ok) {
  const data = await response.json();
  document.getElementById('profilePlan').textContent = capitalizeFirst(data.planType || 'Free');
  document.getElementById('profileScans').textContent = data.scansRemaining ?? '--';
  document.getElementById('subPlan').textContent = capitalizeFirst(data.planType || 'Free');
}
```

} catch (error) {
console.error(‘Error loading user data:’, error);
}
}

async function loadScanHistory() {
try {
const { data: scans, error } = await supabase
.from(‘scans’)
.select(’*’)
.eq(‘user_id’, currentUser.id)
.order(‘created_at’, { ascending: false })
.limit(20);

```
if (error) throw error;

const tbody = document.getElementById('scanHistoryBody');
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
```

} catch (error) {
console.error(‘Error loading scan history:’, error);
}
}

async function handlePasswordChange() {
const newPassword = document.getElementById(‘newPassword’).value;
const confirmPassword = document.getElementById(‘confirmPassword’).value;
const msgEl = document.getElementById(‘passwordMsg’);

if (newPassword.length < 8) {
msgEl.innerHTML = ‘<div class="msg error">Password must be at least 8 characters</div>’;
return;
}

if (newPassword !== confirmPassword) {
msgEl.innerHTML = ‘<div class="msg error">Passwords do not match</div>’;
return;
}

try {
const { error } = await supabase.auth.updateUser({ password: newPassword });
if (error) throw error;
msgEl.innerHTML = ‘<div class="msg success">Password updated successfully</div>’;
document.getElementById(‘newPassword’).value = ‘’;
document.getElementById(‘confirmPassword’).value = ‘’;
} catch (error) {
msgEl.innerHTML = ‘<div class="msg error">’ + error.message + ‘</div>’;
}
}

async function openCustomerPortal() {
try {
const { data: session } = await supabase.auth.getSession();
if (!session?.session) {
openAuthModal(true);
return;
}

```
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
```

} catch (error) {
alert(’Error: ’ + error.message);
}
}

// File upload and scan
function handleFileSelect(e) {
selectedFile = e.target.files[0];
if (selectedFile) {
const preview = document.getElementById(‘filePreview’);
preview.innerHTML = ‘<strong>’ + selectedFile.name + ‘</strong> (’ + (selectedFile.size / 1024 / 1024).toFixed(2) + ’ MB)’;

```
if (selectedFile.type.startsWith('image/')) {
  const img = document.createElement('img');
  img.src = URL.createObjectURL(selectedFile);
  preview.appendChild(document.createElement('br'));
  preview.appendChild(img);
}

preview.style.display = 'block';
document.getElementById('scanBtn').disabled = false;
document.getElementById('scanBtn').textContent = 'Analyze File';
document.getElementById('resultCard').style.display = 'none';
```

}
}

async function handleScan() {
if (!selectedFile) return;

const { data: session } = await supabase.auth.getSession();
if (!session?.session) {
openAuthModal(true);
return;
}

const scanBtn = document.getElementById(‘scanBtn’);
scanBtn.disabled = true;
scanBtn.textContent = ‘Analyzing…’;

try {
const formData = new FormData();
formData.append(‘file’, selectedFile);

```
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
  scanBtn.disabled = false;
  scanBtn.textContent = 'Analyze File';
  return;
}

// Show results
const resultCard = document.getElementById('resultCard');
const score = Math.round(data.aiScore * 100);

document.getElementById('resultScore').textContent = score + '%';
document.getElementById('resultScore').style.color = data.isAI ? 'var(--danger)' : 'var(--success)';
document.getElementById('resultVerdict').textContent = data.isAI ? 'Likely AI-Generated' : 'Likely Human-Made';
document.getElementById('resultVerdict').style.color = data.isAI ? 'var(--danger)' : 'var(--success)';

resultCard.style.display = 'block';

if (data.scansRemaining !== undefined) {
  showStatus('Scans remaining: ' + data.scansRemaining, false);
}

scanBtn.textContent = 'Scan Complete';
```

} catch (error) {
showStatus(error.message, true);
scanBtn.disabled = false;
scanBtn.textContent = ‘Analyze File’;
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
const response = await fetch(BE + ‘/create-checkout’, {
method: ‘POST’,
headers: {
‘Authorization’: ’Bearer ’ + session.session.access_token,
‘Content-Type’: ‘application/json’
},
body: JSON.stringify({ priceId: priceId, mode: mode })
});

```
const data = await response.json();

if (data.sessionId) {
  stripe.redirectToCheckout({ sessionId: data.sessionId });
} else {
  alert('Checkout error: ' + (data.error || 'Unknown error'));
}
```

} catch (error) {
alert(’Checkout error: ’ + error.message);
}
}
