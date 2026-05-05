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

  // Image gallery thumbnail switching
  $('.gallery-thumb').on('click', function () {
    const filename = $(this).data('filename');
    const imageId = $(this).data('image-id');

    $('#main-image').attr('src', '/uploads/' + filename);
    $('.gallery-thumb').removeClass('active');
    $(this).addClass('active');

    // Update delete button
    const deleteForm = $('.image-delete-btn form');
    if (deleteForm.length) {
      deleteForm.attr('action', `/tools/${deleteForm.attr('action').split('/')[2]}/images/${imageId}/delete`);
    }
  });

  // Mark first thumbnail as active
  $('.gallery-thumb').first().addClass('active');
});
