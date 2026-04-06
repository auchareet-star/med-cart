    /* ── Clock ── */
    function tick() {
        const now  = new Date();
        const time = now.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
        const date = now.toLocaleDateString('th-TH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
        document.querySelectorAll('[id^="clock"]').forEach(e => e.textContent = time);
        document.querySelectorAll('[id^="dateStr"]').forEach(e => e.textContent = date);
        const ghC = document.getElementById('ghClock');
        const ghD = document.getElementById('ghDate');
        if (ghC) ghC.textContent = time;
        if (ghD) ghD.textContent = date;
    }
    tick();
    setInterval(tick, 1000);

    /* ── Generic navigation ── */
    const pageNames = {
        'pg-cart':'ข้อมูลรถเข็นยา','pg-confirm':'ยืนยัน Ward','pg-ward-select':'เลือก Ward',
        'pg-login':'เข้าสู่ระบบ','pg-role':'เลือกสิทธิ์','pg-dashboard':'Dashboard',
        'pg-prep-type':'เลือกประเภทจัดยา','pg-hw':'เลือก Drawer','pg-fill':'จัดยาเข้าช่อง',
        'pg-summary':'สรุปผลจัดยา','pg-dispense':'รายการผู้ป่วย','pg-pt-detail':'รายละเอียดผู้ป่วย',
        'pg-scan-pt':'สแกนผู้ป่วย','pg-admin-med':'สแกนยา','pg-witness':'พยาน/IDC',
        'pg-omit':'งดให้ยา','pg-record':'บันทึกผล','pg-success':'สำเร็จ','pg-hardstop':'Hard Stop',
        'pg-routine':'จ่ายยาปกติ','pg-stat':'จ่ายยา STAT','pg-prn':'จ่ายยา PRN',
        'pg-highalert':'จ่ายยา High Alert','pg-omit-flow':'งดให้ยา','pg-overdue':'ยาเลยเวลา',
        'pg-prep-patient':'จัดยาตามผู้ป่วย','pg-prep-pt-drugs':'รายการยาผู้ป่วย',
        'pg-prep-fill-pt':'จัดยาลงช่อง','pg-prep-med':'จัดยาตามรายการยา',
        'pg-prep-med-detail':'รายละเอียดยา','pg-ibf':'จัดยาตามรายการ',
        'pg-prep-sched':'จัดยาตามเวลา','pg-sched-detail':'รายการรอบเวลา','pg-trf':'จัดยาตามรอบ',
        'pg-post-assess':'ประเมินหลังให้ยา'
    };

    // Pages that require dispense access (pharma blocked)
    const dispensePages = ['pg-routine','pg-stat','pg-prn','pg-highalert','pg-omit-flow','pg-overdue','pg-scan-pt','pg-admin-med','pg-witness','pg-omit','pg-record','pg-hardstop','pg-dispense','pg-pt-detail','pg-post-assess'];
    let currentRole = 'nurse';

    function nav(targetId, skipHistory) {
        // Block pharma from accessing dispense pages
        if (currentRole === 'pharma' && dispensePages.includes(targetId)) {
            showToast('เภสัชกรไม่มีสิทธิ์เข้าถึงหน้าจ่ายยา');
            setTimeout(() => showToast(''), 2500);
            return;
        }
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
        window.scrollTo(0, 0);
        if (!skipHistory) {
            history.pushState({ page: targetId }, '', '#' + targetId);
        }
        // Update global header page name
        const ghName = document.getElementById('ghPageName');
        if (ghName) ghName.textContent = pageNames[targetId] || '';
    }

    // Browser back/forward
    window.addEventListener('popstate', function(e) {
        if (e.state && e.state.page) {
            nav(e.state.page, true);
        } else {
            nav('pg-cart', true);
        }
    });

    // On load: restore page from URL hash (survive refresh)
    (function() {
        const hash = window.location.hash.replace('#','');
        if (hash && document.getElementById(hash)) {
            nav(hash, true);
            history.replaceState({ page: hash }, '', '#' + hash);
        } else {
            history.replaceState({ page: 'pg-cart' }, '', '#pg-cart');
        }
    })();

    /* ── Keep same ward → go to Login ── */
    function keepWard() {
        document.getElementById('loginWardLabel').textContent = 'Ward 3A';
        nav('pg-login');
    }

    /* ── Ward selection (Page 3) ── */
    const checkSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';

    function pickWard(el) {
        if (el.style.pointerEvents === 'none') return;
        document.querySelectorAll('.wc').forEach(w => {
            w.classList.remove('chosen');
            const r = w.querySelector('.wc-radio');
            if (r) r.innerHTML = '';
        });
        el.classList.add('chosen');
        const radio = el.querySelector('.wc-radio');
        if (radio) radio.innerHTML = checkSvg;

        const btn = document.getElementById('btnSelectConfirm');
        btn.disabled = false;

        // Update preview panel
        const name = el.querySelector('.wc-name');
        const desc = el.querySelector('.wc-desc');
        const beds = el.querySelector('.wc-stat strong');
        const patients = el.querySelectorAll('.wc-stat strong')[1];
        document.getElementById('wardPreviewEmpty').style.display = 'none';
        document.getElementById('wardPreviewSelected').style.display = '';
        document.getElementById('wpName').textContent = name ? name.textContent : '—';
        document.getElementById('wpDesc').textContent = desc ? desc.textContent : '—';
        if (beds) {
            const bedText = beds.parentElement.textContent.trim();
            document.getElementById('wpBeds').textContent = bedText;
        }
        if (patients) {
            const ptText = patients.parentElement.textContent.trim();
            document.getElementById('wpPatients').textContent = ptText;
        }

        // Scroll chosen into view
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function confirmNewWard() {
        const chosen = document.querySelector('.wc.chosen .wc-name');
        if (!chosen) return;
        document.getElementById('loginWardLabel').textContent = chosen.textContent;
        nav('pg-login');
    }

    /* ── Search / Filter ── */
    function filterWards() {
        const q = document.getElementById('wardSearch').value.trim().toLowerCase();
        const clearBtn = document.getElementById('searchClear');
        clearBtn.classList.toggle('show', q.length > 0);

        const cards = document.querySelectorAll('#wardList .wc');
        let visible = 0;

        cards.forEach(c => {
            const name  = (c.dataset.name  || '').toLowerCase();
            const desc  = (c.dataset.desc  || '').toLowerCase();
            const floor = (c.dataset.floor || '').toLowerCase();
            const match = !q || name.includes(q) || desc.includes(q) || floor.includes(q);
            c.style.display = match ? '' : 'none';
            if (match) visible++;
        });

        document.getElementById('wardEmpty').style.display = visible === 0 ? '' : 'none';

        const counter = document.getElementById('wardCount');
        if (q) {
            counter.innerHTML = 'ผลการค้นหา <strong>' + visible + '</strong> Ward';
        } else {
            counter.innerHTML = 'ทั้งหมด <strong>' + cards.length + '</strong> Ward';
        }
    }

    function clearSearch() {
        const input = document.getElementById('wardSearch');
        input.value = '';
        input.focus();
        filterWards();
    }

    /* ── Login ── */
    function switchTab(tab) {
        const segUser = document.getElementById('segUser');
        const segCard = document.getElementById('segCard');
        const panelUser = document.getElementById('panelUser');
        const panelCard = document.getElementById('panelCard');

        if (tab === 'user') {
            segUser.classList.add('active');
            segCard.classList.remove('active');
            panelUser.classList.add('active');
            panelCard.classList.remove('active');
        } else {
            segCard.classList.add('active');
            segUser.classList.remove('active');
            panelCard.classList.add('active');
            panelUser.classList.remove('active');
        }
        // Clear errors on tab switch
        document.getElementById('loginError').classList.remove('show');
        document.getElementById('cardError').classList.remove('show');
    }

    function togglePw() {
        const inp = document.getElementById('inputPw');
        const icon = document.getElementById('eyeIcon');
        if (inp.type === 'password') {
            inp.type = 'text';
            icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
        } else {
            inp.type = 'password';
            icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
        }
    }

    function showLoginError(msg) {
        const el = document.getElementById('loginError');
        document.getElementById('loginErrorMsg').textContent = msg;
        el.classList.add('show');
    }

    function doCardLogin() {
        // Card scan → เข้าสิทธิ์หัวหน้าเวรโดยตรง
        selectRole('super','นส.ปราณี หัวหน้าเวร','หัวหน้าเวร');
    }

    function selectRole(role, name, roleText) {
        currentRole = role;
        name = name || 'คุณสมใจ';
        roleText = roleText || {nurse:'พยาบาล',pharma:'เภสัชกร',super:'หัวหน้าเวร'}[role];

        const ward = document.getElementById('loginWardLabel')?.textContent || 'Ward 3A';
        document.getElementById('dashWard').textContent = ward;

        // Update welcome name
        const welcomeH1 = document.getElementById('dashWelcomeName');
        if (welcomeH1) welcomeH1.textContent = name;

        // Update banner gradient per role
        const banner = document.getElementById('dashBanner');
        if (banner) {
            const gradients = {
                nurse:  'linear-gradient(135deg,#0a5c55 0%,#0F766E 30%,#0D9488 65%,#0ea59a 100%)',
                pharma: 'linear-gradient(135deg,#1e3a8a 0%,#1D4ED8 30%,#3B82F6 65%,#60A5FA 100%)',
                super:  'linear-gradient(135deg,#3b0764 0%,#5B21B6 30%,#7C3AED 65%,#a855f7 100%)'
            };
            banner.style.background = gradients[role] || gradients.super;
        }

        // Update header avatar/name
        const avatarEl = document.querySelector('#pg-dashboard .hdr-avatar');
        if (avatarEl) avatarEl.textContent = name.substring(0,2).replace(/[ภญนส.]/g,'');
        const nameEl = document.querySelector('#pg-dashboard .hdr-user-name');
        if (nameEl) nameEl.textContent = name;
        const roleEl = document.querySelector('#pg-dashboard .hdr-user-role');
        if (roleEl) roleEl.textContent = roleText;

        // Show/disable action cards based on role
        const dashEl = document.getElementById('pg-dashboard');
        const dispenseBtn = dashEl?.querySelector('.db-action[onclick*="pg-routine"]');
        const prepBtn = dashEl?.querySelector('.db-action[onclick*="goToPrepType"]');

        if (dispenseBtn) {
            const noAccess = role === 'pharma';
            dispenseBtn.style.opacity = noAccess ? '0.45' : '';
            dispenseBtn.style.pointerEvents = noAccess ? 'none' : '';
            dispenseBtn.style.filter = noAccess ? 'grayscale(0.6)' : '';
            // Add/remove lock overlay
            let lock = dispenseBtn.querySelector('.lock-overlay');
            if (noAccess && !lock) {
                lock = document.createElement('div');
                lock.className = 'lock-overlay';
                lock.style.cssText = 'position:absolute;inset:0;background:rgba(255,255,255,0.5);backdrop-filter:blur(2px);border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;';
                lock.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><div style="font-size:12px;font-weight:600;color:#94a3b8;margin-top:6px;">ไม่มีสิทธิ์เข้าถึง</div>';
                dispenseBtn.appendChild(lock);
            } else if (!noAccess && lock) {
                lock.remove();
            }
        }

        if (prepBtn) {
            const noAccess = role === 'nurse';
            prepBtn.style.opacity = noAccess ? '0.45' : '';
            prepBtn.style.pointerEvents = noAccess ? 'none' : '';
            prepBtn.style.filter = noAccess ? 'grayscale(0.6)' : '';
            let lock = prepBtn.querySelector('.lock-overlay');
            if (noAccess && !lock) {
                lock = document.createElement('div');
                lock.className = 'lock-overlay';
                lock.style.cssText = 'position:absolute;inset:0;background:rgba(255,255,255,0.5);backdrop-filter:blur(2px);border-radius:20px;display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:2;';
                lock.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><div style="font-size:12px;font-weight:600;color:#94a3b8;margin-top:6px;">ไม่มีสิทธิ์เข้าถึง</div>';
                prepBtn.appendChild(lock);
            } else if (!noAccess && lock) {
                lock.remove();
            }
        }

        // db-actions is always 2 columns; alerts row is a separate element

        // Inject role-specific section
        const sec = document.getElementById('dashRoleSection');
        if (sec) sec.innerHTML = getRoleSectionHTML(role, name, roleText);

        // Inject bottom section (super: team + performance below schedule/activity)
        const secBottom = document.getElementById('dashRoleBottom');
        if (secBottom) secBottom.innerHTML = getRoleBottomHTML(role);

        // Hide quick alerts for super role
        const quickAlerts = document.getElementById('dashQuickAlerts');
        if (quickAlerts) {
            quickAlerts.style.display = role === 'super' ? 'none' : '';
        }

        // Disable dispense-related cards for pharma
        const dispenseKeywords = ['pg-stat','pg-prn','pg-highalert','pg-routine','pg-omit-flow','pg-overdue'];
        dashEl?.querySelectorAll('[onclick]').forEach(card => {
            const onclick = card.getAttribute('onclick') || '';
            const isDispense = dispenseKeywords.some(k => onclick.includes(k));
            if (role === 'pharma' && isDispense) {
                card.style.opacity = '0.4';
                card.style.pointerEvents = 'none';
                card.style.filter = 'grayscale(0.5)';
                card.style.position = 'relative';
                // Add lock icon if not already there
                if (!card.querySelector('.lock-mini')) {
                    const lk = document.createElement('div');
                    lk.className = 'lock-mini';
                    lk.style.cssText = 'position:absolute;top:6px;right:6px;width:22px;height:22px;background:rgba(148,163,184,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:2;';
                    lk.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';
                    card.appendChild(lk);
                }
            } else {
                card.style.opacity = '';
                card.style.pointerEvents = '';
                card.style.filter = '';
                const lk = card.querySelector('.lock-mini');
                if (lk) lk.remove();
            }
        });

        // Show user section in header
        document.body.classList.add('logged-in');
        document.getElementById('ghUserSection').style.display = 'flex';
        // Update global header info
        document.getElementById('ghUserName').textContent = name;
        document.getElementById('ghUserRole').textContent = roleText;
        document.getElementById('ghAvatar').textContent = name.substring(0,2).replace(/[ภญนส.]/g,'');
        const avatarColors = {nurse:'var(--green)',pharma:'#3b82f6',super:'#7c3aed'};
        document.getElementById('ghAvatar').style.background = 'linear-gradient(135deg,' + (avatarColors[role]||'var(--green)') + ',#5db840)';

        nav('pg-dashboard');
        showToast('เข้าสู่ระบบ: ' + name + ' (' + roleText + ')');
        setTimeout(() => showToast(''), 2500);
    }

    function getRoleSectionHTML(role, name, roleText) {
        const glass = 'background:rgba(255,255,255,0.9);backdrop-filter:blur(14px);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow);';

        if (role === 'nurse') {
            return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">'
                // Urgent patients
                +'<div style="'+glass+'padding:18px 20px;">'
                +'<div style="font-size:14px;font-weight:600;color:var(--text-1);margin-bottom:14px;display:flex;align-items:center;gap:6px;">'
                +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
                +'<span>ผู้ป่วยที่ต้องจ่ายยาเร่งด่วน</span>'
                +'<span style="margin-left:auto;background:#fef2f2;color:#ef4444;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">3 ราย</span></div>'
                +'<div style="display:flex;flex-direction:column;gap:8px;">'
                +'<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fef2f2;border-radius:10px;border-left:3px solid #ef4444;cursor:pointer;" onclick="nav(\'pg-routine\')">'
                +'<div><div style="font-size:13px;font-weight:600;color:var(--text-1);">ธนกร วิเศษสิทธิ์ · 3A-10</div><div style="font-size:11px;color:#ef4444;">STAT · Heparin 5000u · เลยเวลา 48 นาที</div></div>'
                +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2" style="margin-left:auto;flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg></div>'
                +'<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff7ed;border-radius:10px;border-left:3px solid #f59e0b;cursor:pointer;" onclick="nav(\'pg-routine\')">'
                +'<div><div style="font-size:13px;font-weight:600;color:var(--text-1);">มาลี สุขใจ · 3A-03</div><div style="font-size:11px;color:#d97706;">ใกล้ถึงเวลา · 4 รายการยา · อีก 15 นาที</div></div>'
                +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2" style="margin-left:auto;flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg></div>'
                +'<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#f5f3ff;border-radius:10px;border-left:3px solid #7c3aed;cursor:pointer;" onclick="nav(\'pg-prn\')">'
                +'<div><div style="font-size:13px;font-weight:600;color:var(--text-1);">สมชาย มานะ · 3A-01</div><div style="font-size:11px;color:#7c3aed;">PRN · Morphine 5mg · Pain score 7/10</div></div>'
                +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" stroke-width="2" style="margin-left:auto;flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg></div>'
                +'</div></div>'
                // My shift summary
                +'<div style="'+glass+'padding:18px 20px;">'
                +'<div style="font-size:14px;font-weight:600;color:var(--text-1);margin-bottom:14px;display:flex;align-items:center;gap:6px;">'
                +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
                +'สรุปเวรของฉัน</div>'
                +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">'
                +'<div style="background:var(--green-light);border-radius:12px;padding:14px;text-align:center;"><div style="font-size:24px;font-weight:700;color:var(--green);">16</div><div style="font-size:10px;color:var(--text-2);margin-top:2px;">จ่ายยาแล้ว</div></div>'
                +'<div style="background:#fff7ed;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:24px;font-weight:700;color:#f59e0b;">8</div><div style="font-size:10px;color:var(--text-2);margin-top:2px;">รอจ่าย</div></div>'
                +'<div style="background:#eff6ff;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:24px;font-weight:700;color:#3b82f6;">2</div><div style="font-size:10px;color:var(--text-2);margin-top:2px;">งดให้ยา</div></div>'
                +'<div style="background:#fef2f2;border-radius:12px;padding:14px;text-align:center;"><div style="font-size:24px;font-weight:700;color:#ef4444;">0</div><div style="font-size:10px;color:var(--text-2);margin-top:2px;">ผิดพลาด</div></div>'
                +'</div></div>'
                +'</div>';
        }

        if (role === 'pharma') {
            return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">'
                // Stock alert
                +'<div style="'+glass+'padding:18px 20px;">'
                +'<div style="font-size:14px;font-weight:600;color:var(--text-1);margin-bottom:14px;display:flex;align-items:center;gap:6px;">'
                +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                +'<span>Stock ยาใกล้หมด</span>'
                +'<span style="margin-left:auto;background:#fff7ed;color:#d97706;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;">4 รายการ</span></div>'
                +'<div style="display:flex;flex-direction:column;gap:8px;">'
                +'<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fef2f2;border-radius:10px;border-left:3px solid #ef4444;">'
                +'<div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--text-1);">Heparin 5000u Inj</div><div style="font-size:11px;color:#ef4444;">เหลือ 3 vials · ต่ำกว่า safety stock</div></div>'
                +'<div style="font-size:16px;font-weight:700;color:#ef4444;">3</div></div>'
                +'<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff7ed;border-radius:10px;border-left:3px solid #f59e0b;">'
                +'<div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--text-1);">Omeprazole 20mg Cap</div><div style="font-size:11px;color:#d97706;">เหลือ 12 แคปซูล</div></div>'
                +'<div style="font-size:16px;font-weight:700;color:#f59e0b;">12</div></div>'
                +'<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff7ed;border-radius:10px;border-left:3px solid #f59e0b;">'
                +'<div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--text-1);">Morphine 5mg/mL Inj</div><div style="font-size:11px;color:#d97706;">เหลือ 5 vials · ยาเสพติด</div></div>'
                +'<div style="font-size:16px;font-weight:700;color:#f59e0b;">5</div></div>'
                +'</div></div>'
                // Cassette status
                +'<div style="'+glass+'padding:18px 20px;">'
                +'<div style="font-size:14px;font-weight:600;color:var(--text-1);margin-bottom:14px;display:flex;align-items:center;gap:6px;">'
                +'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>'
                +'สถานะ Cassette</div>'
                +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px;">'
                +'<div style="background:var(--green-light);border-radius:8px;padding:10px 6px;text-align:center;"><div style="font-size:14px;font-weight:700;color:var(--green);">D1</div><div style="font-size:9px;color:var(--text-2);">4/4</div></div>'
                +'<div style="background:var(--green-light);border-radius:8px;padding:10px 6px;text-align:center;"><div style="font-size:14px;font-weight:700;color:var(--green);">D2</div><div style="font-size:9px;color:var(--text-2);">4/4</div></div>'
                +'<div style="background:#eff6ff;border-radius:8px;padding:10px 6px;text-align:center;"><div style="font-size:14px;font-weight:700;color:#3b82f6;">D3</div><div style="font-size:9px;color:var(--text-2);">3/4</div></div>'
                +'<div style="background:var(--bg);border-radius:8px;padding:10px 6px;text-align:center;"><div style="font-size:14px;font-weight:700;color:var(--text-3);">D4</div><div style="font-size:9px;color:var(--text-2);">0/4</div></div>'
                +'<div style="background:var(--green-light);border-radius:8px;padding:10px 6px;text-align:center;"><div style="font-size:14px;font-weight:700;color:var(--green);">D5</div><div style="font-size:9px;color:var(--text-2);">4/4</div></div>'
                +'<div style="background:#fff7ed;border-radius:8px;padding:10px 6px;text-align:center;"><div style="font-size:14px;font-weight:700;color:#f59e0b;">D6</div><div style="font-size:9px;color:var(--text-2);">2/4</div></div>'
                +'</div>'
                +'<div style="display:flex;gap:10px;font-size:11px;">'
                +'<div style="display:flex;align-items:center;gap:4px;"><div style="width:8px;height:8px;background:var(--green);border-radius:2px;"></div> พร้อม (17)</div>'
                +'<div style="display:flex;align-items:center;gap:4px;"><div style="width:8px;height:8px;background:#3b82f6;border-radius:2px;"></div> บางส่วน (3)</div>'
                +'<div style="display:flex;align-items:center;gap:4px;"><div style="width:8px;height:8px;background:var(--text-3);border-radius:2px;"></div> ว่าง (4)</div>'
                +'</div></div>'
                +'</div>';
        }

        // Super — only quick actions in top section (team + performance move to bottom)
        return '';
    }

    function getRoleBottomHTML(role) {
        if (role !== 'super') return '';
        const glass = 'background:rgba(255,255,255,0.9);backdrop-filter:blur(14px);border:1px solid var(--border);border-radius:18px;box-shadow:var(--shadow);';
        return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;">'
            // Team overview
            +'<div style="'+glass+'padding:20px 22px;">'
            +'<div style="font-size:14px;font-weight:600;color:var(--text-1);margin-bottom:16px;display:flex;align-items:center;gap:8px;">'
            +'<div style="width:28px;height:28px;background:#f5f3ff;border-radius:8px;display:flex;align-items:center;justify-content:center;">'
            +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>'
            +'</div>ทีมที่ปฏิบัติงาน'
            +'<span style="margin-left:auto;font-size:10px;font-weight:600;color:#7c3aed;background:#f5f3ff;padding:2px 10px;border-radius:8px;">3 คน</span></div>'
            +'<div style="display:flex;flex-direction:column;gap:10px;">'
            +'<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#f0fdf4;border-radius:12px;">'
            +'<div style="width:38px;height:38px;background:linear-gradient(135deg,var(--green),#14B8A6);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;">สจ</div>'
            +'<div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--text-1);">นส.สมใจ ดีมาก</div><div style="font-size:11px;color:#0D9488;margin-top:1px;">พยาบาล · กำลังจ่ายยา</div></div>'
            +'<div style="width:8px;height:8px;background:#4ade80;border-radius:50%;"></div></div>'
            +'<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#eff6ff;border-radius:12px;">'
            +'<div style="width:38px;height:38px;background:linear-gradient(135deg,#3b82f6,#60a5fa);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;">วภ</div>'
            +'<div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--text-1);">ภญ.วิภา เจริญยา</div><div style="font-size:11px;color:#3b82f6;margin-top:1px;">เภสัชกร · กำลังจัดยา</div></div>'
            +'<div style="width:8px;height:8px;background:#4ade80;border-radius:50%;"></div></div>'
            +'<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:#f8fafc;border-radius:12px;">'
            +'<div style="width:38px;height:38px;background:linear-gradient(135deg,#64748b,#94a3b8);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0;">วร</div>'
            +'<div style="flex:1;"><div style="font-size:13px;font-weight:600;color:var(--text-1);">นส.วรรณา รุ่งเรือง</div><div style="font-size:11px;color:var(--text-3);margin-top:1px;">พยาบาล · ว่าง</div></div>'
            +'<div style="width:8px;height:8px;background:#e2e8f0;border-radius:50%;"></div></div>'
            +'</div></div>'
            // Performance
            +'<div style="'+glass+'padding:20px 22px;">'
            +'<div style="font-size:14px;font-weight:600;color:var(--text-1);margin-bottom:16px;display:flex;align-items:center;gap:8px;">'
            +'<div style="width:28px;height:28px;background:#fffbeb;border-radius:8px;display:flex;align-items:center;justify-content:center;">'
            +'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>'
            +'</div>ประสิทธิภาพเวรนี้</div>'
            +'<div style="display:flex;flex-direction:column;gap:14px;">'
            +'<div><div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:6px;"><span style="color:var(--text-2);">ตรงเวลา</span><span style="font-weight:700;color:var(--green);font-size:14px;">87%</span></div><div style="width:100%;height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;"><div style="width:87%;height:100%;background:linear-gradient(90deg,#0D9488,#14B8A6);border-radius:4px;"></div></div></div>'
            +'<div><div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:6px;"><span style="color:var(--text-2);">7 Rights ผ่าน</span><span style="font-weight:700;color:#3b82f6;font-size:14px;">100%</span></div><div style="width:100%;height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;"><div style="width:100%;height:100%;background:linear-gradient(90deg,#3b82f6,#60a5fa);border-radius:4px;"></div></div></div>'
            +'<div><div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:6px;"><span style="color:var(--text-2);">Overdue rate</span><span style="font-weight:700;color:#f59e0b;font-size:14px;">13%</span></div><div style="width:100%;height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;"><div style="width:13%;height:100%;background:linear-gradient(90deg,#f59e0b,#fbbf24);border-radius:4px;"></div></div></div>'
            +'<div><div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:6px;"><span style="color:var(--text-2);">Error rate</span><span style="font-weight:700;color:var(--green);font-size:14px;">0%</span></div><div style="width:100%;height:7px;background:#f1f5f9;border-radius:4px;overflow:hidden;"><div style="width:0%;height:100%;background:#ef4444;border-radius:4px;"></div></div></div>'
            +'</div></div>'
            +'</div>';
    }

    function startCardScan(mode) {
        const box = document.getElementById('cardScanBox');
        const btn = document.getElementById('csScanBtn');

        // Hide all states
        document.getElementById('csIdle').style.display = 'none';
        document.getElementById('csScanning').style.display = 'none';
        document.getElementById('csSuccess').style.display = 'none';
        document.getElementById('csError').style.display = 'none';

        // Show scanning
        document.getElementById('csScanning').style.display = '';
        box.style.borderColor = 'rgba(255,255,255,0.5)';
        btn.disabled = true;
        btn.style.opacity = '.5';

        setTimeout(() => {
            document.getElementById('csScanning').style.display = 'none';

            if (mode === 'fail') {
                // Error state
                document.getElementById('csError').style.display = '';
                box.style.borderColor = 'rgba(239,68,68,0.5)';
                btn.disabled = false;
                btn.style.opacity = '1';

                // Auto-reset after 3s
                setTimeout(() => { resetCardScan(); }, 3000);
            } else {
                // Success state
                document.getElementById('csSuccess').style.display = '';
                box.style.borderColor = 'rgba(255,255,255,0.7)';
                box.style.background = 'rgba(255,255,255,0.2)';

                // Navigate to dashboard after showing success
                setTimeout(() => {
                    doCardLogin();
                    // Reset for next time
                    setTimeout(() => { resetCardScan(); }, 500);
                }, 1800);
            }
        }, 1500);
    }

    function resetCardScan() {
        document.getElementById('csIdle').style.display = '';
        document.getElementById('csScanning').style.display = 'none';
        document.getElementById('csSuccess').style.display = 'none';
        document.getElementById('csError').style.display = 'none';
        const box = document.getElementById('cardScanBox');
        box.style.borderColor = 'rgba(255,255,255,0.2)';
        box.style.background = 'rgba(255,255,255,0.12)';
        const btn = document.getElementById('csScanBtn');
        btn.disabled = false;
        btn.style.opacity = '1';
    }

    function doLogin() {
        const user = document.getElementById('inputUser').value.trim();
        const pw   = document.getElementById('inputPw').value;
        const errEl = document.getElementById('loginError');

        // Clear previous error
        errEl.classList.remove('show');
        document.getElementById('inputUser').classList.remove('error');
        document.getElementById('inputPw').classList.remove('error');

        if (!user || !pw) {
            if (!user) document.getElementById('inputUser').classList.add('error');
            if (!pw)   document.getElementById('inputPw').classList.add('error');
            showLoginError('กรุณากรอก Username และ Password ให้ครบ');
            return;
        }

        // Demo accounts: 3 roles
        const accounts = {
            'admin':   { pw:'1234', role:'nurse',  name:'นส.สมใจ ดีมาก',    roleText:'พยาบาล' },
            'admin_2': { pw:'1234', role:'pharma', name:'ภญ.วิภา เจริญยา',   roleText:'เภสัชกร' },
            'admin_3': { pw:'1234', role:'super',  name:'นส.ปราณี หัวหน้าเวร', roleText:'หัวหน้าเวร' }
        };

        const acct = accounts[user];
        if (acct && pw === acct.pw) {
            selectRole(acct.role, acct.name, acct.roleText);
        } else {
            document.getElementById('inputUser').classList.add('error');
            document.getElementById('inputPw').classList.add('error');
            showLoginError('Username หรือ Password ไม่ถูกต้อง');
        }
    }

    // Allow Enter key to submit login
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && document.getElementById('pg-login').classList.contains('active')) {
            const panel = document.getElementById('panelUser');
            if (panel.classList.contains('active')) doLogin();
        }
    });

    /* ── Prep type selection (Page 6) ── */
    let selectedPrepType = null;

    function goToPrepType() {
        const ward = document.getElementById('dashWard').textContent;
        document.getElementById('prepWardHeader').textContent = ward;
        document.getElementById('prepWardCtx').textContent = ward;
        nav('pg-prep-type');
    }

    function goToPrepFlow(type) {
        selectedPrepType = type;
        const labels = { patient: 'จัดยาตามผู้ป่วย', medication: 'จัดยาตามรายการยา', schedule: 'จัดยาตามรอบเวลา' };
        const ward = document.getElementById('prepWardCtx').textContent;

        if (type === 'patient') {
            document.getElementById('pbpWard').textContent = ward;
            nav('pg-prep-patient');
        } else if (type === 'medication') {
            document.getElementById('pbmWard').textContent = ward;
            nav('pg-prep-med');
        } else {
            // schedule
            document.getElementById('pbsWard').textContent = ward;
            nav('pg-prep-sched');
        }
        showToast('เลือก: ' + labels[type]);
        setTimeout(() => showToast(''), 1500);
    }

    /* ── Prep Patient Drugs: Drawer → Cassette flow ── */
    let ptDrugDrawerDone = false;
    let ptDrugCassDone = false;

    function ptDrugDrawerDoneUI(label, method) {
        ptDrugDrawerDone = true;
        const step1 = document.getElementById('ptDrugStep1');
        step1.style.border = '2px solid var(--green)';
        step1.style.background = 'rgba(240,253,250,0.9)';
        document.getElementById('ptDrugDrawerStatus').textContent = label;
        document.getElementById('ptDrugDrawerStatus').style.color = 'var(--green)';
        document.getElementById('ptDrugDrawerStatus').style.fontWeight = '600';
        // Replace buttons with done badge
        document.getElementById('ptDrugDrawerBtns').innerHTML = '<div style="background:var(--green);color:white;border-radius:10px;padding:10px 16px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:5px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> D1 ' + method + '</div>';
        // Enable Step 2
        const step2 = document.getElementById('ptDrugStep2');
        step2.style.opacity = '1';
        step2.style.pointerEvents = '';
        step2.style.border = '2px solid #F59E0B';
        step2.style.background = 'rgba(255,255,255,0.9)';
        document.getElementById('ptDrugStep2Badge').style.background = 'linear-gradient(135deg,#D97706,#F59E0B)';
        document.getElementById('ptDrugCassStatus').textContent = 'กรุณาสแกน Cassette เพื่อยืนยันช่อง';
        document.getElementById('ptDrugScanIcon').style.background = '#FFFBEB';
        document.getElementById('ptDrugScanIcon').style.borderColor = '#FDE68A';
        document.getElementById('ptDrugScanIcon').innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><path d="M2 7V2h5M17 2h5v5M22 17v5h-5M7 22H2v-5"/><line x1="7" y1="12" x2="17" y2="12"/></svg>';
        const btn2 = document.getElementById('ptDrugScanBtn');
        btn2.disabled = false;
        btn2.style.background = 'linear-gradient(135deg,#D97706,#F59E0B)';
        btn2.style.boxShadow = '0 4px 12px rgba(217,119,6,0.25)';

        showToast(method === 'เลือกแล้ว' ? 'เลือก Drawer 1 สำเร็จ' : 'สแกน Drawer 1 สำเร็จ');
        setTimeout(() => showToast(''), 1500);
    }

    function ptDrugSelectDrawer() {
        ptDrugDrawerDoneUI('เลือกด้วยตนเอง: Drawer 1 — D1', 'เลือกแล้ว');
    }

    function ptDrugScanDrawer() {
        ptDrugDrawerDoneUI('สแกนบาร์โค้ด: Drawer 1 — D1', 'สแกนแล้ว');
    }

    function ptDrugScanCassette() {
        ptDrugCassDone = true;
        // Update Step 2 to done
        const step2 = document.getElementById('ptDrugStep2');
        step2.style.border = '2px solid var(--green)';
        step2.style.background = 'rgba(240,253,250,0.9)';
        document.getElementById('ptDrugStep2Badge').style.background = 'var(--green)';
        document.getElementById('ptDrugCassStatus').textContent = 'สแกนสำเร็จ: Cassette A-01 — Slot A-01';
        document.getElementById('ptDrugCassStatus').style.color = 'var(--green)';
        document.getElementById('ptDrugCassStatus').style.fontWeight = '600';
        document.getElementById('ptDrugScanIcon').style.background = 'var(--green-light)';
        document.getElementById('ptDrugScanIcon').style.borderColor = 'var(--green-mid)';
        document.getElementById('ptDrugScanIcon').innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--green)" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
        const btn2 = document.getElementById('ptDrugScanBtn');
        btn2.style.background = 'var(--green)';
        btn2.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg> A-01 สแกนแล้ว';

        // Enable start button
        const startBtn = document.getElementById('ptDrugStartBtn');
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
        startBtn.style.cursor = 'pointer';

        showToast('สแกน Cassette A-01 สำเร็จ — พร้อมจัดยา');
        setTimeout(() => showToast(''), 2000);
    }

    function filterPbp() {
        const q = document.getElementById('pbpSearch').value.trim().toLowerCase();
        document.querySelectorAll('#pbpList .pbp-card').forEach(c => {
            const name = (c.dataset.name || '').toLowerCase();
            const hn = (c.dataset.hn || '').toLowerCase();
            const bed = (c.dataset.bed || '').toLowerCase();
            c.style.display = (!q || name.includes(q) || hn.includes(q) || bed.includes(q)) ? '' : 'none';
        });
    }

    /* ── Time round fill (Page 33) ── */
    let trfActiveIdx = 0;
    let trfDoneCount = 0;

    function trfSelect(el, idx) {
        trfActiveIdx = idx;
        document.querySelectorAll('#trfQueue .trf-q').forEach(q => q.classList.remove('active'));
        if (!el.classList.contains('done')) el.classList.add('active');
        trfClear();
    }

    function trfScan() {
        const items = document.querySelectorAll('#trfQueue .trf-q');
        const drug = items[trfActiveIdx]?.querySelector('.trf-q-drug')?.textContent || 'ยา';
        document.getElementById('trfScanName').textContent = drug;
        document.getElementById('trfScanResult').classList.add('show');
        document.getElementById('trfBtnConfirm').disabled = false;
        showToast('สแกนยาสำเร็จ'); setTimeout(() => showToast(''), 1500);
    }

    function trfClear() {
        document.getElementById('trfScanResult').classList.remove('show');
        document.getElementById('trfBtnConfirm').disabled = true;
    }

    function trfConfirm() {
        const items = document.querySelectorAll('#trfQueue .trf-q');
        const item = items[trfActiveIdx];
        if (item && !item.classList.contains('done')) {
            item.classList.remove('active');
            item.classList.add('done');
            item.querySelector('.trf-q-check').innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            trfDoneCount++;
            document.getElementById('trfDone').textContent = trfDoneCount;
            document.getElementById('trfLeft').textContent = 24 - trfDoneCount;
        }
        trfClear();
        trfSkip();
        showToast('จัดยาเข้าช่องสำเร็จ'); setTimeout(() => showToast(''), 1500);
    }

    function trfSkip() {
        const items = document.querySelectorAll('#trfQueue .trf-q');
        for (let i = 0; i < items.length; i++) {
            if (!items[i].classList.contains('done')) { trfSelect(items[i], i); return; }
        }
        showToast('จัดยาครบทุกรายการในรอบนี้แล้ว'); setTimeout(() => showToast(''), 2000);
    }

    /* ── Time round detail toggle (Page 32) ── */
    function trdSwitch(view, btn) {
        document.querySelectorAll('.trd-toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('trdViewPt').style.display = view === 'patient' ? '' : 'none';
        document.getElementById('trdViewDrug').style.display = view === 'drug' ? '' : 'none';
    }

    /* ── Item-based fill (Page 30) ── */
    let ibfActiveIdx = 0;
    let ibfDoneCount = 0;
    const ibfQtys = [1,2,1,2]; // per destination

    function ibfSelect(el, idx) {
        ibfActiveIdx = idx;
        document.querySelectorAll('#ibfDestScroll .ibf-dest').forEach(d => d.classList.remove('active'));
        if (!el.classList.contains('done')) el.classList.add('active');
        ibfClear();
    }

    function ibfScan() {
        document.getElementById('ibfScanResult').classList.add('show');
        document.getElementById('ibfBtnConfirm').disabled = false;
        showToast('สแกนยาสำเร็จ — ตรงกับ Amlodipine 5 mg');
        setTimeout(() => showToast(''), 1500);
    }

    function ibfClear() {
        document.getElementById('ibfScanResult').classList.remove('show');
        document.getElementById('ibfBtnConfirm').disabled = true;
    }

    function ibfConfirm() {
        const dests = document.querySelectorAll('#ibfDestScroll .ibf-dest');
        const dest = dests[ibfActiveIdx];
        if (dest && !dest.classList.contains('done')) {
            dest.classList.remove('active');
            dest.classList.add('done');
            dest.querySelector('.ibf-dest-check').innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            ibfDoneCount += ibfQtys[ibfActiveIdx] || 1;
            document.getElementById('ibfDone').textContent = ibfDoneCount;
            document.getElementById('ibfLeft').textContent = 6 - ibfDoneCount;
        }
        ibfClear();
        // Auto-select next undone
        ibfSkip();
        showToast('จัดยาลงช่องสำเร็จ');
        setTimeout(() => showToast(''), 1500);
    }

    function ibfSkip() {
        const dests = document.querySelectorAll('#ibfDestScroll .ibf-dest');
        for (let i = 0; i < dests.length; i++) {
            if (!dests[i].classList.contains('done')) {
                ibfSelect(dests[i], i);
                return;
            }
        }
        showToast('จัดยาครบทุกปลายทางแล้ว — ไปหน้าสรุปผลได้');
        setTimeout(() => showToast(''), 2000);
    }

    /* ── Prep by medication search (Page 28) ── */
    function filterPbm() {
        const q = document.getElementById('pbmSearch').value.trim().toLowerCase();
        document.querySelectorAll('#pbmList .pbm-card').forEach(c => {
            const name = (c.dataset.name || '').toLowerCase();
            const code = (c.dataset.code || '').toLowerCase();
            c.style.display = (!q || name.includes(q) || code.includes(q)) ? '' : 'none';
        });
    }

    /* ── Prep fill by patient (Page 27) ── */
    let pfDoneCount = 0;
    const pfDrugNames = ['Amlodipine 5 mg','Metformin 500 mg','Omeprazole 20 mg','Heparin 5000 u'];
    let pfActiveIdx = 0;

    function pfSelect(el, idx) {
        pfActiveIdx = idx;
        document.querySelectorAll('#pfListScroll .pf-item').forEach(i => i.classList.remove('active'));
        if (!el.classList.contains('done')) el.classList.add('active');
        pfClearScan();
    }

    function pfScanDrug() {
        document.getElementById('pfScanResult').classList.add('show');
        document.getElementById('pfScanName').textContent = pfDrugNames[pfActiveIdx] || 'ยา';
        document.getElementById('pfBtnConfirm').disabled = false;
        showToast('สแกนยาสำเร็จ — ตรงกับรายการ');
        setTimeout(() => showToast(''), 1500);
    }

    function pfClearScan() {
        document.getElementById('pfScanResult').classList.remove('show');
        document.getElementById('pfBtnConfirm').disabled = true;
    }

    function pfConfirmDrug() {
        const items = document.querySelectorAll('#pfListScroll .pf-item');
        const item = items[pfActiveIdx];
        if (item && !item.classList.contains('done')) {
            item.classList.remove('active');
            item.classList.add('done');
            item.querySelector('.pf-check').innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
            pfDoneCount++;
            document.getElementById('pfProgress').textContent = 'จัดแล้ว ' + pfDoneCount + '/4';
        }
        pfClearScan();
        showToast('จัดยาเข้าช่องสำเร็จ');
        setTimeout(() => showToast(''), 1500);
    }

    function pfNextItem() {
        const items = document.querySelectorAll('#pfListScroll .pf-item');
        for (let i = 0; i < items.length; i++) {
            if (!items[i].classList.contains('done')) {
                pfSelect(items[i], i);
                return;
            }
        }
        showToast('จัดยาครบทุกรายการแล้ว — ไปหน้าสรุปผลได้');
        setTimeout(() => showToast(''), 2000);
    }

    /* ── Cassette state (shared across pages) ── */
    const cassState = { filled: 6, total: 24, selections: [] };

    function updateDashboardCassette() {
        const countEl = document.getElementById('dbCassCount');
        const infoEl  = document.getElementById('dbCassInfo');
        if (countEl) {
            countEl.innerHTML = cassState.filled
                + '<span style="font-size:15px;color:#CBD5E1;font-weight:500;">/' + cassState.total + '</span>';
        }
        if (infoEl) {
            if (cassState.selections.length > 0) {
                const last = cassState.selections[cassState.selections.length - 1];
                infoEl.textContent = last.drawer + ': ' + last.ids.join(', ');
            } else {
                infoEl.textContent = 'เติมยาในรถเข็น';
            }
        }
    }

    /* ── Drawer / Cassette selection (Page 7) ── */
    const drawerData = {
        1: { label:'Drawer 1', status:'ok', statusText:'พร้อมใช้งาน', cassettes:[
                {id:'A1',status:'ok',label:'พร้อมใช้งาน'},
                {id:'A2',status:'ok',label:'พร้อมใช้งาน'},
                {id:'A3',status:'empty',label:'ว่าง'},
                {id:'A4',status:'ok',label:'พร้อมใช้งาน'}
            ]},
        2: { label:'Drawer 2', status:'ok', statusText:'พร้อมใช้งาน', cassettes:[
                {id:'B1',status:'ok',label:'พร้อมใช้งาน'},
                {id:'B2',status:'ok',label:'พร้อมใช้งาน'},
                {id:'B3',status:'ok',label:'พร้อมใช้งาน'},
                {id:'B4',status:'empty',label:'ว่าง'}
            ]},
        3: { label:'Drawer 3', status:'ok', statusText:'พร้อมใช้งาน', cassettes:[
                {id:'C1',status:'ok',label:'พร้อมใช้งาน'},
                {id:'C2',status:'error',label:'ผิดปกติ'},
                {id:'C3',status:'ok',label:'พร้อมใช้งาน'},
                {id:'C4',status:'ok',label:'พร้อมใช้งาน'}
            ]},
        4: { label:'Drawer 4', status:'full', statusText:'เต็ม', cassettes:[
                {id:'D1',status:'full',label:'เต็ม'},
                {id:'D2',status:'full',label:'เต็ม'},
                {id:'D3',status:'full',label:'เต็ม'},
                {id:'D4',status:'full',label:'เต็ม'}
            ]}
    };

    function selectDrawer(el, num) {
        if (el.classList.contains('locked')) return;
        document.querySelectorAll('.dw-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        renderCassettes(num);
    }

    function renderCassettes(num) {
        const d = drawerData[num];
        if (!d) return;
        document.getElementById('cassDrawerLabel').textContent = d.label;
        const statusEl = document.getElementById('cassDrawerStatus');
        statusEl.className = 'dw-status ' + d.status;
        statusEl.innerHTML = (d.status==='ok'?'<span class="dot"></span> ':'')+d.statusText;
        document.getElementById('cassBadge').textContent = d.cassettes.length + ' Cassette';

        const grid = document.getElementById('cassGrid');
        const chkSvg = '<svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
        grid.innerHTML = d.cassettes.map(c => {
            const cls = c.status==='error'?'cass error':c.status==='empty'?'cass empty':c.status==='full'?'cass full':'cass';
            const click = c.status==='error'?'':'onclick="selectCass(this)"';
            return '<div class="'+cls+'" '+click+'>'
                +'<div class="cass-check">'+chkSvg+'</div>'
                +'<div class="cass-id">'+c.id+'</div>'
                +'<div class="cass-status-dot '+c.status+'"></div>'
                +'<div class="cass-lbl">'+c.label+'</div>'
                +'</div>';
        }).join('');

        document.getElementById('btnHwConfirm').disabled = true;
    }

    function selectCass(el) {
        if (el.classList.contains('error')) return;
        el.classList.toggle('selected');
        const any = document.querySelector('.cass.selected');
        document.getElementById('btnHwConfirm').disabled = !any;
    }

    function confirmHw() {
        const selected = document.querySelectorAll('.cass.selected');
        if (!selected.length) return;
        const ids = Array.from(selected).map(c => c.querySelector('.cass-id').textContent);
        // Pass context to fill page
        const activeDw = document.querySelector('.dw-btn.active .dw-num');
        const dwLabel = activeDw ? activeDw.textContent : 'D1';
        document.getElementById('fillDw').textContent = dwLabel;
        document.getElementById('fillCass').textContent = ids.join(', ');
        document.getElementById('fillWard').textContent = document.getElementById('hwWard').textContent.replace('Ward ','');
        // Save cassette selection to state
        cassState.selections.push({ drawer: dwLabel, ids: ids });
        cassState.filled = Math.min(cassState.filled + ids.length, cassState.total);
        updateDashboardCassette();
        // Reset scan state
        document.getElementById('scanResult').style.display = 'none';
        document.getElementById('btnConfirmFill').disabled = true;
        nav('pg-fill');
    }

    /* ── Fill page (Page 8) ── */
    function selectRx(el, idx) {
        document.querySelectorAll('.rx-item').forEach(r => r.classList.remove('active'));
        el.classList.add('active');
    }

    function selectSlot(el) {
        document.querySelectorAll('.cm-cell').forEach(c => c.classList.remove('active'));
        el.classList.add('active');
    }

    function demoScan() {
        document.getElementById('scanResult').style.display = '';
        document.getElementById('srStatus').className = 'sr-status pass';
        document.getElementById('srStatus').textContent = 'ผ่าน';
        document.getElementById('srDrugName').textContent = 'Amlodipine 5 mg';
        document.getElementById('btnConfirmFill').disabled = false;
        showToast('สแกนสำเร็จ — ยาถูกต้อง');
        setTimeout(() => showToast(''), 2000);
    }

    function clearScan() {
        document.getElementById('scanResult').style.display = 'none';
        document.getElementById('btnConfirmFill').disabled = true;
    }

    function confirmFill() {
        const activeSlot = document.querySelector('.cm-cell.active');
        if (activeSlot) {
            activeSlot.classList.remove('active');
            activeSlot.classList.add('done');
            activeSlot.querySelector('.cm-cell-lbl').textContent = 'จัดครบ';
            activeSlot.removeAttribute('onclick');
        }
        clearScan();
        showToast('ใส่ยาเข้าช่องสำเร็จ');
        setTimeout(() => showToast(''), 2000);
    }

    /* ── Dispense list (Page 10) ── */
    function goToDispense() {
        const ward = document.getElementById('dashWard').textContent;
        document.getElementById('dispWardHdr').textContent = ward;
        document.getElementById('dispWardChip').textContent = ward.replace('Ward ','');
        nav('pg-dispense');
    }

    function filterPt() {
        const q = document.getElementById('ptSearch').value.trim().toLowerCase();
        document.querySelectorAll('#ptList .pt-card').forEach(c => {
            const name = (c.dataset.name || '').toLowerCase();
            const hn   = (c.dataset.hn   || '').toLowerCase();
            const bed  = (c.dataset.bed  || '').toLowerCase();
            c.style.display = (!q || name.includes(q) || hn.includes(q) || bed.includes(q)) ? '' : 'none';
        });
    }

    function toggleFilter(el) {
        document.querySelectorAll('.disp-toolbar .filter-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }

    /* ── Overdue flow (Page 24) ── */
    let ovCurrentStep = 1;

    function ovGoStep(n) {
        ovCurrentStep = n;
        for(let i=1;i<=7;i++){const p=document.getElementById('ovStep'+i);if(p)p.classList.toggle('active',i===n);}
        document.querySelectorAll('#ovStepper .rt-step').forEach(s=>{const sn=parseInt(s.dataset.s);s.classList.remove('active','done');if(sn===n)s.classList.add('active');else if(sn<n)s.classList.add('done');});
        document.querySelectorAll('#ovStepper .rt-step-line').forEach((l,i)=>l.classList.toggle('done',i<n-1));
        if(n===6){
            const drugs = flowDrugText('ov');
            const confirmEl = document.getElementById('ovConfirmDrug');
            if (confirmEl) confirmEl.textContent = drugs;
        }
        if(n===7){
            document.getElementById('ovGivenTime').textContent=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})+' น.';
            const drugs = flowDrugText('ov');
            const sub = document.getElementById('ovSuccessSub');
            if (sub) sub.textContent = drugs + ' — นายธนกร วิเศษสิทธิ์ (3A-10)';
            const drugEl = document.getElementById('ovSuccessDrug');
            if (drugEl) drugEl.textContent = drugs;
        }
    }

    function ovBack(){if(ovCurrentStep>1)ovGoStep(ovCurrentStep-1);else nav('pg-dashboard');}

    function ovScanPt(){
        document.getElementById('ovScan3C').className='rt-scan-circle ok';
        document.getElementById('ovScan3I').style.color='var(--green)';
        document.getElementById('ovScan3H').textContent='ยืนยันตัวตนสำเร็จ';
        document.getElementById('ovScan3H').style.color='var(--green-dark)';
        document.getElementById('ovScan3Btn').style.display='none';
        document.getElementById('ovStep3Bot').style.display='';
        showToast('สแกนผู้ป่วยสำเร็จ');setTimeout(()=>showToast(''),1500);
    }
    function ovResetScan3(){
        document.getElementById('ovScan3C').className='rt-scan-circle idle';
        document.getElementById('ovScan3I').style.color='var(--text-3)';
        document.getElementById('ovScan3H').textContent='สแกนยืนยันตัวผู้ป่วย';
        document.getElementById('ovScan3H').style.color='';
        document.getElementById('ovScan3Btn').style.display='';
        document.getElementById('ovStep3Bot').style.display='none';
    }

    function ovScanDrug(){
        document.getElementById('ovDrugResult').classList.add('show');
        ['ovRD','ovRDs','ovRR','ovRDc','ovRRs'].forEach(id=>{document.getElementById(id).className='rt-r pass';});
        document.getElementById('ovBtnConfirm').disabled=false;
        showToast('สแกนยาสำเร็จ — 7 Rights ผ่าน (ยกเว้น Time: Overdue)');setTimeout(()=>showToast(''),2000);
    }

    /* ── Omit flow (Page 23) ── */
    let omCurrentStep = 1;
    let omSelectedReason = null;

    function omGoStep(n) {
        omCurrentStep = n;
        for(let i=1;i<=7;i++){const p=document.getElementById('omStep'+i);if(p)p.classList.toggle('active',i===n);}
        document.querySelectorAll('#omStepper .rt-step').forEach(s=>{const sn=parseInt(s.dataset.s);s.classList.remove('active','done');if(sn===n)s.classList.add('active');else if(sn<n)s.classList.add('done');});
        document.querySelectorAll('#omStepper .rt-step-line').forEach((l,i)=>l.classList.toggle('done',i<n-1));
        if(n===6){
            const drug=document.querySelector('#omStep4 .rt-drug.active .rt-drug-name');
            const name=drug?drug.textContent:'Amlodipine 5 mg';
            document.getElementById('omConfirmDrug').textContent=name;
            document.getElementById('omConfirmReason').textContent=omSelectedReason||'—';
        }
        if(n===7){
            const drug=document.querySelector('#omStep4 .rt-drug.active .rt-drug-name');
            const name=drug?drug.textContent:'Amlodipine 5 mg';
            document.getElementById('omOkDrug').textContent=name;
            document.getElementById('omSuccessDrug').textContent=name+' — นายสมชาย มานะ (3A-01)';
            document.getElementById('omOkReason').textContent=omSelectedReason||'—';
        }
    }

    function omBack(){if(omCurrentStep>1)omGoStep(omCurrentStep-1);else nav('pg-dashboard');}

    function omScanPt(){
        document.getElementById('omScan3C').className='rt-scan-circle ok';
        document.getElementById('omScan3I').style.color='var(--green)';
        document.getElementById('omScan3H').textContent='ยืนยันตัวตนสำเร็จ';
        document.getElementById('omScan3H').style.color='var(--green-dark)';
        document.getElementById('omScan3Btn').style.display='none';
        document.getElementById('omStep3Bot').style.display='';
        showToast('สแกนผู้ป่วยสำเร็จ');setTimeout(()=>showToast(''),1500);
    }
    function omResetScan3(){
        document.getElementById('omScan3C').className='rt-scan-circle idle';
        document.getElementById('omScan3I').style.color='var(--text-3)';
        document.getElementById('omScan3H').textContent='สแกนยืนยันตัวผู้ป่วย';
        document.getElementById('omScan3H').style.color='';
        document.getElementById('omScan3Btn').style.display='';
        document.getElementById('omStep3Bot').style.display='none';
    }

    function omPickDrug(el){
        document.querySelectorAll('#omStep4 .rt-drug').forEach(d=>d.classList.remove('active'));
        el.classList.add('active');
        document.getElementById('omBtnReason').disabled=false;
        const name=el.querySelector('.rt-drug-name').textContent;
        document.getElementById('omDrugName').textContent=name;
    }

    function omPickReason(el){
        document.querySelectorAll('#omOptions .omit-opt').forEach(o=>{o.classList.remove('chosen');o.querySelector('svg').style.display='none';});
        el.classList.add('chosen');el.querySelector('svg').style.display='';
        omSelectedReason=el.querySelector('.omit-opt-label').textContent;
        document.getElementById('omBtnSave5').disabled=false;
    }

    /* ── High Alert flow (Page 22) ── */
    let haCurrentStep = 1;

    function haGoStep(n) {
        haCurrentStep = n;
        for(let i=1;i<=7;i++){const p=document.getElementById('haStep'+i);if(p)p.classList.toggle('active',i===n);}
        document.querySelectorAll('#haStepper .rt-step').forEach(s=>{const sn=parseInt(s.dataset.s);s.classList.remove('active','done');if(sn===n)s.classList.add('active');else if(sn<n)s.classList.add('done');});
        document.querySelectorAll('#haStepper .rt-step-line').forEach((l,i)=>l.classList.toggle('done',i<n-1));
        if(n===6){
            const drugs = flowDrugText('ha');
            const confirmEl = document.getElementById('haConfirmDrug');
            if (confirmEl) confirmEl.textContent = drugs + ' (HA)';
        }
        if(n===7){
            document.getElementById('haGivenTime').textContent=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})+' น.';
            const drugs = flowDrugText('ha');
            const sub = document.getElementById('haSuccessSub');
            if (sub) sub.textContent = drugs + ' — Double Check ครบถ้วน';
            const drugEl = document.getElementById('haSuccessDrug');
            if (drugEl) drugEl.textContent = drugs + ' (HA)';
        }
    }

    function haBack(){if(haCurrentStep>1)haGoStep(haCurrentStep-1);else nav('pg-dashboard');}

    function haScanPt(){
        document.getElementById('haScan3C').className='rt-scan-circle ok';
        document.getElementById('haScan3I').style.color='var(--green)';
        document.getElementById('haScan3H').textContent='ยืนยันตัวตนสำเร็จ';
        document.getElementById('haScan3H').style.color='var(--green-dark)';
        document.getElementById('haScan3Btn').style.display='none';
        document.getElementById('haStep3Bot').style.display='';
        showToast('สแกนผู้ป่วยสำเร็จ');setTimeout(()=>showToast(''),1500);
    }

    function haResetScan3(){
        document.getElementById('haScan3C').className='rt-scan-circle idle';
        document.getElementById('haScan3I').style.color='var(--text-3)';
        document.getElementById('haScan3H').textContent='กรุณาสแกนสายรัดข้อมือผู้ป่วย';
        document.getElementById('haScan3H').style.color='';
        document.getElementById('haScan3Btn').style.display='';
        document.getElementById('haStep3Bot').style.display='none';
    }

    function haScanDrug(){
        document.getElementById('haDrugResult').classList.add('show');
        ['haRD','haRDs','haRR','haRDc','haRRs'].forEach(id=>{document.getElementById(id).className='rt-r pass';});
        document.getElementById('haBtnWit').disabled=false;
        showToast('สแกนยาสำเร็จ — 7 Rights ผ่าน · ไปขั้นตอนพยาน');setTimeout(()=>showToast(''),2000);
    }

    function haWitness(){
        document.getElementById('haWitTime').textContent=new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
        document.getElementById('haWitResult').classList.add('show');
        document.getElementById('haStep5Bot').style.display='';
        showToast('พยานยืนยันสำเร็จ');setTimeout(()=>showToast(''),1500);
    }

    /* ── PRN flow (Page 21) ── */
    let prnCurrentStep = 1;
    let selectedPain = null;

    function prnGoStep(n) {
        prnCurrentStep = n;
        for (let i=1;i<=6;i++) { const p=document.getElementById('prnStep'+i); if(p) p.classList.toggle('active',i===n); }
        document.querySelectorAll('#prnStepper .rt-step').forEach(s => {
            const sn=parseInt(s.dataset.s); s.classList.remove('active','done');
            if(sn===n) s.classList.add('active'); else if(sn<n) s.classList.add('done');
        });
        document.querySelectorAll('#prnStepper .rt-step-line').forEach((l,i) => l.classList.toggle('done',i<n-1));
        if(n===6) {
            document.getElementById('prnGivenTime').textContent = new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})+' น.';
            const drugs = flowDrugText('prn');
            const sub = document.getElementById('prnSuccessSub');
            if (sub) sub.textContent = drugs + ' — นายสมชาย มานะ (3A-01)';
            const drugEl = document.getElementById('prnSuccessDrug');
            if (drugEl) drugEl.textContent = drugs + ' (PRN)';
        }
    }

    function prnBack() { if(prnCurrentStep>1) prnGoStep(prnCurrentStep-1); else nav('pg-dashboard'); }

    function prnScanPt() {
        document.getElementById('prnScan3C').className='rt-scan-circle ok';
        document.getElementById('prnScan3I').style.color='var(--green)';
        document.getElementById('prnScan3H').textContent='ยืนยันตัวตนสำเร็จ';
        document.getElementById('prnScan3H').style.color='var(--green-dark)';
        document.getElementById('prnScan3Btn').style.display='none';
        document.getElementById('prnStep3Bot').style.display='';
        showToast('สแกนผู้ป่วยสำเร็จ'); setTimeout(()=>showToast(''),1500);
    }

    function prnResetScan3() {
        document.getElementById('prnScan3C').className='rt-scan-circle idle';
        document.getElementById('prnScan3I').style.color='var(--text-3)';
        document.getElementById('prnScan3H').textContent='กรุณาสแกนสายรัดข้อมือผู้ป่วย';
        document.getElementById('prnScan3H').style.color='';
        document.getElementById('prnScan3Btn').style.display='';
        document.getElementById('prnStep3Bot').style.display='none';
    }

    function pickPain(el, score) {
        selectedPain = score;
        document.querySelectorAll('.pain-dot').forEach(d => d.classList.remove('selected'));
        el.classList.add('selected');
        const colors = ['#22c55e','#22c55e','#84cc16','#eab308','#eab308','#f97316','#f97316','#ef4444','#ef4444','#dc2626','#dc2626'];
        el.style.background = colors[score];
        el.style.borderColor = colors[score];
        document.getElementById('prnPainDisplay').textContent = score;
        checkPrnAssess();
    }

    function checkPrnAssess() {
        const indication = document.getElementById('prnIndication').value;
        const reason = document.getElementById('prnReason').value.trim();
        document.getElementById('btnPrnAssess').disabled = !(indication && selectedPain !== null);
    }

    // Attach listeners
    document.addEventListener('DOMContentLoaded', () => {
        const ind = document.getElementById('prnIndication');
        const rea = document.getElementById('prnReason');
        if(ind) ind.addEventListener('change', checkPrnAssess);
        if(rea) rea.addEventListener('input', checkPrnAssess);
    });

    function prnScanDrug() {
        document.getElementById('prnDrugResult').classList.add('show');
        ['prnRD','prnRDs','prnRR','prnRDc'].forEach(id => { document.getElementById(id).className='rt-r pass'; });
        document.getElementById('btnPrnConfirm').disabled=false;
        showToast('สแกนยาสำเร็จ — 7 Rights ผ่าน'); setTimeout(()=>showToast(''),1500);
    }

    /* ── STAT flow (Page 20) ── */
    let stCurrentStep = 1;
    let stTimerInterval = null;

    function stGoStep(n) {
        stCurrentStep = n;
        for (let i = 1; i <= 5; i++) {
            const p = document.getElementById('stStep' + i);
            if (p) p.classList.toggle('active', i === n);
        }
        document.querySelectorAll('#stStepper .rt-step').forEach(s => {
            const sn = parseInt(s.dataset.s);
            s.classList.remove('active','done');
            if (sn === n) s.classList.add('active');
            else if (sn < n) s.classList.add('done');
        });
        document.querySelectorAll('#stStepper .rt-step-line').forEach((l,i) => l.classList.toggle('done', i < n-1));
        if (n === 5) {
            const now = new Date();
            document.getElementById('stGivenTime').textContent = now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}) + ' น.';
            const drugs = flowDrugText('st');
            const sub = document.getElementById('stSuccessSub');
            if (sub) sub.textContent = drugs + ' — นายธนกร วิเศษสิทธิ์ (3A-10)';
            const drugEl = document.getElementById('stSuccessDrug');
            if (drugEl) drugEl.textContent = drugs + ' (STAT)';
        }
    }

    function stBack() {
        if (stCurrentStep > 1) stGoStep(stCurrentStep - 1);
        else nav('pg-dashboard');
    }

    function stScanPt() {
        document.getElementById('stScan3C').className = 'rt-scan-circle ok';
        document.getElementById('stScan3I').style.color = 'var(--green)';
        document.getElementById('stScan3H').textContent = 'ยืนยันตัวตนสำเร็จ';
        document.getElementById('stScan3H').style.color = 'var(--green-dark)';
        document.getElementById('stScan3T').textContent = 'พร้อมดำเนินการให้ยา STAT';
        document.getElementById('stScan3Btn').style.display = 'none';
        document.getElementById('stStep3Bot').style.display = '';
        showToast('สแกนผู้ป่วยสำเร็จ'); setTimeout(()=>showToast(''),1500);
    }

    function stResetScan3() {
        document.getElementById('stScan3C').className = 'rt-scan-circle idle';
        document.getElementById('stScan3I').style.color = 'var(--text-3)';
        document.getElementById('stScan3H').textContent = 'กรุณาสแกนสายรัดข้อมือผู้ป่วย';
        document.getElementById('stScan3H').style.color = '';
        document.getElementById('stScan3T').textContent = 'ยืนยันตัวตนก่อนให้ยา STAT';
        document.getElementById('stScan3Btn').style.display = '';
        document.getElementById('stStep3Bot').style.display = 'none';
    }

    function stScanDrug() {
        document.getElementById('stDrugResult').classList.add('show');
        ['stRD','stRDs','stRR','stRDc','stRRs'].forEach(id => {
            document.getElementById(id).className = 'rt-r pass';
        });
        document.getElementById('stBtnConfirm').disabled = false;
        showToast('สแกนยาสำเร็จ — 7 Rights ผ่าน'); setTimeout(()=>showToast(''),1500);
    }

    // Timer for elapsed
    function startStatTimer() {
        let sec = 48 * 60; // start at 48 min
        function update() {
            sec++;
            const m = Math.floor(sec/60);
            const s = sec % 60;
            const el = document.getElementById('stElapsed');
            if (el) el.textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
        }
        if (stTimerInterval) clearInterval(stTimerInterval);
        stTimerInterval = setInterval(update, 1000);
    }

    /* ── Routine flow (Page 19) ── */
    let rtCurrentStep = 1;

    function rtGoStep(n) {
        rtCurrentStep = n;
        // Update panels
        for (let i = 1; i <= 6; i++) {
            const panel = document.getElementById('rtStep' + i);
            if (panel) panel.classList.toggle('active', i === n);
        }
        // Update stepper
        document.querySelectorAll('#rtStepper .rt-step').forEach(s => {
            const sn = parseInt(s.dataset.s);
            s.classList.remove('active', 'done');
            if (sn === n) s.classList.add('active');
            else if (sn < n) s.classList.add('done');
        });
        document.querySelectorAll('#rtStepper .rt-step-line').forEach((line, idx) => {
            line.classList.toggle('done', idx < n - 1);
        });
        // Populate drug names dynamically
        if (n === 5) {
            const drugs = flowDrugText('r');
            const el = document.getElementById('rtConfirmDrug');
            if (el) el.textContent = drugs;
        }
        if (n === 6) {
            const drugs = flowDrugText('r');
            const sub = document.getElementById('rtSuccessSub');
            if (sub) sub.textContent = drugs + ' — นายสมชาย มานะ (3A-01)';
            const drugEl = document.getElementById('rtSuccessDrug');
            if (drugEl) drugEl.textContent = drugs;
        }
        // Scroll top
        const panel = document.getElementById('rtStep' + n);
        if (panel) panel.scrollTop = 0;
    }

    function rtBack() {
        if (rtCurrentStep > 1) rtGoStep(rtCurrentStep - 1);
        else nav('pg-dashboard');
    }

    function rtScanPatient() {
        const circle = document.getElementById('rtScan3Circle');
        const icon = document.getElementById('rtScan3Icon');
        circle.className = 'rt-scan-circle ok';
        icon.style.color = 'var(--green)';
        document.getElementById('rtScan3Head').textContent = 'ยืนยันตัวตนสำเร็จ';
        document.getElementById('rtScan3Head').style.color = 'var(--green-dark)';
        document.getElementById('rtScan3Hint').textContent = 'ข้อมูลตรงกับผู้ป่วยเป้าหมาย';
        document.getElementById('rtScan3Btn').style.display = 'none';
        document.getElementById('rtStep3Bottom').style.display = '';
        showToast('สแกนผู้ป่วยสำเร็จ');
        setTimeout(() => showToast(''), 1500);
    }

    function rtResetStep3() {
        document.getElementById('rtScan3Circle').className = 'rt-scan-circle idle';
        document.getElementById('rtScan3Icon').style.color = 'var(--text-3)';
        document.getElementById('rtScan3Head').textContent = 'กรุณาสแกนสายรัดข้อมือผู้ป่วย';
        document.getElementById('rtScan3Head').style.color = '';
        document.getElementById('rtScan3Hint').textContent = 'สแกนบาร์โค้ดที่สายรัดข้อมือเพื่อยืนยันตัวตน';
        document.getElementById('rtScan3Btn').style.display = '';
        document.getElementById('rtStep3Bottom').style.display = 'none';
    }

    function rtPickDrug(el) {
        if (el.classList.contains('done')) return;
        document.querySelectorAll('#rtStep4 .rt-drug').forEach(d => d.classList.remove('active'));
        el.classList.add('active');
        rtResetDrugScan(); // reset 7 Rights ทุกครั้งที่เปลี่ยนยา
    }

    function rtScanDrug() {
        const activeDrug = document.querySelector('#rtStep4 .rt-drug.active');
        if (!activeDrug || activeDrug.classList.contains('done')) {
            showToast('กรุณาเลือกรายการยาก่อนสแกน');
            setTimeout(() => showToast(''), 1500);
            return;
        }
        document.getElementById('rtDrugScanResult').classList.add('show');
        // ตั้ง 7 Rights เป็น pass ทั้งหมด
        ['rtRD','rtRDs','rtRR','rtRDc','rtRRs'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.className = 'rt-r pass';
        });
        // Mark ยา active เป็น done
        const bar = activeDrug.querySelector('.rt-drug-bar');
        if (bar) bar.className = 'rt-drug-bar done';
        activeDrug.classList.add('done');
        activeDrug.classList.remove('active');
        activeDrug.style.opacity = '0.5';
        activeDrug.style.pointerEvents = 'none';
        document.getElementById('rtBtnConfirmDrug').disabled = false;
        showToast('สแกนยาสำเร็จ — 7 Rights ผ่าน');
        setTimeout(() => showToast(''), 1500);
    }

    function rtResetDrugScan() {
        const resultEl = document.getElementById('rtDrugScanResult');
        if (resultEl) resultEl.classList.remove('show');
        ['rtRD','rtRDs','rtRR','rtRDc','rtRRs'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.className = 'rt-r pend';
        });
        const btn = document.getElementById('rtBtnConfirmDrug');
        if (btn) btn.disabled = true;
    }

    /* ── Omit (Page 15) ── */
    function pickOmit(el) {
        document.querySelectorAll('.omit-opt').forEach(o => {
            o.classList.remove('chosen');
            o.querySelector('svg').style.display = 'none';
        });
        el.classList.add('chosen');
        el.querySelector('svg').style.display = '';
        document.getElementById('btnOmitSave').disabled = false;
    }

    /* ── Record (Page 16) ── */
    function saveRecord() {
        const now = new Date();
        document.getElementById('okTimestamp').textContent =
            now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}) + ' น.';
        nav('pg-success');
    }

    /* ── Witness / IDC (Page 14) ── */
    function switchWitTab(tab) {
        document.querySelectorAll('.wit-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.wit-panel').forEach(p => p.classList.remove('active'));
        if (tab === 'card') {
            document.querySelectorAll('.wit-tab')[0].classList.add('active');
            document.getElementById('witPanelCard').classList.add('active');
        } else if (tab === 'user') {
            document.querySelectorAll('.wit-tab')[1].classList.add('active');
            document.getElementById('witPanelUser').classList.add('active');
        } else {
            document.querySelectorAll('.wit-tab')[2].classList.add('active');
            document.getElementById('witPanelPin').classList.add('active');
        }
    }

    function demoWitness() {
        const now = new Date();
        document.getElementById('witTime').textContent = now.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit' });
        document.getElementById('witResult').classList.add('show');
        document.getElementById('witActions').classList.add('show');
        showToast('พยานยืนยันตัวตนสำเร็จ');
        setTimeout(() => showToast(''), 2000);
    }

    function resetWitness() {
        document.getElementById('witResult').classList.remove('show');
        document.getElementById('witActions').classList.remove('show');
    }

    /* ── Admin Med (Page 13) ── */
    function selectAmDrug(el) {
        if (el.classList.contains('done') || el.style.opacity === '0.6') return;
        document.querySelectorAll('.am-drug').forEach(d => d.classList.remove('active'));
        el.classList.add('active');
        // Reset 7 Rights และ scan result ทุกครั้งที่เปลี่ยนยา
        ['rDrug','rDose','rRoute','rDoc','rReason'].forEach(id => {
            const r = document.getElementById(id);
            if (r) r.className = 'am-r pend';
        });
        const scanResult = document.getElementById('amScanResult');
        if (scanResult) scanResult.classList.remove('show');
        const confirmBtn = document.getElementById('btnConfirmAdmin');
        if (confirmBtn) confirmBtn.disabled = true;
    }

    function demoScanMed() {
        document.getElementById('amScanResult').classList.add('show');
        // ตั้ง 7 Rights เป็น pass ทีละ right พร้อม delay เล็กน้อยเพื่อ UX
        const rights = ['rDrug','rDose','rRoute','rDoc','rReason'];
        rights.forEach((id, i) => {
            setTimeout(() => {
                const el = document.getElementById(id);
                if (el) el.className = 'am-r pass';
            }, i * 80);
        });
        setTimeout(() => {
            document.getElementById('btnConfirmAdmin').disabled = false;
        }, rights.length * 80);
        showToast('สแกนยาสำเร็จ — 7 Rights ผ่านทั้งหมด');
        setTimeout(() => showToast(''), 2000);
    }

    /* ── Scan Patient (Page 12) ── */
    function demoScanPt(type) {
        const illust = document.getElementById('sptIllust');
        const heading = document.getElementById('sptHeading');
        const hint = document.getElementById('sptHint');
        const scanBtn = document.getElementById('sptScanBtn');
        const result = document.getElementById('sptResult');
        const resultBox = document.getElementById('sptResultBox');
        const resultIcon = document.getElementById('sptResultIcon');
        const resultSvg = document.getElementById('sptResultSvg');
        const resultTitle = document.getElementById('sptResultTitle');
        const resultDetail = document.getElementById('sptResultDetail');
        const actions = document.getElementById('sptActions');
        const proceed = document.getElementById('sptProceed');

        if (type === 'match') {
            illust.className = 'spt-illust success';
            document.getElementById('sptIcon').style.color = 'var(--green)';
            heading.className = 'spt-heading success';
            heading.textContent = 'ยืนยันตัวตนสำเร็จ';
            hint.textContent = 'ข้อมูลตรงกับผู้ป่วยเป้าหมาย';
            scanBtn.style.display = 'none';

            resultBox.className = 'spt-result-box match';
            resultIcon.className = 'spt-result-icon ok';
            resultSvg.innerHTML = '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>';
            resultTitle.className = 'spt-result-title ok';
            resultTitle.textContent = 'ตรงกับผู้ป่วยเป้าหมาย';
            resultDetail.className = 'spt-result-detail ok';
            resultDetail.textContent = 'สมชาย มานะ · HN: 6401234 · เตียง 3A-01';
            result.classList.add('show');

            proceed.disabled = false;
            proceed.style.opacity = '1';
            actions.classList.add('show');
        } else {
            illust.className = 'spt-illust fail';
            document.getElementById('sptIcon').style.color = '#dc2626';
            heading.className = 'spt-heading fail';
            heading.textContent = 'ผู้ป่วยไม่ตรงกัน';
            hint.textContent = 'ไม่สามารถดำเนินการให้ยาได้ กรุณาตรวจสอบอีกครั้ง';
            scanBtn.style.display = 'none';

            resultBox.className = 'spt-result-box mismatch';
            resultIcon.className = 'spt-result-icon err';
            resultSvg.innerHTML = '<line x1="18" y1="6" x2="6" y2="18" stroke="white" stroke-width="3"/><line x1="6" y1="6" x2="18" y2="18" stroke="white" stroke-width="3"/>';
            resultTitle.className = 'spt-result-title err';
            resultTitle.textContent = 'ผู้ป่วยไม่ตรงกัน — ไม่สามารถดำเนินการต่อได้';
            resultDetail.className = 'spt-result-detail err';
            resultDetail.textContent = 'สแกนได้: วิชัย ดีงาม · HN: 6402890 (ไม่ใช่ผู้ป่วยเป้าหมาย)';
            result.classList.add('show');

            proceed.disabled = true;
            proceed.style.opacity = '.5';
            actions.classList.add('show');
        }
    }

    function resetScanPt() {
        const illust = document.getElementById('sptIllust');
        illust.className = 'spt-illust idle';
        document.getElementById('sptIcon').style.color = 'var(--text-3)';
        document.getElementById('sptHeading').className = 'spt-heading';
        document.getElementById('sptHeading').textContent = 'กรุณาสแกนสายรัดข้อมือผู้ป่วย';
        document.getElementById('sptHint').innerHTML = 'ใช้เครื่องสแกนบาร์โค้ดที่ติดตั้งบนรถเข็น<br>สแกนที่สายรัดข้อมือของผู้ป่วยเพื่อยืนยันตัวตน';
        document.getElementById('sptScanBtn').style.display = '';
        document.getElementById('sptResult').classList.remove('show');
        document.getElementById('sptActions').classList.remove('show');
    }

    /* ── Summary (Page 9) ── */
    function saveSummary() {
        showToast('บันทึกผลการจัดยาเรียบร้อย — กำลังกลับ Dashboard...');
        setTimeout(() => {
            showToast('');
            nav('pg-dashboard');
        }, 2000);
    }

    function confirmBackDash() {
        if (confirm('คุณต้องการกลับ Dashboard โดยไม่บันทึกหรือไม่?\nรายการที่ยังไม่บันทึกจะไม่ถูกเก็บ')) {
            nav('pg-dashboard');
        }
    }

    /* ── Logout ── */
    function doLogout() {
        // Hide user section
        document.body.classList.remove('logged-in');
        document.getElementById('ghUserSection').style.display = 'none';
        // Reset login form
        document.getElementById('inputUser').value = '';
        document.getElementById('inputPw').value = '';
        document.getElementById('inputUser').classList.remove('error');
        document.getElementById('inputPw').classList.remove('error');
        document.getElementById('loginError').classList.remove('show');
        nav('pg-cart');
    }

    /* ── Drawer ── */
    function openDrawer() {
        document.getElementById('overlay').classList.add('open');
        document.getElementById('drawer').classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        document.getElementById('overlay').classList.remove('open');
        document.getElementById('drawer').classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ── Multi-Drug Scan ── */
    // Helper: join scanned drug names for a flow
    function flowDrugText(flow) {
        return (multiDrugData[flow] || []).map(d => d.name).join(' · ');
    }

    // drugData[flow][idx] = { name, lot, exp }
    const multiDrugData = {
        r:   [ { name:'Amlodipine 5 mg',     lot:'AML-2025-108', exp:'15/03/2570' },
               { name:'Metformin 500 mg',    lot:'MET-2025-072', exp:'30/06/2570' },
               { name:'Omeprazole 20 mg',    lot:'OMP-2025-039', exp:'28/02/2570' } ],
        st:  [ { name:'Heparin 5000 units',  lot:'HEP-2025-042', exp:'30/09/2569' },
               { name:'Ondansetron 4 mg',    lot:'OND-2025-015', exp:'31/05/2570' } ],
        prn: [ { name:'Morphine 5 mg',       lot:'MOR-2025-017', exp:'15/06/2569' },
               { name:'Ondansetron 4 mg',    lot:'OND-2025-015', exp:'31/05/2570' } ],
        ha:  [ { name:'Heparin 5000 units',  lot:'HEP-2025-042', exp:'30/09/2569' },
               { name:'Warfarin 3 mg',       lot:'WAR-2025-008', exp:'31/12/2569' } ],
        ov:  [ { name:'Heparin 5000 units',  lot:'HEP-2025-042', exp:'30/09/2569' },
               { name:'Metoprolol 50 mg',    lot:'MTP-2025-021', exp:'31/08/2570' } ]
    };

    // Map flow prefix → confirm button ID
    const multiDrugConfirmMap = {
        r:   'rtBtnConfirmDrug',
        st:  'stBtnConfirm',
        prn: 'btnPrnConfirm',
        ha:  'haBtnWit',
        ov:  'ovBtnConfirm'
    };

    function scanMultiDrug(flow, idx) {
        const cardId = `${flow}drug_${idx}`;
        const btnId  = `${flow}drug_${idx}_btn`;
        const btn    = document.getElementById(btnId);
        if (!btn || btn.disabled) return;

        // Animate button
        btn.disabled = true;
        btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".25"/><path d="M21 12a9 9 0 0 1-9 9"/></svg> กำลังสแกน...';

        setTimeout(() => {
            const card = document.getElementById(cardId);
            if (!card) return;

            // Mark done
            card.classList.add('done');
            card.dataset.done = 'true';

            const doneRow = document.getElementById(`${flow}drug_${idx}_done`);
            if (doneRow) doneRow.style.display = '';

            const data = (multiDrugData[flow] || [])[idx];
            if (data) {
                const lotEl = document.getElementById(`${flow}drug_${idx}_lot`);
                const nameEl = document.getElementById(`${flow}drug_${idx}_resname`);
                if (lotEl)  lotEl.textContent  = `Lot: ${data.lot} · Exp: ${data.exp}`;
                if (nameEl) nameEl.textContent = data.name;
            }

            btn.style.display = 'none';
            checkMultiDrugDone(flow);
        }, 1200);
    }

    function checkMultiDrugDone(flow) {
        const cards = document.querySelectorAll(`.mdc[data-flow="${flow}"]`);
        if (!cards.length) return;
        const allDone = [...cards].every(c => c.dataset.done === 'true');
        if (!allDone) return;
        const confirmId = multiDrugConfirmMap[flow];
        if (confirmId) {
            const btn = document.getElementById(confirmId);
            if (btn) btn.disabled = false;
        }
    }

    /* ── Post-Medication Assessment ── */
    let postAssessOrigin = 'pg-dashboard';

    // flowMeta: { flow, patient, bed, drug, detail, type, givenTime, showPain }
    function goPostAssess(flowMeta) {
        const meta = flowMeta || {};
        postAssessOrigin = meta.origin || 'pg-dashboard';

        // Reset UI
        const form = document.getElementById('paForm');
        const succ = document.getElementById('paSuccess');
        if (form) form.style.display = '';
        if (succ) succ.style.display = 'none';

        // Reset response selection
        ['paResBetter','paResSame','paResWorse'].forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            el.style.background = '';
            el.style.borderColor = 'var(--border)';
            el.querySelectorAll('.pa-radio-fill').forEach(f => f.style.display = 'none');
        });

        // Reset ADR chips
        document.querySelectorAll('#paAdrGroup > div').forEach(d => {
            d.style.background = '';
            d.style.borderColor = 'var(--border)';
            d.style.color = 'var(--text-2)';
        });

        // Reset pain scale
        document.querySelectorAll('#paPainScale .pain-dot').forEach(d => d.classList.remove('active'));

        // Set assessment time to now
        const now = new Date();
        const timeEl = document.getElementById('paAssessTime');
        if (timeEl) timeEl.value = now.toTimeString().slice(0,5);

        // Populate patient/drug info
        if (meta.patient) { const e = document.getElementById('paPatientName'); if (e) e.textContent = meta.patient; }
        if (meta.bed)     { const e = document.getElementById('paPatientBed');  if (e) e.textContent = meta.bed; }
        if (meta.drug)    { const e = document.getElementById('paDrugName');    if (e) e.textContent = meta.drug; }
        if (meta.detail)  { const e = document.getElementById('paDrugDetail');  if (e) e.textContent = meta.detail; }
        if (meta.type)    { const e = document.getElementById('paFlowLabel');   if (e) e.textContent = meta.type; }
        if (meta.givenTime){ const e = document.getElementById('paGivenTime'); if (e) e.textContent = meta.givenTime; }

        // Show pain scale only for PRN
        const painGroup = document.getElementById('paPainGroup');
        if (painGroup) painGroup.style.display = meta.showPain ? '' : 'none';

        // Mirror to success summary
        if (meta.patient) { const e = document.getElementById('paOkPatient'); if (e) e.textContent = meta.patient; }
        if (meta.drug)    { const e = document.getElementById('paOkDrug');    if (e) e.textContent = meta.drug; }

        nav('pg-post-assess');
    }

    function postAssessBack() { nav(postAssessOrigin); }

    function savePostAssess() {
        const timeEl = document.getElementById('paAssessTime');
        const timeStr = timeEl ? timeEl.value : '';

        // Determine selected response label
        const responseMap = { 'paResBetter':'ดีขึ้น / อาการบรรเทา', 'paResSame':'ไม่เปลี่ยนแปลง', 'paResWorse':'แย่ลง / ต้องการการดูแล' };
        let respLabel = '—';
        for (const [id, label] of Object.entries(responseMap)) {
            const el = document.getElementById(id);
            if (el && el.style.background && el.style.background !== '') { respLabel = label; break; }
        }

        const okResp = document.getElementById('paOkResponse');
        if (okResp) {
            okResp.textContent = respLabel;
            okResp.style.color = respLabel.includes('ดีขึ้น') ? 'var(--green)' : respLabel.includes('แย่ลง') ? '#dc2626' : '#d97706';
        }
        const savedTime = document.getElementById('paSavedTime');
        if (savedTime) savedTime.textContent = timeStr ? timeStr + ' น.' : new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'}) + ' น.';

        document.getElementById('paForm').style.display = 'none';
        document.getElementById('paSuccess').style.display = '';
    }

    function paPickResponse(el, type) {
        const colorMap = { better: '#22c55e', same: '#f59e0b', worse: '#ef4444' };
        const bgMap    = { better: '#f0fdf4', same: '#fffbeb', worse: '#fef2f2' };
        const ids = ['paResBetter','paResSame','paResWorse'];
        ids.forEach(id => {
            const e = document.getElementById(id);
            if (!e) return;
            e.style.background = '';
            e.style.borderColor = 'var(--border)';
            e.querySelectorAll('.pa-radio-fill').forEach(f => f.style.display = 'none');
        });
        el.style.background = bgMap[type] || '';
        el.style.borderColor = colorMap[type] || 'var(--border)';
        el.querySelectorAll('.pa-radio-fill').forEach(f => f.style.display = '');
    }

    function paToggleAdr(el) {
        const active = el.dataset.active === '1';
        if (active) {
            el.dataset.active = '0';
            el.style.background = '';
            el.style.borderColor = 'var(--border)';
            el.style.color = 'var(--text-2)';
        } else {
            el.dataset.active = '1';
            el.style.background = '#d1fae5';
            el.style.borderColor = '#059669';
            el.style.color = '#065f46';
        }
    }

    let postPainScore = -1;
    function pickPainPost(el, score) {
        postPainScore = score;
        document.querySelectorAll('#paPainScale .pain-dot').forEach(d => d.classList.remove('active'));
        el.classList.add('active');
    }

    /* ── Toast ── */
    function showToast(msg) {
        const t = document.getElementById('toast');
        if (!msg) { t.classList.remove('show'); return; }
        t.textContent = msg;
        t.classList.add('show');
    }
