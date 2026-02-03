const API_BASE = 'https://api.jikan.moe/v4';

const topList = document.getElementById('topList');
const topStatus = document.getElementById('topStatus');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchList = document.getElementById('searchList');
const searchStatus = document.getElementById('searchStatus');
const playerModal = document.getElementById('playerModal');
const playerClose = document.getElementById('playerClose');
const playerFrame = document.getElementById('playerFrame');
const playerTitle = document.getElementById('playerTitle');
const playerMeta = document.getElementById('playerMeta');
const playerLink = document.getElementById('playerLink');
const VIDKING_BASE = 'https://anime.nexus';

function createCard(anime, isHorizontal = false) {
  const card = document.createElement('button');
  const cardClass = isHorizontal 
    ? 'group relative overflow-hidden rounded-lg bg-slate-900 transition-all duration-300 hover:scale-105 hover:z-10 cursor-pointer shadow-lg hover:shadow-2xl flex-shrink-0 w-48'
    : 'group relative overflow-hidden rounded-lg bg-slate-900 transition-all duration-300 hover:scale-105 hover:z-10 cursor-pointer shadow-lg hover:shadow-2xl';
  
  card.className = cardClass;

  const imageUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || anime.images?.webp?.image_url || '';
  const score = anime.score ?? '—';
  const year = anime.year || (anime.aired?.prop?.from?.year ?? '—');

  card.innerHTML = `
    <div class="aspect-[2/3] overflow-hidden bg-slate-800">
      ${imageUrl ? `<img src="${imageUrl}" alt="${anime.title}" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />` : '<div class="w-full h-full flex items-center justify-center text-slate-600">No Image</div>'}
    </div>
    <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
      <div class="font-semibold text-sm mb-1 line-clamp-2">${anime.title}</div>
      <div class="text-xs text-slate-300 flex items-center gap-2">
        <span class="bg-yellow-500 text-black px-2 py-0.5 rounded font-bold">⭐ ${score}</span>
        <span class="text-slate-400">${year}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => playTrailer(anime));
  return card;
}

function playTrailer(anime) {
  const trailer = anime.trailer?.embed_url;
  const title = anime.title || 'Selected Anime';
  const score = anime.score ?? '—';
  const url = anime.url;

  playerModal.classList.remove('hidden');
  playerTitle.textContent = title;
  playerMeta.textContent = `Score: ${score}`;
  playerLink.innerHTML = url ? `<a href="${url}" target="_blank" class="text-blue-400 hover:text-blue-300 underline text-sm">View on MyAnimeList</a>` : '';

  const nexusUrl = `${VIDKING_BASE}/?search=${encodeURIComponent(title)}`;
  playerFrame.src = nexusUrl;

  if (!trailer) {
    playerTitle.textContent = `${title}`;
  }
}

function closePlayerModal() {
  playerModal.classList.add('hidden');
  playerFrame.src = '';
}

playerClose.addEventListener('click', closePlayerModal);
playerModal.addEventListener('click', (e) => {
  if (e.target === playerModal) closePlayerModal();
});


async function fetchTopAnime() {
  try {
    topStatus.textContent = 'Loading…';
    const res = await fetch(`${API_BASE}/top/anime?limit=20`);
    const data = await res.json();
    const list = data.data || [];

    topList.innerHTML = '';
    list.forEach(anime => topList.appendChild(createCard(anime, true)));
    topStatus.textContent = 'Updated';
  } catch (err) {
    topStatus.textContent = 'Failed to load';
    topList.innerHTML = '<div class="text-sm text-red-400">Unable to load top anime right now.</div>';
  }
}

async function fetchAiringAnime() {
  const airingList = document.getElementById('airingList');
  const airingStatus = document.getElementById('airingStatus');
  try {
    airingStatus.textContent = 'Loading…';
    const res = await fetch(`${API_BASE}/seasons/now?limit=20`);
    const data = await res.json();
    const list = data.data || [];

    airingList.innerHTML = '';
    list.forEach(anime => airingList.appendChild(createCard(anime, true)));
    airingStatus.textContent = 'Updated';
  } catch (err) {
    airingStatus.textContent = 'Failed';
    airingList.innerHTML = '<div class="text-sm text-red-400">Unable to load.</div>';
  }
}

async function fetchPopularAnime() {
  const popularList = document.getElementById('popularList');
  const popularStatus = document.getElementById('popularStatus');
  try {
    popularStatus.textContent = 'Loading…';
    const res = await fetch(`${API_BASE}/top/anime?filter=bypopularity&limit=20`);
    const data = await res.json();
    const list = data.data || [];

    popularList.innerHTML = '';
    list.forEach(anime => popularList.appendChild(createCard(anime, true)));
    popularStatus.textContent = 'Updated';
  } catch (err) {
    popularStatus.textContent = 'Failed';
    popularList.innerHTML = '<div class="text-sm text-red-400">Unable to load.</div>';
  }
}

async function fetchUpcomingAnime() {
  const upcomingList = document.getElementById('upcomingList');
  const upcomingStatus = document.getElementById('upcomingStatus');
  try {
    upcomingStatus.textContent = 'Loading…';
    const res = await fetch(`${API_BASE}/seasons/upcoming?limit=20`);
    const data = await res.json();
    const list = data.data || [];

    upcomingList.innerHTML = '';
    list.forEach(anime => upcomingList.appendChild(createCard(anime, true)));
    upcomingStatus.textContent = 'Updated';
  } catch (err) {
    upcomingStatus.textContent = 'Failed';
    upcomingList.innerHTML = '<div class="text-sm text-red-400">Unable to load.</div>';
  }
}

async function searchAnime(query) {
  if (!query) return;
  searchStatus.classList.remove('hidden');
  searchStatus.textContent = 'Searching…';

  try {
    const res = await fetch(`${API_BASE}/anime?q=${encodeURIComponent(query)}&order_by=score&sort=desc&limit=20`);
    const data = await res.json();
    const list = data.data || [];

    searchList.innerHTML = '';
    if (list.length === 0) {
      searchStatus.textContent = 'No results';
      return;
    }

    list.forEach(anime => searchList.appendChild(createCard(anime)));
    searchStatus.textContent = `Results: ${list.length}`;
  } catch (err) {
    searchStatus.textContent = 'Search failed';
    searchList.innerHTML = '<div class="text-sm text-red-400">Unable to search right now.</div>';
  }
}

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  searchAnime(query);
});

// Scroll button functionality
document.querySelectorAll('.scroll-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const targetId = e.currentTarget.dataset.target;
    const container = document.getElementById(targetId);
    const scrollAmount = 800;
    
    if (e.currentTarget.classList.contains('scroll-left')) {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  });
});

// Load all sections in parallel with staggered timing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    fetchAiringAnime();
    fetchTopAnime();
    fetchPopularAnime();
    fetchUpcomingAnime();
  });
} else {
  fetchAiringAnime();
  fetchTopAnime();
  fetchPopularAnime();
  fetchUpcomingAnime();
}
