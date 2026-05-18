$(function () {
  function applyFilters() {
    const params = new URLSearchParams();
    const search = $('#search').val().trim();
    const categoryId = $('#category-filter').val();
    const condition = $('#condition-filter').val();
    const sort = $('#sort-filter').val();
    const limit = $('#limit-filter').val();

    if (search) params.set('search', search);
    if (categoryId) params.set('category_id', categoryId);
    if (condition) params.set('condition', condition);
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', limit);
    params.set('page', '1');

    window.location.href = '?' + params.toString();
  }

  let debounceTimer;
  $('#search').on('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyFilters, 500);
  });

  $('#search').on('keydown', function (e) {
    if (e.key === 'Enter') {
      clearTimeout(debounceTimer);
      applyFilters();
    }
  });

  $('#category-filter').on('change', applyFilters);
  $('#condition-filter').on('change', applyFilters);
  $('#sort-filter').on('change', applyFilters);
  $('#limit-filter').on('change', applyFilters);

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
