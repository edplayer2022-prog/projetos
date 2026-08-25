const sidebar = document.querySelector('#sidebar');
const mobileMenu = document.querySelector('#mobileMenu');
const collapseButton = document.querySelector('#collapseSidebar');
const lessonButton = document.querySelector('#continueLesson');
const toast = document.querySelector('#toast');

mobileMenu.addEventListener('click', () => {
  const isOpen = sidebar.classList.toggle('open');
  mobileMenu.setAttribute('aria-expanded', String(isOpen));
});

collapseButton.addEventListener('click', () => {
  sidebar.classList.remove('open');
  mobileMenu.setAttribute('aria-expanded', 'false');
});

document.querySelectorAll('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelector('.nav-item.active')?.classList.remove('active');
    item.classList.add('active');
    if (window.innerWidth <= 760) sidebar.classList.remove('open');
  });
});

lessonButton.addEventListener('click', () => {
  toast.classList.add('show');
  lessonButton.innerHTML = '<span>✓</span> Aula iniciada';
  setTimeout(() => toast.classList.remove('show'), 3200);
});
