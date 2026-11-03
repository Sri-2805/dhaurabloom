/**
 * DHAURA BLOOM - Handcrafted Crafts & Gifts
 * Main Interactive Application Script
 */

// Global State
let productsData = [];
let activeCategory = 'all';
let searchQuery = '';
let selectedColors = ['Pastel Pink', 'Lilac'];
let inquiryList = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  await loadProducts();
  initColorPickers();
  initCustomForm();
  initFaqAccordion();
  initContactForm();
  initInquiryDrawer();
});

// Smooth scroll helper with sticky header compensation
function smoothScrollTo(targetId) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const header = document.querySelector('.site-header');
  const announcement = document.querySelector('.announcement-bar');
  const headerHeight = (header ? header.offsetHeight : 80) + (announcement ? announcement.offsetHeight : 0);

  const elementPosition = target.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - headerHeight - 15;

  window.scrollTo({
    top: Math.max(0, offsetPosition),
    behavior: 'smooth'
  });
}
window.smoothScrollTo = smoothScrollTo;

// Initialize Sticky Navbar & Mobile Toggle
function initNavbar() {
  const header = document.querySelector('.site-header');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  const setMobileMenuOpen = (isOpen) => {
    if (!mobileToggle || !navMenu) return;
    navMenu.classList.toggle('open', isOpen);
    mobileToggle.setAttribute('aria-expanded', String(isOpen));
    mobileToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  };

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        if (window.scrollY > 40) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }

        // Active Section Tracking
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.pageYOffset + 180;

        sections.forEach(current => {
          const sectionHeight = current.offsetHeight;
          const sectionTop = current.getBoundingClientRect().top + window.pageYOffset;
          const sectionId = current.getAttribute('id');

          if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            navLinks.forEach(link => {
              link.classList.remove('active');
              if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
              }
            });
          }
        });

        ticking = false;
      });
      ticking = true;
    }
  });

  // Intercept all internal anchor clicks for smooth scrolling with offset
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').substring(1);
      if (targetId && document.getElementById(targetId)) {
        e.preventDefault();
        smoothScrollTo(targetId);
        if (navMenu && navMenu.classList.contains('open')) {
          setMobileMenuOpen(false);
        }
      }
    });
  });

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      setMobileMenuOpen(!navMenu.classList.contains('open'));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navMenu.classList.contains('open')) {
        setMobileMenuOpen(false);
        mobileToggle.focus();
      }
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100) setMobileMenuOpen(false);
    });
  }
}

// Load Products Data
async function loadProducts() {
  try {
    const res = await fetch('assets/data/products.json');
    if (!res.ok) throw new Error('Failed to load products');
    productsData = await res.json();
    renderProducts();
    initFiltersAndSearch();
  } catch (err) {
    console.error('Error loading products:', err);
    // Fallback if fetch is blocked locally
    productsData = getFallbackProducts();
    renderProducts();
    initFiltersAndSearch();
  }
}

