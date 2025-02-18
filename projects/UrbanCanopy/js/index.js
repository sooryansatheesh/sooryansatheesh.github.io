// DOM Elements
const header = document.querySelector('.header');
const featureCards = document.querySelectorAll('.feature-card');
const statsNumbers = document.querySelectorAll('.stat-number');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

// Stats data for animation
const statsData = [
    { end: 50000, suffix: '+', label: 'Trees Mapped' },
    { end: 25, suffix: '%', label: 'Coverage Increase' },
    { end: 15, suffix: '°C', label: 'Temperature Reduction' },
    { end: 1000, suffix: '+', label: 'Active Users' }
];

// Intersection Observer for fade-in animations
const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (entry.target.classList.contains('stat-number')) {
                animateStats(entry.target);
            }
        }
    });
}, {
    threshold: 0.1
});

// Observe all fade-in elements
document.querySelectorAll('.fade-in').forEach(element => {
    fadeInObserver.observe(element);
});

// Header scroll effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        header.style.transform = 'translateY(-100%)';
    } else {
        header.style.transform = 'translateY(0)';
    }
    
    if (currentScroll > 50) {
        header.classList.add('header-scrolled');
    } else {
        header.classList.remove('header-scrolled');
    }
    
    lastScroll = currentScroll;
});

// Stats animation function
function animateStats(statElement) {
    const index = Array.from(statsNumbers).indexOf(statElement);
    const { end, suffix } = statsData[index];
    let start = 0;
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const animate = () => {
        start += increment;
        if (start <= end) {
            statElement.textContent = `${Math.floor(start)}${suffix}`;
            requestAnimationFrame(animate);
        } else {
            statElement.textContent = `${end}${suffix}`;
        }
    };
    
    animate();
}

// Mobile menu toggle
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('nav-links-active');
        mobileMenuBtn.classList.toggle('mobile-menu-active');
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            // Close mobile menu if open
            if (navLinks.classList.contains('nav-links-active')) {
                navLinks.classList.remove('nav-links-active');
                mobileMenuBtn.classList.remove('mobile-menu-active');
            }
        }
    });
});

// Dynamic map preview on hover
const mapPreview = document.querySelector('.map-preview');
if (mapPreview) {
    const cities = [
        { name: 'New York', coordinates: [40.7128, -74.0060] },
        { name: 'Los Angeles', coordinates: [34.0522, -118.2437] },
        { name: 'Chicago', coordinates: [41.8781, -87.6298] }
    ];

    cities.forEach(city => {
        const marker = document.createElement('div');
        marker.classList.add('map-marker');
        marker.dataset.city = city.name;
        
        marker.style.left = `${(city.coordinates[1] + 180) * (100/360)}%`;
        marker.style.top = `${(90 - city.coordinates[0]) * (100/180)}%`;
        
        marker.addEventListener('mouseenter', () => {
            showCityPreview(city);
        });
        
        mapPreview.appendChild(marker);
    });
}

// City preview function
function showCityPreview(city) {
    const preview = document.querySelector('.city-preview');
    if (preview) {
        preview.innerHTML = `
            <h4>${city.name}</h4>
            <p>Tree Coverage: ${Math.floor(Math.random() * 20 + 20)}%</p>
            <p>Heat Index: ${Math.floor(Math.random() * 10 + 75)}°F</p>
        `;
    }
}

// Form validation for newsletter signup
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const emailInput = newsletterForm.querySelector('input[type="email"]');
        if (emailInput.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.classList.add('newsletter-success');
            successMessage.textContent = 'Thank you for subscribing!';
            newsletterForm.replaceWith(successMessage);
        } else {
            // Show error message
            emailInput.classList.add('error');
            const errorMessage = newsletterForm.querySelector('.error-message') || document.createElement('div');
            errorMessage.classList.add('error-message');
            errorMessage.textContent = 'Please enter a valid email address';
            if (!newsletterForm.querySelector('.error-message')) {
                emailInput.after(errorMessage);
            }
        }
    });
}

// Image lazy loading
document.addEventListener('DOMContentLoaded', () => {
    const lazyImages = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    lazyImages.forEach(img => imageObserver.observe(img));
});

// Temperature data visualization (if present)
const tempChart = document.querySelector('.temperature-chart');
if (tempChart) {
    const ctx = tempChart.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, tempChart.height);
    gradient.addColorStop(0, 'rgba(255, 99, 132, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 99, 132, 0)');
    
    // Sample data - replace with real data in production
    const data = Array.from({length: 12}, () => Math.floor(Math.random() * 15 + 70));
    
    drawTemperatureChart(ctx, data, gradient);
}

// Temperature chart drawing function
function drawTemperatureChart(ctx, data, gradient) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 40;
    const dataPoints = data.length;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw gradient area
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    
    data.forEach((temp, index) => {
        const x = padding + (index * ((width - padding * 2) / (dataPoints - 1)));
        const y = height - padding - ((temp - 60) * ((height - padding * 2) / 40));
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.fillStyle = gradient;
    ctx.fill();
}