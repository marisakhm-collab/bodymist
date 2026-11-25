/* ==========================================================================
   BODY SCENT - Shared Application Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. หน้าสินค้า (product.html)
  if (document.getElementById('product-list')) {
    initProductPage();
  }

  // 2. หน้าสั่งซื้อ (order.html)
  if (document.getElementById('orderForm')) {
    initOrderPage();
  }

  // 3. หน้าจัดการหลังบ้าน (admin.html)
  if (document.querySelector('#ordersTable tbody')) {
    initAdminPage();
  }
});

/* ==========================================================================
   1. PRODUCT PAGE (product.html)
   ========================================================================== */

let allProducts = [];

function initProductPage() {
  const filterBar = document.getElementById('filter-bar');
  const productList = document.getElementById('product-list');

  // อ่านค่า ?mood=xxx จาก URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialMood = (urlParams.get('mood') || 'all').toLowerCase();

  // สร้างปุ่มกรองตาม mood
  const moods = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'fresh', label: 'Fresh' },
    { key: 'sweet', label: 'Sweet' },
    { key: 'confident', label: 'Confident' },
    { key: 'romance', label: 'Romance' }
  ];

  if (filterBar) {
    filterBar.innerHTML = moods
      .map(m => {
        const isActive = m.key === initialMood ? 'active' : '';
        const dotHtml = m.key !== 'all' ? `<span class="mood-dot ${m.key}"></span>` : '';
        return `<button type="button" class="filter-btn ${isActive}" data-mood="${m.key}">${dotHtml}${m.label}</button>`;
      })
      .join('');

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const selectedMood = btn.dataset.mood;
      renderProducts(selectedMood);
    });
  }

  // โหลดข้อมูลสินค้าจาก products.json
  fetch('products.json')
    .then(response => {
      if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลสินค้าได้');
      return response.json();
    })
    .then(data => {
      allProducts = data;
      const validMoods = moods.map(m => m.key);
      const startMood = validMoods.includes(initialMood) ? initialMood : 'all';
      renderProducts(startMood);
    })
    .catch(err => {
      console.error(err);
      productList.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">ไม่สามารถโหลดรายการสินค้าได้ในขณะนี้</p>';
    });
}