// Render Products Grid
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const countNote = document.getElementById('products-count');
  if (!grid) return;

  const filtered = productsData.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.options.some(opt => opt.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (countNote) {
    countNote.textContent = `Showing ${filtered.length} unique creation${filtered.length === 1 ? '' : 's'}`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🌸</div>
        <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 0.5rem;">No creations found</h3>
        <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Try choosing a different collection or search term.</p>
        <button class="btn btn-primary" onclick="resetFilters()">View All Collections</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <div class="product-card" data-category="${item.category}">
      <div class="product-image-container" onclick="openQuickView('${item.id}')">
        <img src="${item.image}" alt="${item.title}" loading="lazy" />
        <span class="product-badge">${item.badge}</span>
        <button class="product-quick-view-btn" onclick="event.stopPropagation(); openQuickView('${item.id}')">
          <i data-lucide="eye" style="width: 15px; height: 15px;"></i> Quick View
        </button>
      </div>

      <div class="product-content">
        <div class="product-category-meta">${item.categoryLabel}</div>
        <h3 class="product-title" onclick="openQuickView('${item.id}')">${item.title}</h3>
        <p class="product-desc">${item.shortDescription}</p>

        <div class="product-options-pills">
          ${item.options.slice(0, 2).map(opt => `<span class="product-option-tag">✦ ${opt}</span>`).join('')}
        </div>

        <div class="product-card-footer">
          <div class="product-price-info">
            <span class="product-price-label">Pricing</span>
            <span class="product-price-val">${item.estimatedPrice}</span>
          </div>
          <div class="product-card-actions">
            <button class="btn-card-inquire" onclick="addToInquiry('${item.id}')" title="Add to Custom Inquiry">
              <i data-lucide="sparkles" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> Customise
            </button>
            <a href="https://wa.me/917904810532?text=${encodeURIComponent(`Hi Dhaura Bloom! I am interested in inquiring about ${item.title}. Could you please share the current price and availability?`)}" target="_blank" rel="noopener noreferrer" class="btn-card-whatsapp">
              <i data-lucide="message-circle" style="width: 14px; height: 14px; display: inline-block; vertical-align: middle;"></i> Order
            </a>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Filter Tabs & Search Handling
function initFiltersAndSearch() {
  const tabButtons = document.querySelectorAll('.filter-tab-btn');
  const searchInput = document.getElementById('product-search-input');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.getAttribute('data-category');
      renderProducts();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderProducts();
    });
  }
}

