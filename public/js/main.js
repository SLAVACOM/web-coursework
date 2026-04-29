$(function () {
  const CONDITION_CLASS = {
    'отличное':          'excellent',
    'хорошее':           'good',
    'удовлетворительное':'fair',
    'плохое':            'poor',
  };

  const canEdit = ['admin', 'storekeeper'].includes(window.APP_ROLE);

  function renderTools(tools) {
    if (!tools.length) {
      $('#tools-grid').html('<p class="empty"><span class="empty-icon">🔍</span>Инвентарь не найден</p>');
      return;
    }

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
    }, renderTools);
  }

  let debounceTimer;
  $('#search').on('input', function () {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadTools, 300);
  });

  $('#category-filter').on('change', loadTools);
});
