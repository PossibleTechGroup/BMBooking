const OnboardingView = (() => {
  let currentSlide = 0;

  const slides = [
    {
      heading: 'Welcome to BM',
      body: 'Book medical appointments, find trusted doctors, and manage your health — all from Telegram.',
      list: null,
    },
    {
      heading: 'Find & Book Doctors',
      body: null,
      list: [
        'Search doctors by name, specialty, or clinic',
        'Filter by rating, specialty, and distance',
        'View doctor profiles, fees, and availability',
        'Book for yourself or someone else',
        'Select your issue, describe symptoms, and upload referrals',
        'Pay securely with TeleBirr',
      ],
    },
    {
      heading: 'Manage Your Health',
      body: null,
      list: [
        'View all appointments in one place',
        'Cancel or reschedule appointments anytime',
        'Search and book medical equipment (MRI, CT Scan, X-Ray, and more)',
        'Rate and review doctors after your visit',
        'Call hospitals and get directions',
      ],
    },
    {
      heading: 'Your Profile, Your Way',
      body: null,
      list: [
        'Set up your health profile with blood type and emergency contact',
        'Manage notification and privacy settings',
        'Switch between standard and Ethiopian calendar',
        'View platform announcements and health updates',
      ],
    },
  ];

  function render(container) {
    TG.hideMainButton();
    container.innerHTML = `
      <div class="onboarding">
        <div class="onboarding-slides">
          ${slides.map((slide, i) => renderSlide(slide, i)).join('')}
        </div>
        <div class="onboarding-footer">
          <div class="onboarding-dots">
            ${slides.map((_, i) =>
              `<div class="onboarding-dot ${i === currentSlide ? 'active' : ''}" data-dot="${i}"></div>`
            ).join('')}
          </div>
          ${currentSlide === slides.length - 1
            ? `<button class="onboarding-btn onboarding-btn-primary" id="ob-action">Get Started</button>
               <button class="onboarding-skip" id="ob-skip">Skip to login</button>`
            : `<button class="onboarding-btn onboarding-btn-primary" id="ob-action">Continue</button>
               <button class="onboarding-skip" id="ob-skip">Skip</button>`
          }
        </div>
      </div>
    `;

    bindEvents(container);
    updateSlide(container);
  }

  function renderSlide(slide, index) {
    const isActive = index === currentSlide;
    const exitClass = index < currentSlide ? 'exit-left' : '';
    const listHtml = slide.list
      ? `<ul class="onboarding-list">${slide.list.map(item => `<li>${item}</li>`).join('')}</ul>`
      : '';

    return `
      <div class="onboarding-slide ${isActive ? 'active' : ''} ${exitClass}" data-slide="${index}">
        <h2 class="onboarding-title">${slide.heading}</h2>
        ${slide.body ? `<p class="onboarding-desc">${slide.body}</p>` : ''}
        ${listHtml}
      </div>
    `;
  }

  function bindEvents(container) {
    container.querySelector('#ob-action').addEventListener('click', () => {
      if (currentSlide < slides.length - 1) {
        currentSlide++;
        updateSlide(container);
      } else {
        finish();
      }
    });

    container.querySelector('#ob-skip').addEventListener('click', () => finish());

    container.querySelectorAll('[data-dot]').forEach(dot => {
      dot.addEventListener('click', () => {
        const idx = parseInt(dot.dataset.dot);
        if (idx !== currentSlide) {
          currentSlide = idx;
          updateSlide(container);
        }
      });
    });

    let touchStartX = 0;
    const slidesEl = container.querySelector('.onboarding-slides');

    slidesEl.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    slidesEl.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentSlide < slides.length - 1) {
          currentSlide++;
          updateSlide(container);
        } else if (diff < 0 && currentSlide > 0) {
          currentSlide--;
          updateSlide(container);
        }
      }
    }, { passive: true });
  }

  function updateSlide(container) {
    container.querySelectorAll('.onboarding-slide').forEach((el, i) => {
      el.classList.remove('active', 'exit-left');
      if (i === currentSlide) el.classList.add('active');
      else if (i < currentSlide) el.classList.add('exit-left');
    });

    container.querySelectorAll('.onboarding-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === currentSlide);
    });

    const actionBtn = container.querySelector('#ob-action');
    const skipBtn = container.querySelector('#ob-skip');
    const isLast = currentSlide === slides.length - 1;
    actionBtn.textContent = isLast ? 'Get Started' : 'Continue';
    skipBtn.textContent = isLast ? 'Skip to login' : 'Skip';
  }

  function finish() {
    localStorage.setItem('bm_onboarded', '1');
    Router.navigate('login');
  }

  return { render };
})();