function resetFilters() {
  activeCategory = 'all';
  searchQuery = '';
  const searchInput = document.getElementById('product-search-input');
  if (searchInput) searchInput.value = '';
  const tabButtons = document.querySelectorAll('.filter-tab-btn');
  tabButtons.forEach(btn => {
    if (btn.getAttribute('data-category') === 'all') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  renderProducts();
}

// Quick View Modal
function openQuickView(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  const modal = document.getElementById('quick-view-modal');
  const modalContent = document.getElementById('quick-view-body');
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `
    <div class="modal-image-col">
      <img src="${product.image}" alt="${product.title}" />
      <span class="product-badge" style="position: absolute; top: 1.5rem; left: 1.5rem;">${product.badge}</span>
    </div>
    <div class="modal-info-col">
      <div class="product-category-meta">${product.categoryLabel} • Handmade in Chennai</div>
      <h2 style="font-family: var(--font-heading); font-size: 2rem; margin-bottom: 0.75rem; color: var(--text-dark);">${product.title}</h2>
      <p style="font-size: 0.95rem; color: var(--text-muted); line-height: 1.7; margin-bottom: 1.5rem;">${product.description}</p>

      <div style="margin-bottom: 1.5rem;">
        <h4 style="font-size: 0.875rem; font-weight: 700; text-transform: uppercase; color: var(--primary); margin-bottom: 0.5rem;">Available Options</h4>
        <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.4rem;">
          ${product.options.map(opt => `<li style="font-size: 0.875rem; color: var(--text-dark); display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="check-circle-2" style="width: 15px; height: 15px; color: var(--secondary);"></i> ${opt}</li>`).join('')}
        </ul>
      </div>

      <div style="background: var(--bg-cream); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-bottom: 1.5rem; border: 1px solid var(--surface-border);">
        <div style="font-size: 0.8125rem; font-weight: 700; color: var(--primary); text-transform: uppercase; margin-bottom: 0.5rem;">Product Specifications & Care</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.8125rem;">
          <div><span style="color: var(--text-light);">Material:</span> <br><strong>${product.specifications.Material}</strong></div>
          <div><span style="color: var(--text-light);">Care:</span> <br><strong>${product.specifications.Care}</strong></div>
        </div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--surface-border); gap: 1rem; flex-wrap: wrap;">
        <div>
          <span style="font-size: 0.75rem; color: var(--text-light); text-transform: uppercase; display: block;">Price Estimate</span>
          <span style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${product.estimatedPrice}</span>
        </div>
        <div style="display: flex; gap: 0.75rem;">
          <button class="btn btn-secondary" onclick="prefillCustomOrder('${product.id}'); closeModal();">
            <i data-lucide="palette" style="width: 16px; height: 16px;"></i> Request Custom Variation
          </button>
          <a href="https://wa.me/917904810532?text=${encodeURIComponent(`Hi Dhaura Bloom! I would like to order/inquire about the ${product.title}. Please provide details on pricing, preparation time, and delivery to Chennai.`)}" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp">
            <i data-lucide="message-circle" style="width: 16px; height: 16px;"></i> Order on WhatsApp
          </a>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (window.lucide) {
    lucide.createIcons();
  }
}

function closeModal() {
  const modal = document.getElementById('quick-view-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// View Switcher for Products & Custom Order Studio
function switchProductView(mode) {
  const workspace = document.getElementById('products-workspace');
  const buttons = document.querySelectorAll('.view-switch-btn');

  if (workspace) {
    workspace.classList.remove('view-split', 'view-products-only', 'view-form-only');
    if (mode === 'products') {
      workspace.classList.add('view-products-only');
    } else if (mode === 'form') {
      workspace.classList.add('view-form-only');
    } else {
      workspace.classList.add('view-split');
    }
  }

  buttons.forEach(btn => {
    if (btn.getAttribute('data-view') === mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
window.switchProductView = switchProductView;

// Focus Custom Form in the same place
function focusCustomForm(productId) {
  switchProductView('split');

  if (productId) {
    prefillCustomOrder(productId);
  }

  const formBox = document.getElementById('custom-form-container');
  if (formBox) {
    formBox.classList.remove('highlight-form');
    void formBox.offsetWidth; // trigger reflow
    formBox.classList.add('highlight-form');
  }

  // Smooth scroll to the products section where both products & form live
  smoothScrollTo('products');
}
window.focusCustomForm = focusCustomForm;

// Toggle "What Can You Customise" info
function toggleCustomiseInfo() {
  const body = document.getElementById('customise-info-body');
  const arrow = document.getElementById('customise-info-arrow');
  if (body) {
    const isHidden = body.style.display === 'none' || body.style.display === '';
    body.style.display = isHidden ? 'block' : 'none';
    if (arrow) arrow.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  }
}
window.toggleCustomiseInfo = toggleCustomiseInfo;

// Prefill Custom Order with chosen product (In the exact same place)
function prefillCustomOrder(productId) {
  const product = productsData.find(p => p.id === productId);
  if (!product) return;

  // Ensure workspace is in split view so form is visible right beside products
  const workspace = document.getElementById('products-workspace');
  if (workspace && workspace.classList.contains('view-products-only')) {
    switchProductView('split');
  }

  // Update selected product banner
  const bannerTitle = document.getElementById('banner-product-title');
  if (bannerTitle) {
    bannerTitle.textContent = product.title;
  }

  const productSelect = document.getElementById('custom-product-type');
  const detailsArea = document.getElementById('custom-requirements');

  if (productSelect) {
    const map = {
      'flowers': 'Pipe Cleaner Flowers',
      'bouquets': 'Flower Bouquets',
      'keychains': 'Handmade Keychains',
      'hair-accessories': 'Hair Accessories',
      'mini-figures': 'Mini Figures',
      'gift-hampers': 'Gift Hampers'
    };
    productSelect.value = map[productId] || 'Pipe Cleaner Flowers';
  }

  if (detailsArea) {
    detailsArea.value = `I am interested in ordering/customising: ${product.title}.`;
  }

  updateLiveSummary();

  // Pulse highlight the form right in place
  const formBox = document.getElementById('custom-form-container');
  if (formBox) {
    formBox.classList.remove('highlight-form');
    void formBox.offsetWidth;
    formBox.classList.add('highlight-form');

    // On mobile devices where layout stacks, scroll slightly to form
    if (window.innerWidth <= 1100) {
      formBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  showToast(`Selected "${product.title}" in the Custom Enquiry Form!`);
}

// Helper to handle reference image file
function handleReferenceFile(file, previewImg, dropzone) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    previewImg.src = event.target.result;
    previewImg.style.display = 'block';
    const textEl = dropzone.querySelector('.upload-text');
    if (textEl) textEl.textContent = `Attached: ${file.name}`;
    showToast(`Attached ${file.name}`);
  };
  reader.readAsDataURL(file);
}

// Color Swatch Selector for Custom Form
function initColorPickers() {
  const chips = document.querySelectorAll('.color-swatch-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const color = chip.getAttribute('data-color');
      chip.classList.toggle('active');

      if (chip.classList.contains('active')) {
        if (!selectedColors.includes(color)) selectedColors.push(color);
      } else {
        selectedColors = selectedColors.filter(c => c !== color);
      }

      const hiddenInput = document.getElementById('custom-colors-hidden');
      if (hiddenInput) {
        hiddenInput.value = selectedColors.join(', ');
      }
      updateLiveSummary();
    });
  });

  // Reference file preview with drag-and-drop & bubbling protection
  const fileInput = document.getElementById('custom-reference-file');
  const dropzone = document.getElementById('file-dropzone');
  const previewImg = document.getElementById('reference-preview');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target !== fileInput) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    dropzone.addEventListener('dragover', () => {
      dropzone.style.borderColor = 'var(--primary)';
      dropzone.style.background = '#F8EAF1';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'rgba(148, 81, 122, 0.25)';
      dropzone.style.background = '#FAF7F2';
    });

    dropzone.addEventListener('drop', (e) => {
      dropzone.style.borderColor = 'rgba(148, 81, 122, 0.25)';
      dropzone.style.background = '#FAF7F2';
      const file = e.dataTransfer?.files?.[0];
      if (file && previewImg) {
        handleReferenceFile(file, previewImg, dropzone);
      }
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (file && previewImg) {
        handleReferenceFile(file, previewImg, dropzone);
      }
    });
  }
}

// Live Summary Calculator in Custom Form
function updateLiveSummary() {
  const productType = document.getElementById('custom-product-type')?.value || 'Pipe Cleaner Flowers';
  const occasion = document.getElementById('custom-occasion')?.value || 'Birthday';
  const qty = document.getElementById('custom-quantity')?.value || '1';
  const location = document.getElementById('custom-location')?.value || 'Chennai';
  const date = document.getElementById('custom-date')?.value || 'Flexible';

  const sumProduct = document.getElementById('summary-product');
  const sumColors = document.getElementById('summary-colors');
  const sumOccasion = document.getElementById('summary-occasion');
  const sumQty = document.getElementById('summary-qty');
  const sumLoc = document.getElementById('summary-location');

  if (sumProduct) sumProduct.textContent = productType;
  if (sumColors) sumColors.textContent = selectedColors.length > 0 ? selectedColors.join(', ') : 'Custom Palette';
  if (sumOccasion) sumOccasion.textContent = occasion;
  if (sumQty) sumQty.textContent = `${qty} piece${qty > 1 ? 's' : ''}`;
  if (sumLoc) sumLoc.textContent = location;
}

// Initialize Custom Order Form Actions
function initCustomForm() {
  const form = document.getElementById('custom-enquiry-form');
  const sendWhatsAppBtn = document.getElementById('btn-send-custom-whatsapp');

  // Input change listeners for live update
  const watchInputs = ['custom-product-type', 'custom-occasion', 'custom-quantity', 'custom-location', 'custom-date', 'custom-budget'];
  watchInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateLiveSummary);
  });

  if (sendWhatsAppBtn) {
    sendWhatsAppBtn.addEventListener('click', (e) => {
      e.preventDefault();
      sendCustomOrderViaWhatsApp();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleFormSubmit(form);
    });
  }
}

