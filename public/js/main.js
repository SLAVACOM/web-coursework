$(function () {
  const CONDITION_CLASS = {
    'отличное':          'excellent',
    'хорошее':           'good',
    'удовлетворительное':'fair',
    'плохое':            'poor',
  };

  const canEdit = ['admin', 'storekeeper'].includes(window.APP_ROLE);

  function renderTools(tools) {
    const count = tools.length;
    if (count === 0) {
      $('#results-info').html('');
      $('#tools-grid').html('<p class="empty"><span class="empty-icon">🔍</span>Инвентарь не найден</p>');
      return;
    }

    $('#results-info').html(`<div class="results-info">Найдено: <strong>${count}</strong> товар${count % 10 === 1 && count % 100 !== 11 ? '' : count % 10 === 2 || count % 10 === 3 || count % 10 === 4 ? 'а' : 'ов'}</div>`);

    const cards = tools.map(t => {
      const cls    = CONDITION_CLASS[t.condition] || 'good';
      const price  = t.price ? `<span>${Number(t.price).toLocaleString('ru-RU')} ₽</span>` : '';
      const imgTag = t.image
        ? `<img src="/uploads/${t.image}" alt="${t.name}">`
        : `<div class="tool-card__img-placeholder">🌱</div>`;
      const editBtn = canEdit
        ? `<a href="/tools/${t.id}/edit" class="btn btn--sm btn--secondary">Изменить</a>`
        : '';

      return `
        <div class="tool-card">
          <a href="/tools/${t.id}" class="tool-card__img">${imgTag}</a>
          <div class="tool-card__body">
            <h3><a href="/tools/${t.id}">${t.name}</a></h3>
            <span class="category-tag">${t.category_name || 'Без категории'}</span>
            <span class="badge badge--${cls}">${t.condition}</span>
          </div>
          <div class="tool-card__meta">
            <span>Кол-во: <strong>${t.quantity}</strong></span>
            ${price}
          </div>
          <div class="tool-card__actions">
            <a href="/tools/${t.id}" class="btn btn--sm">Просмотр</a>
            ${editBtn}
          </div>
        </div>`;
    });

    $('#tools-grid').html(cards.join(''));
  }

  function loadTools() {
    $.getJSON('/api/tools', {
      search:      $('#search').val().trim(),
      category_id: $('#category-filter').val(),
      condition:   $('#condition-filter').val(),
      sort:        $('#sort-filter').val(),
    }, renderTools);
  }

  let debounceTimer;
  $('#search').on('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadTools, 300);
  });

  $('#category-filter').on('change', loadTools);
  $('#condition-filter').on('change', loadTools);
  $('#sort-filter').on('change', loadTools);

  // Image gallery
  function switchToImage(index) {
    const thumb = $('.gallery-thumb').eq(index);
    if (thumb.length === 0) return;

    const filename = thumb.data('filename');
    const imageId = thumb.data('image-id');

    $('#main-image').attr('src', '/uploads/' + filename);
    $('.gallery-thumb').removeClass('active');
    thumb.addClass('active');

    // Update counter
    $('#gallery-current').text(index + 1);

    // Update delete button
    const deleteForm = $('.image-delete-btn form');
    if (deleteForm.length) {
      const toolId = deleteForm.attr('action').split('/')[2];
      deleteForm.attr('action', `/tools/${toolId}/images/${imageId}/delete`);
    }
  }

  function getCurrentImageIndex() {
    return $('.gallery-thumb.active').data('index') || 0;
  }

  function getImageCount() {
    return $('.gallery-thumb').length;
  }

  function nextImage() {
    const current = getCurrentImageIndex();
    const count = getImageCount();
    const next = (current + 1) % count;
    switchToImage(next);
  }

  function prevImage() {
    const current = getCurrentImageIndex();
    const count = getImageCount();
    const prev = (current - 1 + count) % count;
    switchToImage(prev);
  }

  // Thumbnail clicking
  $('.gallery-thumb').on('click', function () {
    const index = $(this).data('index');
    switchToImage(index);
  });

  // Navigation buttons
  $('#gallery-next').on('click', nextImage);
  $('#gallery-prev').on('click', prevImage);

  // Keyboard navigation (arrow keys)
  $(document).on('keydown', function (e) {
    if ($('.gallery-thumb').length <= 1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextImage();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevImage();
    }
  });

  // Mouse wheel navigation
  $('.gallery-main').on('wheel', function (e) {
    if ($('.gallery-thumb').length <= 1) return;

    e.preventDefault();
    if (e.originalEvent.deltaY > 0) {
      nextImage();
    } else {
      prevImage();
    }
  });

  // Drag and drop for gallery
  let draggedItem = null;

  $('.gallery-thumb-item').on('dragstart', function () {
    draggedItem = this;
    $(this).addClass('dragging');
  });

  $('.gallery-thumb-item').on('dragend', function () {
    $('.gallery-thumb-item').removeClass('drag-over');
    draggedItem = null;
  });

  $('.gallery-thumb-item').on('dragover', function (e) {
    e.preventDefault();
    $(this).addClass('drag-over');
  });

  $('.gallery-thumb-item').on('dragleave', function () {
    $(this).removeClass('drag-over');
  });

  $('.gallery-thumb-item').on('drop', function (e) {
    e.preventDefault();
    if (draggedItem && draggedItem !== this) {
      // Swap elements
      const $gallery = $('#galleryThumbs');
      const draggedIndex = $gallery.children().index(draggedItem);
      const targetIndex = $gallery.children().index(this);

      if (draggedIndex < targetIndex) {
        $(draggedItem).insertAfter(this);
      } else {
        $(draggedItem).insertBefore(this);
      }

      // Обновляем индексы
      $('.gallery-thumb').each(function (idx) {
        $(this).data('index', idx);
      });
    }
    $(this).removeClass('drag-over');
  });

  // Image upload preview and drag-drop
  const imagesInput = document.getElementById('images');
  const uploadArea = document.querySelector('.image-upload-area');
  const imagesPreview = document.getElementById('imagesPreview');
  const existingImagesPreview = document.getElementById('existingImagesPreview');
  let selectedFiles = [];
  let deletedImageIds = [];

  if (imagesInput) {
    // Click to upload
    uploadArea.addEventListener('click', () => imagesInput.click());

    // File selection
    imagesInput.addEventListener('change', (e) => {
      selectedFiles = Array.from(e.target.files).slice(0, 10);
      renderNewPreview();
    });

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      selectedFiles = [...selectedFiles, ...files].slice(0, 10);
      imagesInput.files = new DataTransfer().items ?
        Object.assign(new DataTransfer(), { items: selectedFiles }).files :
        selectedFiles;
      renderNewPreview();
    });

    // Handle existing images deletion
    if (existingImagesPreview) {
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-existing')) {
          e.preventDefault();
          const imageId = e.target.dataset.imageId;
          deletedImageIds.push(imageId);
          e.target.closest('.image-preview-item').remove();
        }
      });

      // Add hidden input for deleted images
      const form = document.querySelector('.form-card');
      if (form) {
        form.addEventListener('submit', () => {
          if (deletedImageIds.length > 0) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'deleted_images';
            input.value = deletedImageIds.join(',');
            form.appendChild(input);
          }
        });
      }

      setupDragDrop();
    }
  }

  function renderNewPreview() {
    imagesPreview.innerHTML = selectedFiles.map((file, idx) => `
      <div class="image-preview-item" draggable="true" data-index="${idx}">
        <img src="${URL.createObjectURL(file)}" alt="Preview ${idx + 1}">
        <button type="button" class="image-preview-remove" data-index="${idx}">×</button>
      </div>
    `).join('');

    // Remove button
    imagesPreview.querySelectorAll('.image-preview-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const idx = parseInt(btn.dataset.index);
        selectedFiles.splice(idx, 1);
        renderNewPreview();
      });
    });

    setupDragDrop();
  }

  function setupDragDrop() {
    const allItems = document.querySelectorAll('.image-preview-item');
    let draggedItem = null;

    allItems.forEach(item => {
      item.addEventListener('dragstart', () => {
        draggedItem = item;
        item.classList.add('dragging');
      });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        allItems.forEach(i => i.classList.remove('drag-over'));
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        if (draggedItem && draggedItem !== item) {
          if (draggedItem.parentElement === item.parentElement) {
            const parent = item.parentElement;
            const children = Array.from(parent.children);
            const dragIdx = children.indexOf(draggedItem);
            const targetIdx = children.indexOf(item);

            if (dragIdx < targetIdx) {
              item.parentElement.insertBefore(draggedItem, item.nextSibling);
            } else {
              item.parentElement.insertBefore(draggedItem, item);
            }

            if (!draggedItem.classList.contains('existing-image')) {
              const dragIndex = parseInt(draggedItem.dataset.index);
              const targetIndex = parseInt(item.dataset.index);
              [selectedFiles[dragIndex], selectedFiles[targetIndex]] = [selectedFiles[targetIndex], selectedFiles[dragIndex]];
            }
          }
        }
        item.classList.remove('drag-over');
      });
    });
  }

  // Mark first thumbnail as active
  switchToImage(0);
});
