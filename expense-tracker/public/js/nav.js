// Wires up the shared app shell: mobile sidebar toggle, user chip, logout.

function initLayout(user) {
  const chip = document.getElementById('userChip');
  if (chip && user) {
    const avatar = chip.querySelector('.avatar');
    const nameEl = chip.querySelector('.user-name');
    if (avatar) {
      avatar.textContent = initials(user.name);
      avatar.style.background = user.avatarColor || '#4f46e5';
    }
    if (nameEl) nameEl.textContent = user.name;
  }

  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');

  function openSidebar() {
    sidebar.classList.add('open');
    backdrop.classList.add('open');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
  }

  if (menuToggle) menuToggle.addEventListener('click', openSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  document.querySelectorAll('.sidebar-nav a').forEach((link) => {
    link.addEventListener('click', closeSidebar);
  });

  const logoutBtns = document.querySelectorAll('[data-action="logout"]');
  logoutBtns.forEach((btn) => btn.addEventListener('click', logoutUser));

  // Highlight active nav link based on current path
  const path = window.location.pathname.split('/').pop() || 'dashboard.html';
  document.querySelectorAll('.sidebar-nav a').forEach((link) => {
    if (link.getAttribute('href') === path) {
      link.classList.add('active');
    }
  });
}
