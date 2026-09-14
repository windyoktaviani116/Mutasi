const STORAGE_KEY='worktrack_records_v2';
const SESSION_KEY='worktrack_logged_user';
const $=s=>document.querySelector(s);
const today=()=>new Date().toISOString().slice(0,10);
const formatDate=d=>new Date(`${d}T00:00:00`).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});
const getRecords=()=>{try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return[]}};
const saveRecords=r=>localStorage.setItem(STORAGE_KEY,JSON.stringify(r));
const newId=()=>window.crypto&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`;
const isAdmin=()=>localStorage.getItem(SESSION_KEY)==='admin';
const escapeHtml=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function setDateDefaults(){const t=today();$('#dailyDate').value=t;$('#vehicleDate').value=t;$('#dailyDateBadge').textContent=formatDate(t)}
function showView(id){document.querySelectorAll('.content-view').forEach(v=>v.classList.toggle('hidden',v.id!==id));document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.view===id));if(id==='recordsView')renderRecords(getRecords(),$('#recordsContainer'))}
function validatePhotos(input){if(input.files.length>2){alert('Maksimal hanya 2 foto.');input.value='';return false}return true}
function filesToDataUrls(files){return Promise.all([...files].slice(0,2).map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})))}
function photoButtons(record){if(!record.photos||!record.photos.length)return '';return `<button class="btn secondary small photo-btn" data-photos="${encodeURIComponent(JSON.stringify(record.photos))}">Lihat Foto (${record.photos.length})</button>`}
function adminButtons(record){if(!isAdmin())return '';return `<div class="record-actions"><button class="btn secondary small edit-btn" data-id="${record.id}">Edit</button><button class="btn danger small delete-btn" data-id="${record.id}">Hapus</button>${photoButtons(record)}</div>`}
function renderRecord(record){let html='';if(record.type==='daily'){html=`<div class="record-item"><h3>Mutasi Harian</h3><div class="record-meta"><span class="meta">Shift: ${escapeHtml(record.shift)}</span><span class="meta">Petugas: ${escapeHtml(record.officer)}</span></div><p class="record-note">${escapeHtml(record.note)}</p>`}else{html=`<div class="record-item"><h3>Mutasi Kendaraan — ${escapeHtml(record.unit)}</h3><div class="record-meta"><span class="meta">Driver: ${escapeHtml(record.driver)}</span><span class="meta">Keluar: ${record.outTime||'-'}</span><span class="meta">Masuk: ${record.inTime||'-'}</span><span class="meta">KM: ${record.outKm||'-'} → ${record.inKm||'-'}</span></div><p class="record-note">${escapeHtml(record.note||'Tidak ada keterangan.')}</p>`}return html+(isAdmin()?adminButtons(record):photoButtons(record))+'</div>'}
function renderRecords(records,container){if(!records.length){container.innerHTML='<div class="empty">Belum ada mutasi yang tersimpan.</div>';return}const grouped={};[...records].sort((a,b)=>b.date.localeCompare(a.date)).forEach(r=>(grouped[r.date]??=[]).push(r));container.innerHTML=Object.entries(grouped).map(([date,items])=>`<article class="record-day"><div class="record-day-header"><strong>${formatDate(date)}</strong><span>${items.length} catatan</span></div><div class="record-body">${items.map(renderRecord).join('')}</div></article>`).join('')}
function openPhotos(photos){$('#modalPhotos').innerHTML=photos.map((src,i)=>`<img src="${src}" alt="Dokumentasi foto ${i+1}" />`).join('');$('#photoModal').classList.remove('hidden')}
function closePhoto(){$('#modalPhotos').innerHTML='';$('#photoModal').classList.add('hidden')}
function editRecord(id){if(!isAdmin())return alert('Hanya admin yang dapat mengedit.');const records=getRecords();const r=records.find(x=>x.id===id);if(!r)return;let changed=false;if(r.type==='daily'){const note=prompt('Edit catatan mutasi harian:',r.note);if(note===null)return;r.note=note;const officer=prompt('Edit nama petugas:',r.officer);if(officer!==null&&officer.trim())r.officer=officer.trim();changed=true}else{const unit=prompt('Edit unit kendaraan:',r.unit);if(unit===null)return;r.unit=unit;const driver=prompt('Edit driver:',r.driver);if(driver!==null&&driver.trim())r.driver=driver.trim();const note=prompt('Edit keterangan:',r.note||'');if(note!==null)r.note=note;changed=true}if(changed){saveRecords(records);renderRecords(getRecords(),$('#recordsContainer'));alert('Mutasi berhasil diperbarui.')}}
function deleteRecord(id){if(!isAdmin())return alert('Hanya admin yang dapat menghapus.');if(!confirm('Yakin ingin menghapus catatan ini?'))return;saveRecords(getRecords().filter(r=>r.id!==id));renderRecords(getRecords(),$('#recordsContainer'));alert('Mutasi berhasil dihapus.')}

$('#dailyPhoto').addEventListener('change',e=>validatePhotos(e.target));$('#vehiclePhoto').addEventListener('change',e=>validatePhotos(e.target));
$('#loginForm').addEventListener('submit', e => {
  e.preventDefault();

  const u = $('#username').value.trim();
  const p = $('#password').value;

  // LOGIN ADMIN
  if (u === 'windy' && p === '141414') {
    localStorage.setItem(SESSION_KEY, 'admin');

    $('#loggedUser').textContent = `Login: ${u} (Admin)`;
    $('#loginPage').classList.add('hidden');
    $('#dashboardPage').classList.remove('hidden');
    setDateDefaults();

  // LOGIN ANGGOTA
  } else if (u === 'anggota' && p === 'anggota123') {
    localStorage.setItem(SESSION_KEY, 'anggota');

    $('#loggedUser').textContent = `Login: ${u} (Anggota)`;
    $('#loginPage').classList.add('hidden');
    $('#dashboardPage').classList.remove('hidden');
    setDateDefaults();

  // LOGIN GAGAL
  } else {
    alert('Username atau password salah.');
  }
});
$('#logoutBtn').addEventListener('click',()=>{localStorage.removeItem(SESSION_KEY);$('#dashboardPage').classList.add('hidden');$('#loginPage').classList.remove('hidden');$('#loginForm').reset()});
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>showView(t.dataset.view)));$('#closeRecordsBtn').addEventListener('click',()=>showView('dailyView'));$('#closePhotoBtn').addEventListener('click',closePhoto);$('#photoModal').addEventListener('click',e=>{if(e.target.id==='photoModal')closePhoto()});

document.addEventListener('click',e=>{const photo=e.target.closest('.photo-btn');if(photo)openPhotos(JSON.parse(decodeURIComponent(photo.dataset.photos)));const edit=e.target.closest('.edit-btn');if(edit)editRecord(edit.dataset.id);const del=e.target.closest('.delete-btn');if(del)deleteRecord(del.dataset.id)});
$('#dailyForm').addEventListener('submit',async e=>{e.preventDefault();const input=$('#dailyPhoto');if(!validatePhotos(input))return;const photos=await filesToDataUrls(input.files);const records=getRecords();records.push({id:newId(),type:'daily',date:$('#dailyDate').value,shift:$('#dailyShift').value,officer:$('#dailyOfficer').value.trim(),note:$('#dailyNote').value.trim(),photos});saveRecords(records);e.target.reset();setDateDefaults();alert('Mutasi harian berhasil disimpan.')});
$('#vehicleForm').addEventListener('submit',async e=>{e.preventDefault();const input=$('#vehiclePhoto');if(!validatePhotos(input))return;const photos=await filesToDataUrls(input.files);const records=getRecords();records.push({id:newId(),type:'vehicle',date:$('#vehicleDate').value,unit:$('#vehicleUnit').value.trim(),driver:$('#vehicleDriver').value.trim(),outTime:$('#outTime').value,inTime:$('#inTime').value,outKm:$('#outKm').value,inKm:$('#inKm').value,note:$('#vehicleNote').value.trim(),photos});saveRecords(records);e.target.reset();setDateDefaults();alert('Mutasi kendaraan berhasil disimpan.')});
$('#searchForm').addEventListener('submit',e=>{e.preventDefault();renderRecords(getRecords().filter(r=>r.date===$('#searchDate').value),$('#searchResult'))});
if(localStorage.getItem(SESSION_KEY)){const u=localStorage.getItem(SESSION_KEY);$('#loggedUser').textContent=`Login: ${u}${u==='admin'?' (Admin)':''}`;$('#loginPage').classList.add('hidden');$('#dashboardPage').classList.remove('hidden');setDateDefaults()}
