/* ============================================================
 * 知飞赛事 · 模块一前端逻辑
 * 纯前端 SPA：localStorage 持久化 + 视图路由
 * ============================================================ */
(function () {
  'use strict';

  /* ---------------- 数据层 ---------------- */
  const LS_KEY = 'zhifei.events.v1';
  const SEED_VERSION = 'seed-v1';

  const STATUS_META = {
    draft:     { label: '草稿',   cls: 'draft' },
    ready:     { label: '筹备中', cls: 'ready' },
    running:   { label: '进行中', cls: 'running' },
    finished:  { label: '已结束', cls: 'finished' },
    archived:  { label: '已归档', cls: 'archived' },
    stopped:   { label: '已停用', cls: 'stopped' },
  };

  const TYPE_META = {
    '无人机足球':     { icon: '⚽', color: '#06b6d4' },
    'POP 穿越':       { icon: '🛩️', color: '#8b5cf6' },
    '翼客虚拟飞行':   { icon: '🎮', color: '#f97316' },
    'FPV 竞速':       { icon: '🏁', color: '#ef4444' },
    '无人机表演':     { icon: '✨', color: '#10b981' },
    '其他':           { icon: '🚩', color: '#64748b' },
  };

  // 种子数据：方便首屏有内容展示
  const SEED_EVENTS = [
    {
      id: 'ev-seed-001',
      name: '2026 全国青少年无人机足球联赛 · 上海站',
      type: '无人机足球',
      startAt: '2026-10-15T09:00',
      endAt: '2026-10-17T18:00',
      location: '上海·国家会展中心 7H 馆',
      organizer: '中国航空运动协会',
      logo: '',
      intro: '面向 12-18 岁青少年选手，覆盖小学组、初中组、高中组三个组别，设有团体赛与个人技巧赛。',
      format: '小组赛+淘汰赛',
      teamCount: 32,
      groupCount: 8,
      perGroup: 4,
      qualifier: 2,
      status: 'ready',
      archived: false,
      stopped: false,
      createdAt: '2026-08-20T10:00',
      updatedAt: '2026-09-02T15:24',
    },
    {
      id: 'ev-seed-002',
      name: 'POP 穿越 · 城市夜飞挑战赛',
      type: 'POP 穿越',
      startAt: '2026-11-08T19:00',
      endAt: '2026-11-08T22:30',
      location: '深圳·南山区人才公园',
      organizer: '深圳无人机协会',
      logo: '',
      intro: '夜幕下的穿门竞速赛，城市地标元素结合灯光赛道，初学者友好。',
      format: '单败淘汰',
      teamCount: 16,
      groupCount: 0,
      perGroup: 0,
      qualifier: 0,
      status: 'draft',
      archived: false,
      stopped: false,
      createdAt: '2026-09-01T09:12',
      updatedAt: '2026-09-03T11:40',
    },
    {
      id: 'ev-seed-003',
      name: '翼客虚拟飞行 · 全国高校联赛',
      type: '翼客虚拟飞行',
      startAt: '2026-08-20T14:00',
      endAt: '2026-08-22T20:00',
      location: '线上 · 知飞赛事平台',
      organizer: '知飞 SaaS · 高校电竞联盟',
      logo: '',
      intro: '线上虚拟飞行赛，覆盖固定翼与多旋翼两类机型的竞速科目。',
      format: '小组循环赛',
      teamCount: 24,
      groupCount: 6,
      perGroup: 4,
      qualifier: 4,
      status: 'finished',
      archived: false,
      stopped: false,
      createdAt: '2026-07-15T08:00',
      updatedAt: '2026-08-23T22:00',
    },
    {
      id: 'ev-seed-004',
      name: 'FPV 竞速 · 海岸线公开赛',
      type: 'FPV 竞速',
      startAt: '2026-09-08T10:00',
      endAt: '2026-09-08T17:00',
      location: '厦门·环岛路沙滩',
      organizer: '厦门航空运动俱乐部',
      logo: '',
      intro: '海岸线穿越 + 障碍竞速双赛道，单败淘汰决出冠亚军。',
      format: '双败淘汰',
      teamCount: 12,
      groupCount: 0,
      perGroup: 0,
      qualifier: 0,
      status: 'running',
      archived: false,
      stopped: false,
      createdAt: '2026-08-10T16:00',
      updatedAt: '2026-09-08T10:05',
    },
  ];

  function loadEvents() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) {
        localStorage.setItem(LS_KEY, JSON.stringify({ version: SEED_VERSION, list: SEED_EVENTS }));
        return SEED_EVENTS.slice();
      }
      const data = JSON.parse(raw);
      if (!data || data.version !== SEED_VERSION) {
        localStorage.setItem(LS_KEY, JSON.stringify({ version: SEED_VERSION, list: SEED_EVENTS }));
        return SEED_EVENTS.slice();
      }
      return Array.isArray(data.list) ? data.list : [];
    } catch (e) {
      console.warn('localStorage 读取失败，使用空数据', e);
      return [];
    }
  }

  function saveEvents(list) {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ version: SEED_VERSION, list }));
    } catch (e) {
      console.warn('localStorage 写入失败', e);
    }
  }

  function uid() {
    return 'ev-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }

  function nowISO() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ---------------- 工具 ---------------- */
  function $(sel, root = document) { return root.querySelector(sel); }
  function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  function toast(msg, type = 'ok') {
    const el = $('#toast');
    el.className = 'toast show ' + type;
    el.textContent = msg;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.className = 'toast ' + type; }, 2200);
  }

  function confirmDialog(title, body, onOk) {
    const modal = $('#modal');
    $('#modalTitle').textContent = title;
    $('#modalBody').textContent = body;
    modal.hidden = false;
    const ok = $('#modalOk');
    const cancel = $('#modalCancel');
    function close() { modal.hidden = true; ok.onclick = null; cancel.onclick = null; }
    ok.onclick = () => { close(); onOk && onOk(); };
    cancel.onclick = close;
  }

  function fmtDate(s) {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fmtDateShort(s) {
    if (!s) return '—';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* ---------------- 视图路由 ---------------- */
  const VIEWS = ['list', 'form', 'detail'];
  let currentView = 'list';
  let editingId = null;
  let currentStep = 1;
  let logoDataUrl = '';
  let filters = { keyword: '', type: '', status: '' };

  function showView(name) {
    currentView = name;
    $('#viewList').hidden = name !== 'list';
    $('#viewForm').hidden = name !== 'form';
    $('#viewDetail').hidden = name !== 'detail';
    if (name === 'list') renderList();
    if (name === 'detail') renderDetail();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------------- 列表视图 ---------------- */
  function applyFilter(list) {
    return list.filter((e) => {
      if (e.archived && (!filters.status || filters.status !== 'archived')) {
        // 默认不展示已归档
      }
      if (filters.status === 'archived' && !e.archived) return false;
      if (filters.status && filters.status !== 'archived' && e.status !== filters.status) return false;
      if (e.archived) return false;
      if (filters.type && e.type !== filters.type) return false;
      if (filters.keyword) {
        const kw = filters.keyword.toLowerCase();
        const hay = `${e.name} ${e.organizer || ''} ${e.location || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }

  function updateCounts(list) {
    const tally = { draft: 0, ready: 0, running: 0, finished: 0, archived: 0, stopped: 0 };
    list.forEach((e) => { tally[e.status] = (tally[e.status] || 0) + 1; });
    $('#cnt-draft').textContent = tally.draft + tally.stopped;
    $('#cnt-ready').textContent = tally.ready;
    $('#cnt-running').textContent = tally.running;
    $('#cnt-finished').textContent = tally.finished;
  }

  function renderList() {
    const list = loadEvents();
    updateCounts(list);

    const filtered = applyFilter(list);
    const grid = $('#eventGrid');
    const empty = $('#emptyState');

    if (filtered.length === 0) {
      grid.innerHTML = '';
      empty.hidden = false;
      // 只有完全没数据时显示完整的空提示文案，有筛选则换文案
      if (list.length === 0) {
        $('.empty-sub', empty).textContent = '点击右上角「新建赛事」开始你的第一场赛事';
      } else {
        $('.empty-title', empty).textContent = '没有匹配的赛事';
        $('.empty-sub', empty).textContent = '试着调整一下搜索关键词或筛选条件';
      }
      return;
    }
    empty.hidden = true;

    grid.innerHTML = filtered.map(eventCardHTML).join('');

    // 绑定卡片操作
    $$('.event-card').forEach((card) => {
      const id = card.dataset.id;
      $('.act-edit', card).onclick = (e) => { e.stopPropagation(); startEdit(id); };
      $('.act-dup', card).onclick = (e) => { e.stopPropagation(); duplicateEvent(id); };
      $('.act-toggle', card).onclick = (e) => { e.stopPropagation(); toggleStop(id); };
      $('.act-archive', card).onclick = (e) => { e.stopPropagation(); archiveEvent(id); };
      card.addEventListener('click', () => openDetail(id));
    });

    // 卡片操作按钮互不影响卡片点击跳转
    $$('.event-card-foot .btn', grid).forEach((b) => {
      b.addEventListener('click', (e) => e.stopPropagation());
    });
  }

  function eventCardHTML(e) {
    const meta = TYPE_META[e.type] || TYPE_META['其他'];
    const status = e.stopped ? { label: '已停用', cls: 'stopped' }
                  : e.archived ? { label: '已归档', cls: 'archived' }
                  : STATUS_META[e.status] || STATUS_META.draft;
    const initial = (e.name || '?').trim().charAt(0).toUpperCase();
    const logoBlock = e.logo
      ? `<div class="event-logo"><img src="${escapeAttr(e.logo)}" alt="logo"/></div>`
      : `<div class="event-logo" style="background:${meta.color}">${escapeHTML(meta.icon || initial)}</div>`;

    const fmt = e.format ? `<span class="tag tag-format">${escapeHTML(e.format)}</span>` : '';
    const team = e.teamCount ? `<span class="tag">${e.teamCount} 队</span>` : '';

    // 停用按钮文案切换
    let toggleLabel = '停用';
    let toggleIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
    if (e.stopped) { toggleLabel = '启用'; toggleIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="6 4 20 12 6 20 6 4"/></svg>'; }

    return `
      <article class="event-card" data-id="${e.id}">
        <div class="row">
          ${logoBlock}
          <div style="min-width:0;flex:1">
            <div class="event-title">${escapeHTML(e.name || '未命名赛事')}</div>
            <div class="event-meta">
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                ${fmtDateShort(e.startAt)}${e.endAt ? ' ~ ' + fmtDateShort(e.endAt) : ''}
              </div>
              <div class="meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                ${escapeHTML(e.location || '地点待定')}
              </div>
            </div>
          </div>
          <span class="status-pill" data-status="${status.cls}">${status.label}</span>
        </div>

        <div class="event-tags">
          <span class="tag tag-type">${escapeHTML(e.type || '其他')}</span>
          ${fmt}
          ${team}
        </div>

        <div class="event-card-foot">
          <button class="btn btn-ghost act-edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>
            编辑
          </button>
          <button class="btn btn-ghost act-dup">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            复制
          </button>
          <button class="btn btn-ghost act-toggle">${toggleIcon}${toggleLabel}</button>
          <button class="btn btn-danger act-archive">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><path d="M17 4v16"/><path d="M3 4h18"/></svg>
            归档
          </button>
        </div>
      </article>
    `;
  }

  /* ---------------- 操作 ---------------- */
  function startEdit(id) {
    const list = loadEvents();
    const target = list.find((x) => x.id === id);
    if (!target) return toast('赛事不存在', 'err');
    editingId = id;
    openForm(target);
  }

  function startCreate() {
    editingId = null;
    openForm({});
  }

  function openForm(target) {
    currentStep = 1;
    logoDataUrl = target.logo || '';
    $('#formTitle').textContent = editingId ? '编辑赛事' : '新建赛事';
    $('#formSub').textContent = editingId ? `编辑「${target.name || ''}」` : '填写基础信息、赛制设置即可创建一场赛事';

    const form = $('#eventForm');
    form.reset();
    // 字段回填
    form.name.value = target.name || '';
    form.type.value = target.type || '';
    form.startAt.value = target.startAt || '';
    form.endAt.value = target.endAt || '';
    form.location.value = target.location || '';
    form.organizer.value = target.organizer || '';
    form.intro.value = target.intro || '';
    form.teamCount.value = target.teamCount || '';
    form.groupCount.value = target.groupCount || '';
    form.perGroup.value = target.perGroup || '';
    form.qualifier.value = target.qualifier || '';
    // 赛制模式单选
    if (target.format) {
      const r = form.querySelector(`input[name="format"][value="${cssEscape(target.format)}"]`);
      if (r) r.checked = true;
    }
    updateFormatCards();
    updateStepper(1);
    renderPreview();
    renderLogoPreview();
    $('#introCount').textContent = (target.intro || '').length;

    showView('form');
  }

  function duplicateEvent(id) {
    const list = loadEvents();
    const target = list.find((x) => x.id === id);
    if (!target) return;
    confirmDialog(
      '复制赛事模板',
      `确认基于「${target.name}」复制一份新赛事？复制后状态将重置为草稿，可作为新一届模板快速复用办赛。`,
      () => {
        const copy = JSON.parse(JSON.stringify(target));
        copy.id = uid();
        copy.name = (target.name || '未命名') + ' · 副本';
        copy.status = 'draft';
        copy.archived = false;
        copy.stopped = false;
        copy.createdAt = nowISO();
        copy.updatedAt = nowISO();
        copy.startAt = '';
        copy.endAt = '';
        const next = [copy, ...list];
        saveEvents(next);
        toast('已复制为草稿，可在列表中继续编辑', 'ok');
        renderList();
      }
    );
  }

  function toggleStop(id) {
    const list = loadEvents();
    const target = list.find((x) => x.id === id);
    if (!target) return;
    if (target.stopped) {
      target.stopped = false;
      target.updatedAt = nowISO();
      saveEvents(list);
      toast('已重新启用', 'ok');
    } else {
      confirmDialog(
        '停用赛事',
        `确认停用「${target.name}」？停用后该赛事列表默认隐藏，可重新启用或归档。`,
        () => {
          target.stopped = true;
          target.updatedAt = nowISO();
          saveEvents(list);
          toast('已停用', 'ok');
          renderList();
        }
      );
      return;
    }
    renderList();
  }

  function archiveEvent(id) {
    const list = loadEvents();
    const target = list.find((x) => x.id === id);
    if (!target) return;
    confirmDialog(
      '归档赛事',
      `确认归档「${target.name}」？归档后将从主列表移走，可在左侧「归档赛事」筛选查看。`,
      () => {
        target.archived = true;
        target.status = 'archived';
        target.updatedAt = nowISO();
        saveEvents(list);
        toast('已归档', 'ok');
        renderList();
      }
    );
  }

  function openDetail(id) {
    const list = loadEvents();
    const target = list.find((x) => x.id === id);
    if (!target) return toast('赛事不存在', 'err');
    editingId = id;
    showView('detail');
  }

  function renderDetail() {
    const list = loadEvents();
    const e = list.find((x) => x.id === editingId);
    const box = $('#detailBody');
    if (!e) {
      box.innerHTML = '<div class="empty"><div class="empty-title">赛事已被删除</div></div>';
      return;
    }

    const meta = TYPE_META[e.type] || TYPE_META['其他'];
    const status = e.stopped ? STATUS_META.stopped : STATUS_META[e.status] || STATUS_META.draft;
    const logoBlock = e.logo
      ? `<div class="event-logo"><img src="${escapeAttr(e.logo)}" alt="logo"/></div>`
      : `<div class="event-logo" style="background:${meta.color}">${escapeHTML(meta.icon || (e.name||'?').charAt(0))}</div>`;

    box.innerHTML = `
      <div class="detail-head">
        ${logoBlock}
        <div style="flex:1;min-width:0">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <h2>${escapeHTML(e.name)}</h2>
            <span class="status-pill" data-status="${status.cls}">${status.label}</span>
          </div>
          <div class="sub">${escapeHTML(e.organizer || '—')} · 创建于 ${fmtDate(e.createdAt)}</div>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-cell"><div class="lbl">赛事类型</div><div class="val">${escapeHTML(e.type || '—')}</div></div>
        <div class="detail-cell"><div class="lbl">赛制模式</div><div class="val">${escapeHTML(e.format || '—')}</div></div>
        <div class="detail-cell"><div class="lbl">开始时间</div><div class="val">${fmtDate(e.startAt)}</div></div>
        <div class="detail-cell"><div class="lbl">结束时间</div><div class="val">${fmtDate(e.endAt)}</div></div>
        <div class="detail-cell"><div class="lbl">赛事地点</div><div class="val">${escapeHTML(e.location || '—')}</div></div>
        <div class="detail-cell"><div class="lbl">主办方</div><div class="val">${escapeHTML(e.organizer || '—')}</div></div>
        <div class="detail-cell"><div class="lbl">参赛队伍</div><div class="val">${e.teamCount || '—'} 支</div></div>
        <div class="detail-cell"><div class="lbl">晋级名额</div><div class="val">${e.qualifier || '—'} 队</div></div>
        <div class="detail-cell"><div class="lbl">分组 / 每组</div><div class="val">${(e.groupCount||'—')} 组 / ${(e.perGroup||'—')} 队</div></div>
      </div>
      ${e.intro ? `
        <div class="detail-section">
          <h4>赛事简介</h4>
          <div style="font-size:14px;line-height:1.7;color:#334155">${escapeHTML(e.intro).replace(/\n/g,'<br/>')}</div>
        </div>
      ` : ''}
    `;

    // 详情页动作
    $('#detailEdit').onclick = () => startEdit(e.id);
    $('#detailDuplicate').onclick = () => duplicateEvent(e.id);
    const arch = $('#detailArchive');
    arch.textContent = e.archived ? '取消归档' : '归档';
    arch.onclick = () => {
      const list2 = loadEvents();
      const t = list2.find((x) => x.id === e.id);
      t.archived = !t.archived;
      if (t.archived) t.status = 'archived';
      t.updatedAt = nowISO();
      saveEvents(list2);
      toast(t.archived ? '已归档' : '已恢复', 'ok');
      showView('list');
    };
  }

  /* ---------------- 表单 / 步骤 ---------------- */
  function updateStepper(step) {
    currentStep = step;
    $$('#stepper li').forEach((li) => {
      const n = Number(li.dataset.step);
      li.classList.remove('on', 'done');
      if (n === step) li.classList.add('on');
      else if (n < step) li.classList.add('done');
    });
    $$('.step-pane').forEach((pane) => {
      pane.hidden = Number(pane.dataset.pane) !== step;
    });
    $('#prevStep').hidden = step === 1;
    $('#saveDraft').hidden = step === 3;
    $('#nextStep').hidden = step === 3;
    $('#submitBtn').hidden = step !== 3;
    if (step === 3) renderPreview();
  }

  function updateFormatCards() {
    $$('.format-card').forEach((card) => {
      const input = card.querySelector('input');
      card.classList.toggle('checked', input && input.checked);
    });
  }

  function validateStep(step) {
    const f = $('#eventForm');
    if (step === 1) {
      const required = ['name', 'type', 'startAt', 'location'];
      for (const k of required) {
        if (!f[k].value.trim()) {
          toast(`请填写「${f[k].previousElementSibling.textContent.replace('*','').trim()}」`, 'err');
          f[k].focus();
          return false;
        }
      }
      if (f.endAt.value && f.endAt.value < f.startAt.value) {
        toast('结束时间不能早于开始时间', 'err');
        return false;
      }
    }
    if (step === 2) {
      const format = f.querySelector('input[name="format"]:checked');
      if (!format) { toast('请选择赛制模式', 'err'); return false; }
      if (!f.teamCount.value || Number(f.teamCount.value) < 2) {
        toast('请填写参赛队伍数（≥ 2）', 'err'); f.teamCount.focus(); return false;
      }
      if (format.value === '小组赛+淘汰赛' || format.value === '小组循环赛') {
        if (!f.groupCount.value || !f.perGroup.value || !f.qualifier.value) {
          toast('小组制请完整填写分组、每组队伍、晋级名额', 'err'); return false;
        }
        if (Number(f.groupCount.value) * Number(f.perGroup.value) !== Number(f.teamCount.value)) {
          toast(`分组不匹配：${f.groupCount.value}×${f.perGroup.value} 应等于 ${f.teamCount.value}`, 'err'); return false;
        }
        if (Number(f.qualifier.value) > Number(f.perGroup.value)) {
          toast('晋级名额不能大于每组队伍数', 'err'); return false;
        }
      }
    }
    return true;
  }

  function gatherForm() {
    const f = $('#eventForm');
    const fmt = (f.querySelector('input[name="format"]:checked') || {}).value || '';
    return {
      name: f.name.value.trim(),
      type: f.type.value,
      startAt: f.startAt.value,
      endAt: f.endAt.value,
      location: f.location.value.trim(),
      organizer: f.organizer.value.trim(),
      logo: logoDataUrl,
      intro: f.intro.value.trim(),
      format: fmt,
      teamCount: numOrNull(f.teamCount.value),
      groupCount: numOrNull(f.groupCount.value),
      perGroup: numOrNull(f.perGroup.value),
      qualifier: numOrNull(f.qualifier.value),
    };
  }

  function numOrNull(v) {
    if (v === '' || v == null) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  function renderPreview() {
    const data = gatherForm();
    const box = $('#previewBox');
    const meta = TYPE_META[data.type] || TYPE_META['其他'];
    const initial = (data.name || '?').trim().charAt(0).toUpperCase();
    const logoBlock = data.logo
      ? `<div class="event-logo"><img src="${escapeAttr(data.logo)}" alt="logo"/></div>`
      : `<div class="event-logo" style="background:${meta.color}">${escapeHTML(meta.icon || initial)}</div>`;
    box.innerHTML = `
      <div class="preview-head">
        ${logoBlock}
        <div style="flex:1;min-width:0">
          <h3>${escapeHTML(data.name || '未命名赛事')}</h3>
          <div class="sub">${data.type || '类型未选'} · ${data.format || '赛制未选'}</div>
        </div>
      </div>
      <div class="preview-grid">
        <div class="lbl">开始时间</div><div class="val">${fmtDate(data.startAt)}</div>
        <div class="lbl">结束时间</div><div class="val">${fmtDate(data.endAt)}</div>
        <div class="lbl">赛事地点</div><div class="val">${escapeHTML(data.location || '—')}</div>
        <div class="lbl">主办方</div><div class="val">${escapeHTML(data.organizer || '—')}</div>
        <div class="lbl">参赛队伍</div><div class="val">${data.teamCount || '—'} 支</div>
        <div class="lbl">晋级名额</div><div class="val">${data.qualifier || '—'} 队</div>
        <div class="lbl">分组 / 每组</div><div class="val">${data.groupCount || '—'} 组 / ${data.perGroup || '—'} 队</div>
      </div>
      ${data.intro ? `<div class="preview-intro">${escapeHTML(data.intro).replace(/\n/g,'<br/>')}</div>` : ''}
    `;
  }

  function renderLogoPreview() {
    const prev = $('#logoPreview');
    if (logoDataUrl) {
      prev.innerHTML = `<img src="${escapeAttr(logoDataUrl)}" alt="logo"/>`;
    } else {
      prev.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>`;
    }
  }

  function submitForm(status) {
    const list = loadEvents();
    const data = gatherForm();
    const now = nowISO();
    if (editingId) {
      const target = list.find((x) => x.id === editingId);
      if (!target) return toast('赛事不存在', 'err');
      Object.assign(target, data);
      target.status = status || target.status;
      target.updatedAt = now;
      saveEvents(list);
      toast('已更新赛事', 'ok');
    } else {
      const e = Object.assign({}, data, {
        id: uid(),
        status: status || 'draft',
        archived: false,
        stopped: false,
        createdAt: now,
        updatedAt: now,
      });
      saveEvents([e, ...list]);
      toast(status === 'ready' ? '已创建赛事（筹备中）' : '已保存为草稿', 'ok');
    }
    editingId = null;
    showView('list');
  }

  /* ---------------- 转义 ---------------- */
  function escapeHTML(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHTML(s); }
  function cssEscape(s) {
    return String(s).replace(/["\\]/g, '\\$&');
  }

  /* ---------------- 事件绑定 ---------------- */
  function bind() {
    // 新建按钮
    $('#newEventBtn').addEventListener('click', startCreate);
    $('#mobileNewBtn').addEventListener('click', startCreate);

    // 返回按钮
    $('#backToList').addEventListener('click', () => showView('list'));
    $('#backToList2').addEventListener('click', () => showView('list'));

    // 搜索
    let searchT;
    $('#searchInput').addEventListener('input', (e) => {
      clearTimeout(searchT);
      searchT = setTimeout(() => { filters.keyword = e.target.value.trim(); renderList(); }, 200);
    });
    $('#filterType').addEventListener('change', (e) => { filters.type = e.target.value; renderList(); });
    $('#filterStatus').addEventListener('change', (e) => { filters.status = e.target.value; renderList(); });
    $('#resetFilter').addEventListener('click', () => {
      filters = { keyword: '', type: '', status: '' };
      $('#searchInput').value = '';
      $('#filterType').value = '';
      $('#filterStatus').value = '';
      renderList();
    });

    // 状态卡片点击 → 筛选
    $$('.stat').forEach((el) => {
      el.addEventListener('click', () => {
        const s = el.dataset.status;
        filters.status = s;
        $('#filterStatus').value = s;
        renderList();
      });
    });

    // 步骤切换
    $('#nextStep').addEventListener('click', () => {
      if (!validateStep(currentStep)) return;
      if (currentStep < 3) updateStepper(currentStep + 1);
    });
    $('#prevStep').addEventListener('click', () => {
      if (currentStep > 1) updateStepper(currentStep - 1);
    });
    $('#saveDraft').addEventListener('click', () => {
      submitForm('draft');
    });
    $('#eventForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateStep(1) || !validateStep(2)) return;
      submitForm('ready');
    });

    // 简介字数
    $('#eventForm').intro.addEventListener('input', (e) => {
      $('#introCount').textContent = e.target.value.length;
    });

    // 赛制模式点击
    $$('.format-card input').forEach((r) => r.addEventListener('change', updateFormatCards));

    // Logo 上传
    $('#logoInput').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { toast('Logo 不能超过 2MB', 'err'); return; }
      const reader = new FileReader();
      reader.onload = () => { logoDataUrl = String(reader.result || ''); renderLogoPreview(); };
      reader.readAsDataURL(file);
    });
    $('#logoClear').addEventListener('click', () => {
      logoDataUrl = '';
      $('#logoInput').value = '';
      renderLogoPreview();
    });

    // 移动端抽屉
    $('#openDrawer').addEventListener('click', () => {
      $('#sidebar').classList.add('open');
      $('#backdrop').classList.add('show');
    });
    $('#closeDrawer').addEventListener('click', closeDrawer);
    $('#backdrop').addEventListener('click', closeDrawer);

    // 侧边栏导航
    $$('.nav-item').forEach((it) => {
      it.addEventListener('click', (e) => {
        e.preventDefault();
        $$('.nav-item').forEach((x) => x.classList.remove('active'));
        it.classList.add('active');
        const filter = it.dataset.filter;
        if (filter) {
          filters.status = filter;
          $('#filterStatus').value = filter;
        } else {
          filters.status = '';
          $('#filterStatus').value = '';
        }
        showView('list');
        closeDrawer();
      });
    });
  }

  function closeDrawer() {
    $('#sidebar').classList.remove('open');
    $('#backdrop').classList.remove('show');
  }

  /* ---------------- 启动 ---------------- */
  document.addEventListener('DOMContentLoaded', () => {
    bind();
    renderList();
  });
})();
