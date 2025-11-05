document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
    });
  });

  // Parallax effect on scroll
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroBackground = document.querySelector('.hero-background');
    const heroContent = document.querySelector('.hero-content');
    window.requestAnimationFrame(() => {
      if (heroBackground) heroBackground.style.transform = `translateY(${scrolled * 0.5}px)`;
      if (heroContent){
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        heroContent.style.opacity = (1 - (scrolled * 0.001)).toString();
      }
    });
  });
});
