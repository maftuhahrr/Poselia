const firebaseConfig = {
  apiKey: "AIzaSyAr7YRpU0IYi0JfNkD5XenVoalbtp2iuZE",
  authDomain: "poselia.firebaseapp.com",
  projectId: "poselia",
  storageBucket: "poselia.firebasestorage.app",
  messagingSenderId: "511833556213",
  appId: "1:511833556213:web:dec3c8285a5b87f8ea71bc",
  measurementId: "G-6ZK5CJS1WX"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// In-memory store (single source of truth during a session)
let dataStore = {
  balita: [],
  ibuHamil: [],
  pemantauanBalita: [],
  pemantauanIbuHamil: []
};

let currentUser = null;

// --- Utility functions ---
function getAge(tanggalLahir) {
  if (!tanggalLahir) return '-';
  const birthDate = new Date(tanggalLahir);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function safeAddListener(el, event, fn) {
  if (!el) return;
  if (el.dataset.listenerAdded === "true") return;
  el.addEventListener(event, fn);
  el.dataset.listenerAdded = "true";
}

// show only requested section in dashboard
function showSection(sectionId) {
  const allSections = document.querySelectorAll(
    '#dashboardOverview, #dataBalita, #dataIbuHamil, #pemantauanBalita, #pemantauanIbuHamil, #laporan'
  );
  allSections.forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById(sectionId);
  if (target) target.classList.remove('hidden');

  // highlight sidebar active
  document.querySelectorAll('#dashboardSection .nav-link[data-section]').forEach(nav => {
    nav.classList.toggle('active', nav.getAttribute('data-section') === sectionId);
  });
}

// --- Firestore helpers ---
async function loadAllData() {
  try {
    if (!currentUser) {
      console.error("No user logged in");
      return { success: false, error: "No user logged in" };
    }

    console.log("🔄 Fetching Firestore data for user:", currentUser.uid);
    const userDoc = db.collection('users').doc(currentUser.uid);

    const [
      balitaSnapshot,
      ibuHamilSnapshot,
      pemantauanBalitaSnapshot,
      pemantauanIbuHamilSnapshot
    ] = await Promise.all([
      userDoc.collection('balita').get(),
      userDoc.collection('ibuHamil').get(),
      userDoc.collection('pemantauanBalita').get(),
      userDoc.collection('pemantauanIbuHamil').get()
    ]);

    dataStore.balita = balitaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    dataStore.ibuHamil = ibuHamilSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    dataStore.pemantauanBalita = pemantauanBalitaSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    dataStore.pemantauanIbuHamil = pemantauanIbuHamilSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log("✅ Firestore data loaded:", {
      balita: dataStore.balita.length,
      ibuHamil: dataStore.ibuHamil.length,
      pemBalita: dataStore.pemantauanBalita.length,
      pemIbuHamil: dataStore.pemantauanIbuHamil.length
    });

    return { success: true };
  } catch (err) {
    console.error("❌ loadAllData error:", err);
    return { success: false, error: err.message || err };
  }
}


// DB operations (named clearly)
async function addBalitaToDB(balitaData) {
  try {
    const docRef = await db.collection('users').doc(currentUser.uid).collection('balita').add({
      ...balitaData,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (err) {
    return { success: false, error: err.message || err };
  }
}

async function updateBalitaInDB(id, balitaData) {
  try {
    await db.collection('users').doc(currentUser.uid).collection('balita').doc(id).update({
      ...balitaData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || err };
  }
}

async function deleteBalitaFromDB(id) {
  try {
    await db.collection('users').doc(currentUser.uid).collection('balita').doc(id).delete();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || err };
  }
}

// Ibu Hamil DB ops
async function addIbuHamilToDB(data) {
  try {
    const docRef = await db.collection('users').doc(currentUser.uid).collection('ibuHamil').add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (err) {
    return { success: false, error: err.message || err };
  }
}

async function updateIbuHamilInDB(id, data) {
  try {
    await db.collection('users').doc(currentUser.uid).collection('ibuHamil').doc(id).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || err };
  }
}

async function deleteIbuHamilFromDB(id) {
  try {
    await db.collection('users').doc(currentUser.uid).collection('ibuHamil').doc(id).delete();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || err };
  }
}

// Pemantauan DB ops
async function addPemantauanBalitaToDB(data) {
  try {
    const docRef = await db.collection('users').doc(currentUser.uid).collection('pemantauanBalita').add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (err) { return { success: false, error: err.message || err }; }
}

async function addPemantauanIbuHamilToDB(data) {
  try {
    const docRef = await db.collection('users').doc(currentUser.uid).collection('pemantauanIbuHamil').add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (err) { return { success: false, error: err.message || err }; }
}

// --- UI refresh functions ---
function refreshBalitaTable() {
  const tbody = document.getElementById("balitaTableBody");
  if (!tbody) return console.warn("⚠️ Balita table not found.");
  tbody.innerHTML = '';

  dataStore.balita.forEach((b, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${b.nama || '-'}</td>
      <td>${b.nik || '-'}</td>
      <td>${b.tanggalLahir || '-'}</td>
      <td>${b.tanggalLahir ? getAge(b.tanggalLahir) + ' th' : '-'}</td>
      <td>${b.namaOrtu || '-'}</td>
      <td>${b.alamat || '-'}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" data-action="edit" data-id="${b.id || ''}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${b.id || ''}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  safeAddListener(tbody, 'click', e => handleCrudAction(e, 'balita'));
}

function refreshIbuHamilTable() {
  const tbody = document.getElementById("ibuHamilTableBody");
  if (!tbody) return console.warn("⚠️ Ibu Hamil table not found.");
  tbody.innerHTML = '';

  dataStore.ibuHamil.forEach(i => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i.nama || '-'}</td>
      <td>${i.nik || '-'}</td>
      <td>${i.tanggalLahir || '-'}</td>
      <td>${i.tanggalLahir ? getAge(i.tanggalLahir) + ' th' : '-'}</td>
      <td>${i.alamat || '-'}</td>
      <td>${i.noHp || '-'}</td>
      <td>${i.pendidikan || '-'}</td>
      <td>${i.pekerjaan || '-'}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" data-action="edit" data-id="${i.id || ''}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${i.id || ''}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  safeAddListener(tbody, 'click', e => handleCrudAction(e, 'ibuHamil'));
}

function refreshPemantauanBalitaTable() {
  const tbody = document.getElementById("pemantauanBalitaTableBody");
  if (!tbody) return console.warn("⚠️ Pemantauan Balita table not found.");
  tbody.innerHTML = '';

  dataStore.pemantauanBalita.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.tanggal || '-'}</td>
      <td>${p.namaBalita || '-'}</td>
      <td>${p.bb || '-'}</td>
      <td>${p.tb || '-'}</td>
      <td>${p.lk || '-'}</td>
      <td>${p.lla || '-'}</td>
      <td>${p.statusGizi || '-'}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" data-action="edit" data-id="${p.id || ''}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p.id || ''}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  safeAddListener(tbody, 'click', e => handleCrudAction(e, 'pemantauanBalita'));
}

function refreshPemantauanIbuHamilTable() {
  const tbody = document.getElementById("pemantauanIbuHamilTableBody");
  if (!tbody) return console.warn("⚠️ Pemantauan Ibu Hamil table not found.");
  tbody.innerHTML = '';

  dataStore.pemantauanIbuHamil.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.tanggalKunjungan || '-'}</td>
      <td>${p.namaIbu || '-'}</td>
      <td>${p.usiaKehamilan || '-'}</td>
      <td>${p.tekananDarah || '-'}</td>
      <td>${p.bb || '-'}</td>
      <td>${p.keluhan || '-'}</td>
      <td>${p.status || '-'}</td>
      <td>
        <button class="btn btn-sm btn-warning me-1" data-action="edit" data-id="${p.id || ''}">Edit</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p.id || ''}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  safeAddListener(tbody, 'click', e => handleCrudAction(e, 'pemantauanIbuHamil'));
}

function refreshDashboardTables() {
  // Balita preview
  const balitaTable = document.querySelector('#dashboardBalitaTableBody');
  if (balitaTable) {
    balitaTable.innerHTML = '';
    dataStore.balita.slice(0, 3).forEach(b => {
      const umur = b.tanggalLahir ? `${getAge(b.tanggalLahir)} th` : '-';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${b.nama || '-'}</td>
        <td>${umur}</td>
        <td>${b.bbLahir || '-'}kg/${b.tbLahir || '-'}cm</td>
        <td><span class="badge bg-success">Sehat</span></td>
      `;
      balitaTable.appendChild(tr);
    });
  }

  // Ibu Hamil preview
  const ibuTable = document.querySelector('#dashboardIbuHamilTableBody');
  if (ibuTable) {
    ibuTable.innerHTML = '';
    dataStore.ibuHamil.slice(0, 3).forEach(i => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i.nama || '-'}</td>
        <td>${i.usiaKandungan || '-'}</td>
        <td>${i.tekananDarah || '-'}</td>
        <td><span class="badge bg-success">Normal</span></td>
      `;
      ibuTable.appendChild(tr);
    });
  }
}

function updateDashboardOverview() {
  const counts = {
    balita: dataStore.balita.length,
    ibuHamil: dataStore.ibuHamil.length,
    pemBalita: dataStore.pemantauanBalita.length,
    pemIbuHamil: dataStore.pemantauanIbuHamil.length
  };

  const cards = document.querySelectorAll("#dashboardOverview .card h2");
  if (cards.length >= 4) {
    cards[0].textContent = counts.balita;
    cards[1].textContent = counts.ibuHamil;
    cards[2].textContent = counts.pemBalita;
    cards[3].textContent = counts.pemIbuHamil;
  }
}

async function refreshDashboard() {
  updateDashboardOverview();
  refreshDashboardTables();
}

// central refresh: load all data once and update all tables
async function refreshAllTables() {
  const res = await loadAllData();
  if (!res.success) {
    console.warn("Could not load data for refreshAllTables:", res.error);
    return;
  }
  // update UI from in-memory store
  refreshBalitaTable();
  refreshIbuHamilTable();
  refreshPemantauanBalitaTable();
  refreshPemantauanIbuHamilTable();
  refreshDashboard();
}

// --- CRUD UI handlers ---
async function addNewBalita() {
  if (!currentUser) return alert('User not authenticated.');
  const nama = document.getElementById('namaBalita').value;
  const nik = document.getElementById('nikBalita').value;
  const tanggalLahir = document.getElementById('tanggalLahirBalita').value;
  const jenisKelamin = document.getElementById('jenisKelaminBalita').value;
  const bbLahir = parseInt(document.getElementById('bbLahirBalita').value);
  const tbLahir = parseInt(document.getElementById('tbLahirBalita').value);
  const namaOrtu = document.getElementById('namaOrtuBalita').value;
  const alamat = document.getElementById('alamatBalita').value;

  if (!nama || !nik || !tanggalLahir || !jenisKelamin || !bbLahir || !tbLahir || !namaOrtu || !alamat) {
    alert('Harap isi semua field yang wajib diisi!');
    return;
  }

  const balitaData = { nama, nik, tanggalLahir, jenisKelamin, bbLahir, tbLahir, namaOrtu, alamat };
  const result = await addBalitaToDB(balitaData);

  if (result.success) {
    await refreshAllTables();
    const modal = bootstrap.Modal.getInstance(document.getElementById('tambahBalitaModal'));
    if (modal) modal.hide();
    document.getElementById('formTambahBalita').reset();
    alert('Data balita berhasil ditambahkan!');
  } else {
    alert('Gagal menambahkan data balita: ' + result.error);
  }
}

async function confirmDeleteBalita(id) {
  if (!id) return alert("ID data tidak ditemukan.");
  if (!confirm('Apakah Anda yakin ingin menghapus data balita ini?')) return;
  const result = await deleteBalitaFromDB(id);
  if (result.success) {
    await refreshAllTables();
    alert('Data balita berhasil dihapus!');
  } else {
    alert('Gagal menghapus data balita: ' + result.error);
  }
}

// Add new ibu hamil
async function addNewIbuHamil() {
  if (!currentUser) return alert('User not authenticated.');
  const nama = document.getElementById('namaIbuHamil').value;
  const nik = document.getElementById('nikIbuHamil').value;
  const tanggalLahir = document.getElementById('tanggalLahirIbuHamil').value;
  const alamat = document.getElementById('alamatIbuHamil').value;
  const noHp = document.getElementById('noHpIbuHamil').value;
  const pendidikan = document.getElementById('pendidikanIbuHamil').value;
  const pekerjaan = document.getElementById('pekerjaanIbuHamil').value;

  if (!nama || !nik || !tanggalLahir || !alamat || !noHp || !pendidikan || !pekerjaan) {
    alert('Harap isi semua field yang wajib diisi!');
    return;
  }

  const ibuHamilData = { nama, nik, tanggalLahir, alamat, noHp, pendidikan, pekerjaan };
  const result = await addIbuHamilToDB(ibuHamilData);

  if (result.success) {
    await refreshAllTables();
    const modal = bootstrap.Modal.getInstance(document.getElementById('tambahIbuHamilModal'));
    if (modal) modal.hide();
    document.getElementById('formTambahIbuHamil').reset();
    alert('Data ibu hamil berhasil ditambahkan!');
  } else {
    alert('Gagal menambahkan data ibu hamil: ' + result.error);
  }
}

async function confirmDeleteIbuHamil(id) {
  if (!id) return alert("ID data tidak ditemukan.");
  if (!confirm('Apakah Anda yakin ingin menghapus data ibu hamil ini?')) return;
  const result = await deleteIbuHamilFromDB(id);
  if (result.success) {
    await refreshAllTables();
    alert('Data ibu hamil berhasil dihapus!');
  } else {
    alert('Gagal menghapus data ibu hamil: ' + result.error);
  }
}

// Generic CRUD click handler for table buttons
async function handleCrudAction(e, collectionName) {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!id) return alert("ID data tidak ditemukan.");

  if (action === 'delete') {
    if (collectionName === 'balita') return await confirmDeleteBalita(id);
    if (collectionName === 'ibuHamil') return await confirmDeleteIbuHamil(id);
    alert('Hapus untuk koleksi ini belum diimplementasikan.');
  }

  if (action === 'edit') {
    let item = null;
    if (collectionName === 'balita') item = dataStore.balita.find(x => x.id === id);
    if (collectionName === 'ibuHamil') item = dataStore.ibuHamil.find(x => x.id === id);

    if (item) {
      if (collectionName === 'balita') {
        document.getElementById('editBalitaModal').setAttribute('data-edit-id', id);
        document.getElementById('editNamaBalita').value = item.nama || '';
        document.getElementById('editNikBalita').value = item.nik || '';
        document.getElementById('editTanggalLahirBalita').value = item.tanggalLahir || '';
        document.getElementById('editJenisKelaminBalita').value = item.jenisKelamin || '';
        document.getElementById('editBbLahirBalita').value = item.bbLahir || '';
        document.getElementById('editTbLahirBalita').value = item.tbLahir || '';
        document.getElementById('editNamaOrtuBalita').value = item.namaOrtu || '';
        document.getElementById('editAlamatBalita').value = item.alamat || '';
        const modal = new bootstrap.Modal(document.getElementById('editBalitaModal'));
        modal.show();
      } else if (collectionName === 'ibuHamil') {
        document.getElementById('editIbuHamilModal')?.setAttribute('data-edit-id', id);
        document.getElementById('editNamaIbuHamil').value = item.nama || '';
        document.getElementById('editNikIbuHamil').value = item.nik || '';
        document.getElementById('editTanggalLahirIbuHamil').value = item.tanggalLahir || '';
        document.getElementById('editAlamatIbuHamil').value = item.alamat || '';
        document.getElementById('editNoHpIbuHamil').value = item.noHp || '';
        document.getElementById('editPendidikanIbuHamil').value = item.pendidikan || '';
        document.getElementById('editPekerjaanIbuHamil').value = item.pekerjaan || '';
        const modal = document.getElementById('editIbuHamilModal') ? new bootstrap.Modal(document.getElementById('editIbuHamilModal')) : null;
        if (modal) modal.show();
      }
    } else {
      alert('Item tidak ditemukan untuk diedit.');
    }
  }
}

// ---------- BALITA ----------
function openEditBalitaModal(id) {
  const item = dataStore.balita.find(b => b.id === id);
  if (!item) return alert('Data balita tidak ditemukan.');

  const modalEl = document.getElementById('editBalitaModal');
  modalEl.setAttribute('data-edit-id', id);

  document.getElementById('editNamaBalita').value = item.nama || '';
  document.getElementById('editNikBalita').value = item.nik || '';
  document.getElementById('editTanggalLahirBalita').value = item.tanggalLahir || '';
  document.getElementById('editJenisKelaminBalita').value = item.jenisKelamin || '';
  document.getElementById('editBbLahirBalita').value = item.bbLahir || '';
  document.getElementById('editTbLahirBalita').value = item.tbLahir || '';
  document.getElementById('editNamaOrtuBalita').value = item.namaOrtu || '';
  document.getElementById('editAlamatBalita').value = item.alamat || '';

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function saveEditBalita() {
  const modalEl = document.getElementById('editBalitaModal');
  const id = modalEl.getAttribute('data-edit-id');
  if (!id) return alert('ID data tidak ditemukan.');

  const updated = {
    nama: document.getElementById('editNamaBalita').value,
    nik: document.getElementById('editNikBalita').value,
    tanggalLahir: document.getElementById('editTanggalLahirBalita').value,
    jenisKelamin: document.getElementById('editJenisKelaminBalita').value,
    bbLahir: parseInt(document.getElementById('editBbLahirBalita').value),
    tbLahir: parseInt(document.getElementById('editTbLahirBalita').value),
    namaOrtu: document.getElementById('editNamaOrtuBalita').value,
    alamat: document.getElementById('editAlamatBalita').value
  };

  const res = await updateBalitaInDB(id, updated); // Fixed: removed currentUser.uid
  if (res.success) {
    await refreshAllTables();
    bootstrap.Modal.getInstance(modalEl).hide();
    alert('Data balita berhasil diperbarui!');
  } else alert('Gagal memperbarui: ' + res.error);
}

// ---------- IBU HAMIL ----------
function openEditIbuHamilModal(id) {
  const item = dataStore.ibuHamil.find(i => i.id === id);
  if (!item) return alert('Data ibu hamil tidak ditemukan.');

  const modalEl = document.getElementById('editIbuHamilModal');
  modalEl.setAttribute('data-edit-id', id);

  document.getElementById('editNamaIbuHamil').value = item.nama || '';
  document.getElementById('editNikIbuHamil').value = item.nik || '';
  document.getElementById('editTanggalLahirIbuHamil').value = item.tanggalLahir || '';
  document.getElementById('editAlamatIbuHamil').value = item.alamat || '';
  document.getElementById('editNoHpIbuHamil').value = item.noHp || '';
  document.getElementById('editPendidikanIbuHamil').value = item.pendidikan || '';
  document.getElementById('editPekerjaanIbuHamil').value = item.pekerjaan || '';

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function saveEditIbuHamil() {
  const modalEl = document.getElementById('editIbuHamilModal');
  const id = modalEl.getAttribute('data-edit-id');
  if (!id) return alert('ID data tidak ditemukan.');

  const updated = {
    nama: document.getElementById('editNamaIbuHamil').value,
    nik: document.getElementById('editNikIbuHamil').value,
    tanggalLahir: document.getElementById('editTanggalLahirIbuHamil').value,
    alamat: document.getElementById('editAlamatIbuHamil').value,
    noHp: document.getElementById('editNoHpIbuHamil').value,
    pendidikan: document.getElementById('editPendidikanIbuHamil').value,
    pekerjaan: document.getElementById('editPekerjaanIbuHamil').value
  };

  const res = await updateIbuHamilInDB(id, updated); // Fixed: removed currentUser.uid
  if (res.success) {
    await refreshAllTables();
    bootstrap.Modal.getInstance(modalEl).hide();
    alert('Data ibu hamil berhasil diperbarui!');
  } else alert('Gagal memperbarui: ' + res.error);
}

// ---------- PEMANTAUAN BALITA ----------
function openEditPemantauanBalitaModal(id) {
  const item = dataStore.pemantauanBalita.find(p => p.id === id);
  if (!item) return alert('Data pemantauan balita tidak ditemukan.');

  const modalEl = document.getElementById('editPemantauanBalitaModal');
  modalEl.setAttribute('data-edit-id', id);

  document.getElementById('editTanggalPemBalita').value = item.tanggal || '';
  document.getElementById('editNamaBalitaPem').value = item.namaBalita || '';
  document.getElementById('editBbPemBalita').value = item.bb || '';
  document.getElementById('editTbPemBalita').value = item.tb || '';
  document.getElementById('editLkPemBalita').value = item.lk || '';
  document.getElementById('editLlaPemBalita').value = item.lla || '';
  document.getElementById('editStatusGiziPemBalita').value = item.statusGizi || '';

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function saveEditPemantauanBalita() {
  const modalEl = document.getElementById('editPemantauanBalitaModal');
  const id = modalEl.getAttribute('data-edit-id');
  if (!id) return alert('ID data tidak ditemukan.');

  const updated = {
    tanggal: document.getElementById('editTanggalPemBalita').value,
    namaBalita: document.getElementById('editNamaBalitaPem').value,
    bb: document.getElementById('editBbPemBalita').value,
    tb: document.getElementById('editTbPemBalita').value,
    lk: document.getElementById('editLkPemBalita').value,
    lla: document.getElementById('editLlaPemBalita').value,
    statusGizi: document.getElementById('editStatusGiziPemBalita').value
  };

  const res = await updatePemantauanBalitaInDB(id, updated); // Fixed: use correct function
  if (res.success) {
    await refreshAllTables();
    bootstrap.Modal.getInstance(modalEl).hide();
    alert('Data pemantauan balita diperbarui!');
  } else alert('Gagal memperbarui: ' + res.error);
}

// ---------- PEMANTAUAN IBU HAMIL ----------
function openEditPemantauanIbuHamilModal(id) {
  const item = dataStore.pemantauanIbuHamil.find(p => p.id === id);
  if (!item) return alert('Data pemantauan ibu hamil tidak ditemukan.');

  const modalEl = document.getElementById('editPemantauanIbuHamilModal');
  modalEl.setAttribute('data-edit-id', id);

  document.getElementById('editTanggalKunjungan').value = item.tanggalKunjungan || '';
  document.getElementById('editNamaIbuPem').value = item.namaIbu || '';
  document.getElementById('editUsiaKehamilan').value = item.usiaKehamilan || '';
  document.getElementById('editTekananDarah').value = item.tekananDarah || '';
  document.getElementById('editBbPemIbu').value = item.bb || '';
  document.getElementById('editKeluhan').value = item.keluhan || '';
  document.getElementById('editStatusPemIbu').value = item.status || '';

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

async function saveEditPemantauanIbuHamil() {
  const modalEl = document.getElementById('editPemantauanIbuHamilModal');
  const id = modalEl.getAttribute('data-edit-id');
  if (!id) return alert('ID data tidak ditemukan.');

  const updated = {
    tanggalKunjungan: document.getElementById('editTanggalKunjungan').value,
    namaIbu: document.getElementById('editNamaIbuPem').value,
    usiaKehamilan: document.getElementById('editUsiaKehamilan').value,
    tekananDarah: document.getElementById('editTekananDarah').value,
    bb: document.getElementById('editBbPemIbu').value,
    keluhan: document.getElementById('editKeluhan').value,
    status: document.getElementById('editStatusPemIbu').value
  };

  const res = await updateIbuHamilInDB(currentUser.uid, id, updated);
  if (res.success) {
    await refreshAllTables();
    bootstrap.Modal.getInstance(modalEl).hide();
    alert('Data pemantauan ibu hamil diperbarui!');
  } else alert('Gagal memperbarui: ' + res.error);
}

async function updatePemantauanBalitaInDB(id, data) {
  try {
    await db.collection('users').doc(currentUser.uid).collection('pemantauanBalita').doc(id).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || err };
  }
}

async function updatePemantauanIbuHamilInDB(id, data) {
  try {
    await db.collection('users').doc(currentUser.uid).collection('pemantauanIbuHamil').doc(id).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || err };
  }
}

// --- Firebase Authentication ---
function setupAuthStateListener() {
  auth.onAuthStateChanged(async (user) => {
    console.log("🔄 Auth state changed:", user);
    
    if (user) {
      try {
        // Set currentUser
        currentUser = {
          uid: user.uid,
          email: user.email,
          ...user
        };

        // Update navbar with user's name (async)
        await updateNavbarUserDisplay();
        
        // Get user role from Firestore (your existing code)
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
          currentUser.role = userDoc.data().role;
        } else {
          // Create user document if it doesn't exist
          await setupUserRole(user, 'member');
          currentUser.role = 'member';
        }
        
        console.log("User logged in:", currentUser.email, "Role:", currentUser.role);
        
        // Update UI based on role
        updateUIForUserRole();
        
        // Load user data and show dashboard
        const result = await loadAllData();
        if (result.success) {
          document.getElementById('homepage').classList.add('hidden');
          document.getElementById('loginSection').classList.add('hidden');
          document.getElementById('dashboardSection').classList.remove('hidden');
          
          await refreshAllTables();
          showSection('dashboardOverview');
          setTimeout(() => initSidebarToggle(), 100);
        } else {
          alert('Gagal memuat data: ' + result.error);
        }
      } catch (error) {
        console.error("Error in auth state change:", error);
      }
    } else {
      // User is signed out
      currentUser = null;
      console.log("User logged out");
      
      updateNavbarUserDisplay();
      document.getElementById('dashboardSection').classList.add('hidden');
      document.getElementById('loginSection').classList.add('hidden');
      document.getElementById('homepage').classList.remove('hidden');
    }
  });
}

// Add to your existing Firebase config
const setupUserRole = async (user, role = 'member') => {
  try {
    const userRef = db.collection('users').doc(user.uid);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      // New user - create document with role
      await userRef.set({
        email: user.email,
        role: role,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("New user created with role:", role);
    }
    return { success: true };
  } catch (error) {
    console.error("Error setting up user role:", error);
    return { success: false, error: error.message };
  }
};

// Enhanced login function
async function loginUser(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Get user role from Firestore
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists) {
      user.role = userDoc.data().role;
    } else {
      // Set default role for existing users
      await setupUserRole(user, 'member');
      user.role = 'member';
    }
    
    return { success: true, user: user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Registration function with role
async function registerUser(email, password, role = 'member') {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Setup user document with role
    const result = await setupUserRole(user, role);
    if (result.success) {
      user.role = role;
      return { success: true, user: user };
    } else {
      // If setting role fails, delete the user
      await user.delete();
      return { success: false, error: result.error };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Logout function
async function logoutUser() {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- Navbar display & auth ---
async function updateNavbarUserDisplay() {
  const navUserLink = document.getElementById('navUserLink');
  if (!navUserLink) return;
  
  console.log("🔄 Updating navbar display, currentUser:", currentUser);
  
  if (currentUser && currentUser.uid) {
    try {
      // Fetch user data from Firestore to get the name
      const userDoc = await db.collection('members').doc(currentUser.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const userName = userData.nama || userData.name || userData.displayName || currentUser.email.split('@')[0];
        
        // Display "Hi, {name}"
        navUserLink.innerHTML = `<i class="fas fa-user me-1"></i> Hi, ${userName}`;
        navUserLink.classList.add('text-warning');
        navUserLink.style.fontWeight = '500';
        
        console.log("✅ Navbar updated with name:", userName);
      } else {
        // Fallback if user document doesn't exist
        navUserLink.innerHTML = `<i class="fas fa-user me-1"></i> Hi, User`;
        navUserLink.classList.add('text-warning');
      }
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      // Fallback to email
      const displayName = currentUser.email.split('@')[0];
      navUserLink.innerHTML = `<i class="fas fa-user me-1"></i> Hi, ${displayName}`;
      navUserLink.classList.add('text-warning');
    }
  } else {
    // User not logged in
    navUserLink.textContent = 'Login';
    navUserLink.classList.remove('text-warning');
    navUserLink.style.fontWeight = 'normal';
    navUserLink.innerHTML = 'Login';
  }
}

function setupSidebarToggle() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (!sidebarToggle || !sidebar) return;
  
  safeAddListener(sidebarToggle, 'click', (e) => {
    e.preventDefault();
    sidebar.classList.toggle('collapsed');
    
    // Update toggle button icon
    const icon = sidebarToggle.querySelector('i');
    if (icon) {
      if (sidebar.classList.contains('collapsed')) {
        icon.classList.remove('bi-list');
        icon.classList.add('bi-arrow-right');
      } else {
        icon.classList.remove('bi-arrow-right');
        icon.classList.add('bi-list');
      }
    }
  });
}

function initSidebarToggle() {
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle && !sidebarToggle.dataset.listenerAdded) {
    setupSidebarToggle();
  }
}

function updateUIForUserRole() {
  const isAdmin = currentUser && currentUser.role === 'admin';
  
  // Show/hide admin features
  const adminElements = document.querySelectorAll('[data-role="admin"]');
  adminElements.forEach(el => {
    el.style.display = isAdmin ? 'block' : 'none';
  });
  
  // Show/hide member features
  const memberElements = document.querySelectorAll('[data-role="member"]');
  memberElements.forEach(el => {
    el.style.display = isAdmin ? 'none' : 'block';
  });
  
  // Update sidebar based on role
  updateSidebarForRole();
}

function updateSidebarForRole() {
  const isAdmin = currentUser && currentUser.role === 'admin';
  
  // Example: Hide user management for non-admins
  const userManagementNav = document.querySelector('[data-section="userManagement"]');
  if (userManagementNav) {
    userManagementNav.style.display = isAdmin ? 'block' : 'none';
  }
  
  // Add role badge to user display
  const roleBadge = document.getElementById('userRoleBadge');
  if (roleBadge) {
    roleBadge.textContent = currentUser?.role === 'admin' ? 'Admin' : 'Member';
    roleBadge.className = currentUser?.role === 'admin' ? 'badge bg-danger' : 'badge bg-primary';
  }
}

// Admin function to get all users
async function getAllUsers() {
  if (!currentUser || currentUser.role !== 'admin') {
    console.error("Access denied: Admin role required");
    return { success: false, error: "Access denied" };
  }
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, users: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Admin function to update user role
async function updateUserRole(userId, newRole) {
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: "Access denied" };
  }
  
  try {
    await db.collection('users').doc(userId).update({
      role: newRole,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Admin function to get all users
async function getAllUsers() {
  if (!currentUser || currentUser.role !== 'admin') {
    console.error("Access denied: Admin role required");
    return { success: false, error: "Access denied" };
  }
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, users: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Admin function to update user role
async function updateUserRole(userId, newRole) {
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: "Access denied" };
  }
  
  try {
    await db.collection('users').doc(userId).update({
      role: newRole,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Admin function to get all users
async function getAllUsers() {
  if (!currentUser || currentUser.role !== 'admin') {
    console.error("Access denied: Admin role required");
    return { success: false, error: "Access denied" };
  }
  
  try {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, users: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Admin function to update user role
async function updateUserRole(userId, newRole) {
  if (!currentUser || currentUser.role !== 'admin') {
    return { success: false, error: "Access denied" };
  }
  
  try {
    await db.collection('users').doc(userId).update({
      role: newRole,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// --- NEW: Function to fetch and render homepage features ---
async function fetchAndRenderFeatures() {
  try {
      // Fetch all documents from the 'features' collection
      // This collection is outside the 'users/{uid}' path as it's general content.
      const featuresSnapshot = await db.collection('features').get();
      const featuresData = featuresSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
      }));

      const container = document.getElementById('featuresContainer');
      if (!container) return; // Exit if the container element is not found

      let htmlContent = '';
      
      // Loop through the data and build the HTML for each card
      featuresData.forEach(feature => {
          htmlContent += `
              <div class="col-md-4">
                  <div class="card feature-card">
                      <div class="card-body text-center p-4">
                          <div class="feature-icon">
                              <img src="${feature.iconPath || 'path/to/default/icon.png'}" alt="Icon" class="img-fluid" style="max-height: 48px;">
                          </div>
                          <h5 class="card-title">${feature.title || 'Untitled Feature'}</h5>
                          <p class="card-text">${feature.description || 'No description provided.'}</p>
                      </div>
                  </div>
              </div>
          `;
      });

      container.innerHTML = htmlContent;
      console.log(`✅ ${featuresData.length} features rendered from Firestore.`);

  } catch (error) {
      console.error("❌ Error fetching and rendering features:", error);
  }
}

async function getUserName(uid) {
  try {
    const userDoc = await db.collection('members').doc(uid).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData.nama || userData.name || userData.displayName || 'User';
    }
    return 'User';
  } catch (error) {
    console.error("Error getting user name:", error);
    return 'User';
  }
}

// --- Initialization (single-run) ---
let appInitialized = false;
document.addEventListener('DOMContentLoaded', () => {
  const navbarCollapse = document.getElementById("navbarNav");
  const bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

  if (window.innerWidth < 992 && navbarCollapse.classList.contains("show")) {
    bsCollapse.hide();
  }

  if (window.appInitialized) return; // prevent double init
  window.appInitialized = true;

  // === Hide footer when dashboard is visible ===
  const footer = document.getElementById("globalFooter");
  const dashboardSection = document.getElementById("dashboardSection");

  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 992) bsCollapse.hide();
    });
  });

  function updateFooterVisibility() {
    if (!footer || !dashboardSection) return;
    const isDashboardVisible = !dashboardSection.classList.contains("hidden");
    footer.style.display = isDashboardVisible ? "none" : "block";
  }

  // Observe class changes on dashboardSection to toggle footer automatically
  const observer = new MutationObserver(updateFooterVisibility);
  observer.observe(dashboardSection, { attributes: true, attributeFilter: ["class"] });

  // Initial check
  updateFooterVisibility();

  const homepage = document.getElementById("homepage");
  const pengetahuanDetail = document.getElementById("pengetahuanDetail");
  const detailTitle = document.getElementById("detailTitle");
  const detailContent = document.getElementById("detailContent");
  const backBtn = document.getElementById("backToPengetahuan");

   const pptFiles = {
  "KIA (Kesehatan Ibu dan Anak)": "https://docs.google.com/presentation/d/1-4XikR2RWXVFDopIJQUs9LLCRijm4D4M/embed?start=false&loop=false&delayms=3000",
  "KB (Keluarga Berencana)": "https://docs.google.com/presentation/d/1kdMkdl9AJOIjSfUecovXaco7xB6YSK8R/embed?start=false&loop=false&delayms=3000",
  "Imunisasi": "https://docs.google.com/presentation/d/1nq7wVIeUSTz3QrATLqz02YcT_ES19-Ye/embed?start=false&loop=false&delayms=3000",
  "Penyakit Menular dan Tidak Menular": "https://docs.google.com/presentation/d/1fxQDX6fncHXsBAOrdyRaUFONIuhU4pcW/embed?start=false&loop=false&delayms=3000",
  "PHBS (Perilaku Hidup Bersih dan Sehat)": "https://docs.google.com/presentation/d/1D3dHRWd7foeyYSmChPRmrGqTr2LkWosf/embed?start=false&loop=false&delayms=3000",
  "Gizi Seimbang": "https://docs.google.com/presentation/d/1KBIHQpyG-OYdyK3UjoB_wHv-JIhH0Q-b/embed?start=false&loop=false&delayms=3000"
};

const knowledgeCards = document.querySelectorAll(
  "#homepage .card.feature-card"
);

// Fade transition to detail
function switchToDetail(title) {
  homepage.classList.remove("active");
  setTimeout(() => {
    homepage.classList.add("hidden");
    detailTitle.textContent = title;

    const embedURL = pptFiles[title];
    detailContent.innerHTML = embedURL
      ? `<iframe src="${embedURL}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`
      : `<p class="text-center mt-5">Materi belum tersedia untuk topik ini.</p>`;

    pengetahuanDetail.classList.remove("hidden");
    setTimeout(() => pengetahuanDetail.classList.add("active"), 50);
    window.scrollTo(0, 0);
  }, 500);
}

// Fade back to home
function backToHome() {
  pengetahuanDetail.classList.remove("active");
  setTimeout(() => {
    pengetahuanDetail.classList.add("hidden");
    homepage.classList.remove("hidden");
    setTimeout(() => homepage.classList.add("active"), 50);
    window.scrollTo(0, 0);
  }, 500);
}

// Attach click events
knowledgeCards.forEach((card) => {
  card.addEventListener("click", () => {
    const title = card.querySelector(".card-title").textContent.trim();
    switchToDetail(title);
  });
});

  backBtn.addEventListener("click", backToHome);

  // === Continue normal app initialization ===
  initApp();
});

function initApp() {
  // Setup auth state listener
  setupAuthStateListener();

  // Login form
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
    submitBtn.disabled = true;

    // Try to sign in using Firebase Auth
    const userCredential = await auth.signInWithEmailAndPassword(username, password);
    const user = userCredential.user;

    console.log("✅ Firebase auth success:", user.uid);

    // Check if the user exists in "members" collection
    const memberRef = db.collection("members").doc(user.uid);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      await auth.signOut();
      alert("Akun ini tidak terdaftar sebagai anggota POSELIA.");
      
      // Reset button
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      return;
    }

    // ✅ Authorized member - set currentUser
    currentUser = {
      uid: user.uid,
      email: user.email,
      ...user
    };

    console.log("✅ Member verified:", currentUser);

    // Update navbar with user's name (this is now async)
    await updateNavbarUserDisplay();

    // Switch to dashboard view
    document.getElementById("homepage").classList.add("hidden");
    document.getElementById("loginSection").classList.add("hidden");
    document.getElementById("dashboardSection").classList.remove("hidden");
    document.body.classList.remove("login-active");

    // Load data and refresh UI
    await refreshAllTables();

    // Force navbar update again to ensure it's visible
    setTimeout(() => updateNavbarUserDisplay(), 500);

  } catch (err) {
    console.error("❌ Login error:", err);
    
    // Reset button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.innerHTML = 'Login';
    submitBtn.disabled = false;
    
    alert("Gagal masuk: " + (err.message || err));
  }
});


  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  safeAddListener(logoutBtn, 'click', async e => {
    e.preventDefault();
    const result = await logoutUser();
    if (result.success) {
      // Force navbar update immediately
      updateNavbarUserDisplay();
    } else {
      alert('Logout gagal: ' + result.error);
    }
  });

  // Navbar login link
  const navUserLink = document.getElementById('navUserLink');
  safeAddListener(navUserLink, 'click', e => {
    e.preventDefault();
    if (!currentUser) {
      document.getElementById('homepage').classList.add('hidden');
      document.getElementById('dashboardSection').classList.add('hidden');
      document.getElementById('loginSection').classList.remove('hidden');
      document.body.classList.add('login-active');
    }
  });

  // Sidebar nav links
  document.querySelectorAll('#dashboardSection .nav-link[data-section]').forEach(link => {
    safeAddListener(link, 'click', e => {
      e.preventDefault();
      const targetId = link.getAttribute('data-section');
      showSection(targetId);
      setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
    });
  });

  // Sidebar toggle
  setTimeout(() => initSidebarToggle(), 100);

  // Save / Add buttons
  safeAddListener(document.getElementById('saveBalita'), 'click', e => {
    e.preventDefault();
    addNewBalita();
  });
  safeAddListener(document.getElementById('saveIbuHamil'), 'click', e => {
    e.preventDefault();
    addNewIbuHamil();
  });

  // Save edits
  safeAddListener(document.getElementById('saveEditBalita'), 'click', e => {
    e.preventDefault();
    saveEditBalita();
  });
  safeAddListener(document.getElementById('saveEditIbuHamil'), 'click', e => {
    e.preventDefault();
    saveEditIbuHamil();
  });

  // Initial UI state
  updateNavbarUserDisplay();
}

// === GENERATE PDF ===
async function downloadPDFBalita() {
  if (!dataStore.balita.length) {
    alert("Tidak ada data balita untuk diunduh.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Laporan Data Balita - POSELIA", 14, 15);
  doc.setFontSize(12);

  let y = 25;
  dataStore.balita.forEach((b, i) => {
    doc.text(`${i + 1}. ${b.nama || "-"} (${b.nik || "-"})`, 14, y);
    y += 6;
    doc.text(`   Umur: ${getAge(b.tanggalLahir)} th | Alamat: ${b.alamat || "-"}`, 14, y);
    y += 8;
    if (y > 270) { doc.addPage(); y = 20; }
  });

  doc.save("laporan_balita.pdf");
}

// === GENERATE EXCEL ===
async function downloadExcelIbuHamil() {
  if (!dataStore.ibuHamil.length) {
    alert("Tidak ada data ibu hamil untuk diunduh.");
    return;
  }

  const wsData = [
    ["Nama", "NIK", "Tanggal Lahir", "Umur", "Alamat", "No HP", "Pendidikan", "Pekerjaan"]
  ];

  dataStore.ibuHamil.forEach(i => {
    wsData.push([
      i.nama || "-",
      i.nik || "-",
      i.tanggalLahir || "-",
      getAge(i.tanggalLahir) + " th",
      i.alamat || "-",
      i.noHp || "-",
      i.pendidikan || "-",
      i.pekerjaan || "-"
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Data Ibu Hamil");
  XLSX.writeFile(wb, "laporan_ibu_hamil.xlsx");
}


// Expose some helpers to window (optional, for debugging)
window.refreshAllTables = refreshAllTables;
window.refreshDashboard = refreshDashboard;
window.showSection = showSection;
