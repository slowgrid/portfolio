const menuToggle = document.querySelector('.menu-toggle');
const menuLabel = menuToggle?.querySelector('.sr-only');
const mobileMenu = document.querySelector('.mobile-nav');
const navLinks = document.querySelectorAll('.desktop-nav a[href^="#"], .mobile-nav a[href^="#"]');
const emailButton = document.querySelector('.email-button');
const toast = document.querySelector('.toast');
const lightbox = document.querySelector('.image-lightbox');
const lightboxImage = lightbox?.querySelector('img');
const lightboxCaption = lightbox?.querySelector('p');
const lightboxClose = lightbox?.querySelector('.lightbox-close');
let previewTrigger;
let toastTimer;

function closeMenu(restoreFocus = false) {
  menuToggle?.setAttribute('aria-expanded', 'false');
  if (menuLabel) menuLabel.textContent = '메뉴 열기';
  if (mobileMenu) mobileMenu.hidden = true;
  if (restoreFocus) menuToggle?.focus();
}

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  if (menuLabel) menuLabel.textContent = isOpen ? '메뉴 열기' : '메뉴 닫기';
  if (mobileMenu) mobileMenu.hidden = isOpen;
});

navLinks.forEach((link) => link.addEventListener('click', () => closeMenu()));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !lightbox?.open && menuToggle?.getAttribute('aria-expanded') === 'true') {
    closeMenu(true);
  }
});

document.querySelectorAll('.gallery-item').forEach((button) => {
  button.addEventListener('click', () => {
    const preview = button.querySelector('img');
    if (!lightbox || !lightboxImage || !lightboxCaption || !preview) return;

    previewTrigger = button;
    lightboxImage.src = preview.currentSrc || preview.src;
    lightboxImage.alt = preview.alt;
    lightboxCaption.textContent = button.dataset.caption ?? '';
    lightbox.showModal();
  });
});

lightboxClose?.addEventListener('click', () => lightbox?.close());
lightbox?.addEventListener('close', () => previewTrigger?.focus({ preventScroll: true }));

lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${entry.target.id}`;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });

document.querySelectorAll('main > section').forEach((section) => {
  sectionObserver.observe(section);
});

emailButton?.addEventListener('click', async () => {
  const email = emailButton.dataset.email;
  const copyLabel = emailButton.querySelector('.copy-label');
  const defaultLabel = '주소 복사';
  let copied = false;

  try {
    await navigator.clipboard.writeText(email);
    copied = true;
  } catch {
    // Clipboard access may be unavailable or denied; keep the address selectable.
  }
  window.clearTimeout(toastTimer);
  if (copyLabel) copyLabel.textContent = copied ? '복사 완료' : defaultLabel;
  if (toast) {
    toast.textContent = copied
      ? '이메일 주소를 복사했습니다.'
      : '복사하지 못했습니다. 이메일 주소를 직접 선택하거나 메일 보내기를 이용해 주세요.';
    toast.classList.add('show');
  }
  toastTimer = window.setTimeout(() => {
    toast?.classList.remove('show');
    if (copyLabel) copyLabel.textContent = defaultLabel;
  }, copied ? 2200 : 5000);
});

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

window.addEventListener('resize', () => {
  if (window.innerWidth > 720) closeMenu();
});