// WhatsApp Generator for Custom Orders
function sendCustomOrderViaWhatsApp() {
  const name = document.getElementById('custom-name')?.value.trim() || 'A Customer';
  const phone = document.getElementById('custom-phone')?.value.trim() || 'Not specified';
  const email = document.getElementById('custom-email')?.value.trim() || 'Not specified';
  const productType = document.getElementById('custom-product-type')?.value || 'Handmade Pipe Cleaner Creation';
  const colors = selectedColors.length > 0 ? selectedColors.join(', ') : 'Custom shades';
  const occasion = document.getElementById('custom-occasion')?.value || 'Special occasion';
  const requirements = document.getElementById('custom-requirements')?.value.trim() || 'No specific requests';
  const quantity = document.getElementById('custom-quantity')?.value || '1';
  const budget = document.getElementById('custom-budget')?.value.trim() || 'Flexible';
  const date = document.getElementById('custom-date')?.value || 'Flexible';
  const location = document.getElementById('custom-location')?.value || 'Chennai';

  const message = 
`🌸 *DHAURA BLOOM - CUSTOM ORDER REQUEST* 🌸
Hello Dhaura Bloom! I would like to place a custom order inquiry:

• *Full Name:* ${name}
• *Phone Number:* ${phone}
• *Email:* ${email}
• *Product Type:* ${productType}
• *Preferred Colours:* ${colors}
• *Occasion:* ${occasion}
• *Requirements & Details:* ${requirements}
• *Quantity:* ${quantity}
• *Budget:* ${budget}
• *Required Date:* ${date}
• *Delivery Location:* ${location}

Please confirm availability, price estimate, and preparation time. Thank you!`;

  const waUrl = `https://wa.me/917904810532?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');
  showToast('Opening WhatsApp with your custom order details!');
}

function handleFormSubmit(form) {
  const name = document.getElementById('custom-name')?.value.trim();
  const phone = document.getElementById('custom-phone')?.value.trim();

  if (!name || !phone) {
    showToast('Please provide your Full Name and Phone Number.');
    return;
  }

  // Simulate submission confirmation
  showToast('🎉 Thank you! Your custom request has been recorded. Dhaura Bloom will contact you soon.');
  form.reset();
  selectedColors = ['Pastel Pink', 'Lilac'];
  document.querySelectorAll('.color-swatch-chip').forEach(c => {
    const col = c.getAttribute('data-color');
    if (selectedColors.includes(col)) c.classList.add('active');
    else c.classList.remove('active');
  });
  updateLiveSummary();
}

// FAQ Accordion
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        faqItems.forEach(i => i.classList.remove('active'));
        if (!isActive) {
          item.classList.add('active');
        }
      });
    }
  });
}

// Contact Form
function initContactForm() {
  const contactForm = document.getElementById('general-contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('contact-name')?.value.trim();
      const phone = document.getElementById('contact-phone')?.value.trim();
      const subject = document.getElementById('contact-subject')?.value.trim();
      const message = document.getElementById('contact-message')?.value.trim();

      const waMsg = `Hello Dhaura Bloom! Message from ${name} (${phone}):\n\nSubject: ${subject}\n\n${message}`;
      const waUrl = `https://wa.me/917904810532?text=${encodeURIComponent(waMsg)}`;
      
      showToast('Thank you! Redirecting to WhatsApp for instant connection...');
      window.open(waUrl, '_blank');
      contactForm.reset();
    });
  }
}

