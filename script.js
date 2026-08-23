const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-nav');
const navLinks = document.querySelectorAll('nav a[href^="#"]');
const emailButton = document.querySelector('.email-button');
const toast = document.querySelector('.toast');
const lightbox = document.querySelector('.image-lightbox');
const lightboxImage = lightbox?.querySelector('img');
const lightboxCaption = lightbox?.querySelector('p');
const lightboxClose = lightbox?.querySelector('.lightbox-close');

function closeMenu() {
  menuToggle?.setAttribute('aria-expanded', 'false');
  if (mobileMenu) mobileMenu.hidden = true;
  document.body.classList.remove('menu-open');
}

menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  if (mobileMenu) mobileMenu.hidden = isOpen;
  document.body.classList.toggle('menu-open', !isOpen);
});

navLinks.forEach((link) => link.addEventListener('click', closeMenu));

window.addEventListener('scroll', () => {
  header?.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element);
});

document.querySelectorAll('.gallery-item').forEach((button) => {
  button.addEventListener('click', () => {
    const preview = button.querySelector('img');
    if (!lightbox || !lightboxImage || !lightboxCaption || !preview) return;

    lightboxImage.src = button.dataset.src ?? preview.src;
    lightboxImage.alt = preview.alt;
    lightboxCaption.textContent = button.dataset.caption ?? '';
    lightbox.showModal();
  });
});

lightboxClose?.addEventListener('click', () => lightbox?.close());

lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) lightbox.close();
});

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    document.querySelectorAll('.desktop-nav a').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-35% 0px -55%', threshold: 0 });

document.querySelectorAll('main section[id]').forEach((section) => {
  sectionObserver.observe(section);
});

emailButton?.addEventListener('click', async () => {
  const email = emailButton.dataset.email;

  try {
    await navigator.clipboard.writeText(email);
    const copyLabel = emailButton.querySelector('.copy-label');
    if (copyLabel) copyLabel.textContent = '복사 완료';
    toast?.classList.add('show');

    window.setTimeout(() => {
      toast?.classList.remove('show');
      if (copyLabel) copyLabel.textContent = '주소 복사';
    }, 1600);
  } catch {
    window.location.href = `mailto:${email}`;
  }
});

const year = document.querySelector('#year');
if (year) year.textContent = String(new Date().getFullYear());

window.addEventListener('resize', () => {
  if (window.innerWidth > 720) closeMenu();
});