function renderProducts(mood) {
  const productList = document.getElementById('product-list');
  if (!productList) return;

  const filtered = mood === 'all'
    ? allProducts
    : allProducts.filter(p => p.mood.toLowerCase() === mood);

  if (filtered.length === 0) {
    productList.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">ไม่พบสินค้าในหมวดหมู่นี้</p>';
    return;
  }

  productList.innerHTML = filtered.map(product => {
    const typeLabel = product.type === 'rollon' ? 'Roll-on' : 'Body Spray';
    const itemNameWithSize = product.size && !product.name.includes(product.size)
      ? `${product.name} ${product.size}`
      : product.name;

    const orderUrl = `order.html?item=${encodeURIComponent(itemNameWithSize)}&price=${encodeURIComponent(product.price)}`;

    return `
      <article class="product-card">
        <div class="product-image-wrap">
          <img src="${product.image}" alt="${escapeHtml(product.name)}" loading="lazy">
          <span class="product-type-tag">${typeLabel}</span>
        </div>
        <div class="product-body">
          <div class="product-meta">
            <span class="mood-label">
              <span class="mood-dot ${product.mood}"></span>
              ${product.mood}
            </span>
            <span class="product-size">${product.size || ''}</span>
          </div>
          <h3 class="product-title">${escapeHtml(product.name)}</h3>
          <p class="product-desc">${escapeHtml(product.description || '')}</p>
          <div class="product-footer">
            <span class="product-price">฿${Number(product.price).toLocaleString()}</span>
            <a href="${orderUrl}" class="btn btn-sm">สั่งซื้อ</a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

/* ==========================================================================
   2. ORDER PAGE (order.html)
   ========================================================================== */

function initOrderPage() {
  const orderForm = document.getElementById('orderForm');
  const itemsInput = document.getElementById('items');
  const totalInput = document.getElementById('total');

  // อ่านค่า item และ price จาก URL parameter แล้วเติมลงฟอร์มทันที
  const urlParams = new URLSearchParams(window.location.search);
  const itemParam = urlParams.get('item');
  const priceParam = urlParams.get('price');

  if (itemParam && itemsInput) {
    itemsInput.value = itemParam;
  }
  if (priceParam && totalInput) {
    totalInput.value = priceParam;
  }

  // ส่งฟอร์มสั่งซื้อไปยัง Google Apps Script
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = orderForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังส่งคำสั่งซื้อ...';
    }

    const payload = {
      customerName: document.getElementById('customerName')?.value.trim() || '',
      contact: document.getElementById('contact')?.value.trim() || '',
      items: document.getElementById('items')?.value.trim() || '',
      total: document.getElementById('total')?.value.trim() || '',
      note: document.getElementById('note')?.value.trim() || ''
    };

    fetch('https://script.google.com/macros/s/AKfycbzFNyzgWZozEYdJWsDOztiqu-WelwPKK2LTeqHqUAmbF_1k-AtvMMqg5L1d9NI4ctJrmQ/exec', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
      .then(() => {
        window.location.href = 'thankyou.html';
      })
      .catch(error => {
        console.error(error);
        alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'ยืนยันสั่งซื้อ';
        }
      });
  });
}

/* ==========================================================================
   3. ADMIN PAGE (admin.html)
   ========================================================================== */

function initAdminPage() {
  const tbody = document.querySelector('#ordersTable tbody');
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSM3u0Yq9F76peWqdGPhSUBDlU3JIRIRtkiWC1FUL54stPUL7IHVfwWrv8Dh2SdyS6Od-926Jxtwejy/pub?gid=0&single=true&output=csv';

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">กำลังโหลดข้อมูลคำสั่งซื้อ...</td></tr>';

  fetch(csvUrl)
    .then(response => {
      if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูล CSV ได้');
      return response.text();
    })
    .then(csvText => {
      const rows = parseCSV(csvText);

      // ตัดแถวหัวตาราง (index 0) และกรองแถวว่างออก
      const dataRows = rows
        .slice(1)
        .filter(row => row.some(cell => cell.trim() !== ''));

      if (dataRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">ยังไม่มีรายการสั่งซื้อ</td></tr>';
        return;
      }

      // เรียงจากรายการล่าสุดขึ้นก่อน
      const reversedRows = dataRows.reverse();

      tbody.innerHTML = reversedRows.map(cols => {
        const timestamp = cols[0] || '-';
        const customerName = cols[1] || '-';
        const contact = cols[2] || '-';
        const items = cols[3] || '-';
        const total = cols[4] || '-';
        const note = cols[5] || '-';

        return `
          <tr>
            <td>${escapeHtml(timestamp)}</td>
            <td>${escapeHtml(customerName)}</td>
            <td>${escapeHtml(contact)}</td>
            <td>${escapeHtml(items)}</td>
            <td>${escapeHtml(total)}</td>
            <td>${escapeHtml(note)}</td>
          </tr>
        `;
      }).join('');
    })
    .catch(error => {
      console.error(error);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    });
}

/* ==========================================================================
   CSV Parser & Utilities (No External Libraries)
   ========================================================================== */

function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // ข้ามเครื่องหมายคำพูดซ้อน ("")
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // รองรับ CRLF (\r\n)
      }
      currentRow.push(currentVal.trim());
      rows.push(currentRow);
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  // เก็บข้อมูลตัวสุดท้ายหากไฟล์ไม่ได้ลงท้ายด้วยบรรทัดใหม่
  if (currentVal !== '' || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    rows.push(currentRow);
  }

  return rows;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}