// Inquiry Drawer
function addToInquiry(productId) {
  prefillCustomOrder(productId);
}

function initInquiryDrawer() {
  // Update badge count
  const badge = document.querySelector('.inquiry-badge-count');
  if (badge) {
    badge.textContent = 'Custom Order';
  }
}

// Toast Notifications Helper
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<i data-lucide="sparkles" style="width: 16px; height: 16px; color: var(--accent-gold);"></i> <span>${message}</span>`;
  container.appendChild(toast);

  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Fallback products data if fetch fails
function getFallbackProducts() {
  return [
    {
      "id": "flowers",
      "title": "Pipe Cleaner Flowers",
      "category": "flowers",
      "categoryLabel": "Handmade Flowers",
      "badge": "Popular",
      "shortDescription": "Beautiful handmade flowers created with colourful pipe cleaners and thoughtful details. Ideal for room decoration, desk décor, and gifting.",
      "description": "Bright, cheerful pipe cleaner flowers that add colour to your room, desk or special occasion. Crafted with high-grade soft chenille stems with flexible wire cores.",
      "image": "assets/images/tulip-flower.jpg",
      "estimatedPrice": "Affordable Handmade",
      "options": ["Different styles & colours", "Single flowers or arranged sets", "Custom colour combinations"],
      "specifications": { "Material": "Premium Chenille & Wire", "Care": "Keep dry, dust gently" }
    },
    {
      "id": "bouquets",
      "title": "Flower Bouquets",
      "category": "bouquets",
      "categoryLabel": "Flower Bouquets",
      "badge": "Signature",
      "shortDescription": "Give flowers that stay bright. Handmade pipe cleaner bouquets that are a creative, everlasting alternative to traditional flowers.",
      "description": "Long-lasting handmade bouquets that stay beautiful without watering or daily maintenance. Beautifully styled with tulips, daisies, and satin ribbon.",
      "image": "assets/images/flower-bouquet.jpg",
      "estimatedPrice": "Custom Sizes Available",
      "options": ["Small, Medium & Grand bouquet sizes", "Personalised flower selection", "Choice of wrapping paper"],
      "specifications": { "Material": "Chenille pipe cleaners & satin bow", "Care": "Indoor display, zero water" }
    },
    {
      "id": "keychains",
      "title": "Handmade Keychains",
      "category": "keychains",
      "categoryLabel": "Cute Keychains",
      "badge": "Cute & Lightweight",
      "shortDescription": "Cute and creative keychains designed for bags, keys and everyday accessories. Lightweight and crafted with durable chenille stems.",
      "description": "Lightweight, colourful keychains for bags, keys and everyday accessories. Choose from charming floral charms and sweet bunny faces.",
      "image": "assets/images/keychains.jpg",
      "estimatedPrice": "Pocket-Friendly Joy",
      "options": ["Lightweight handmade designs", "Colourful shapes and characters", "Golden keyrings"],
      "specifications": { "Material": "Soft pipe cleaners & alloy ring", "Care": "Spot clean gently" }
    },
    {
      "id": "hair-accessories",
      "title": "Hair Accessories",
      "category": "hair-accessories",
      "categoryLabel": "Hair Accessories",
      "badge": "Playful Style",
      "shortDescription": "Playful handmade accessories that add a creative touch to everyday style. Lightweight, comfortable, and gentle on hair.",
      "description": "Add a little colour to everyday style with handmade hair accessories designed to be playful, lightweight and easy to wear.",
      "image": "assets/images/hair-accessories.jpg",
      "estimatedPrice": "Affordable Everyday Glam",
      "options": ["Floral clips, hairpins, and claw attachments", "Pastel and vibrant color palettes"],
      "specifications": { "Material": "Chenille flowers & snag-free pins", "Care": "Keep dry" }
    },
    {
      "id": "mini-figures",
      "title": "Mini Figures",
      "category": "mini-figures",
      "categoryLabel": "Mini Figures",
      "badge": "Desk Buddies",
      "shortDescription": "Bring home a tiny handmade friend. Cute little handmade characters that are perfect for collecting, gifting or displaying.",
      "description": "Cute little handmade characters that are perfect for collecting, gifting or decorating a study table, shelf or bedroom.",
      "image": "assets/images/mini-figures.jpg",
      "estimatedPrice": "Collectible Charm",
      "options": ["Bunny, chick, bear characters", "Compact desktop display size"],
      "specifications": { "Material": "High-density fuzzy chenille", "Care": "Dust with soft brush" }
    },
    {
      "id": "gift-hampers",
      "title": "Gift Hampers",
      "category": "gift-hampers",
      "categoryLabel": "Gift Hampers",
      "badge": "Complete Gift Set",
      "shortDescription": "Make your gift more personal with a thoughtfully arranged handmade hamper for birthdays, celebrations, and return gifts.",
      "description": "Thoughtfully arranged handmade gifts for birthdays, celebrations, return gifts and special occasions. Includes flowers, keychains, and fairy lights.",
      "image": "assets/images/gift-hamper.jpg",
      "estimatedPrice": "Curated to Your Budget",
      "options": ["Curated combination of bouquets and accessories", "Kraft gift box & fairy lights"],
      "specifications": { "Material": "Eco-friendly kraft box & crafts", "Care": "Store at room temp" }
    }
  ];
}
