const albumsGrid = document.getElementById('albumsGrid');
const albumsStatus = document.getElementById('albumsStatus');

const openDailySonglessBtn = document.getElementById('openDailySonglessBtn');
const openBanleBtn = document.getElementById('openBanleBtn');
const playlistStatus = document.getElementById('playlistStatus');
const toListenEmbed = document.getElementById('toListenEmbed');
const MUSIC_API_BASE = window.API_BASE_URL
  || document.querySelector('meta[name="auth-api-base"]')?.getAttribute('content')
  || localStorage.getItem('authApiBase')
  || `${window.location.origin}/api`;

const musicBackgroundImages = [
  'assets/music/bastard-bunii-cover.jpg',
  'assets/music/boy-2hollis-cover.jpg',
  'assets/music/censusdesignated-janeremover-cover.jpg',
  'assets/music/fetedelavanille-lucybedroque-cover.jpg',
  'assets/music/ghostholding-janeremover-cover.jpg',
  'assets/music/halfblood-slayr-cover.jpg',
  'assets/music/inelsewhere-zayok-cover.jpg',
  'assets/music/KessokuBand_bocchitherock_cover.jpg',
  'assets/music/melancholyhotorcold-sayako-cover.jpg',
  'assets/music/persona5ost-persona-cover.jpg',
  'assets/music/rewired-kuru-cover.jpg'
];

let currentMusicBackgroundImage = '';

const playlistLinks = {
  toListen: 'https://open.spotify.com/playlist/1RqJJiGxH5xxuogjxGsFpw',
  dailySongless: 'https://lessgames.com/songless',
  banle: 'https://bandle.app/daily'
};

const rymRecommendations = [
  {
    title: 'Kendrick Lamar - To Pimp a Butterfly',
    rymRating: 4.35,
    releaseDate: '2025-03-15',
    url: 'https://rateyourmusic.com/release/album/kendrick-lamar/to-pimp-a-butterfly/'
  },
  {
    title: 'Radiohead - In Rainbows',
    rymRating: 4.24,
    releaseDate: '2025-04-12',
    url: 'https://rateyourmusic.com/release/album/radiohead/in-rainbows/'
  },
  {
    title: 'Sufjan Stevens - Illinois',
    rymRating: 4.16,
    releaseDate: '2025-05-02',
    url: 'https://rateyourmusic.com/release/album/sufjan-stevens/illinois/'
  },
  {
    title: 'Frank Ocean - Blonde',
    rymRating: 4.12,
    releaseDate: '2025-05-27',
    url: 'https://rateyourmusic.com/release/album/frank-ocean/blonde/'
  },
  {
    title: 'Fleet Foxes - Helplessness Blues',
    rymRating: 4.08,
    releaseDate: '2025-06-08',
    url: 'https://rateyourmusic.com/release/album/fleet-foxes/helplessness-blues/'
  },
  {
    title: 'Tyler, The Creator - IGOR',
    rymRating: 4.03,
    releaseDate: '2025-06-29',
    url: 'https://rateyourmusic.com/release/album/tyler-the-creator/igor/'
  },
  {
    title: 'Björk - Vespertine',
    rymRating: 4.15,
    releaseDate: '2025-07-13',
    url: 'https://rateyourmusic.com/release/album/bjork/vespertine/'
  },
  {
    title: 'Arcade Fire - Funeral',
    rymRating: 4.06,
    releaseDate: '2025-08-02',
    url: 'https://rateyourmusic.com/release/album/arcade-fire/funeral/'
  },
  {
    title: 'Tame Impala - Currents',
    rymRating: 3.75,
    releaseDate: '2025-09-01',
    url: 'https://rateyourmusic.com/release/album/tame-impala/currents/'
  },
  {
    title: 'Porter Robinson - Nurture',
    rymRating: 3.68,
    releaseDate: '2025-10-10',
    url: 'https://rateyourmusic.com/release/album/porter-robinson/nurture/'
  },
  {
    title: 'Little Simz - Sometimes I Might Be Introvert',
    rymRating: 3.97,
    releaseDate: '2025-11-07',
    url: 'https://rateyourmusic.com/release/album/little-simz/sometimes-i-might-be-introvert/'
  },
  {
    title: 'JPEGMAFIA x Danny Brown - SCARING THE HOES',
    rymRating: 3.94,
    releaseDate: '2026-01-19',
    url: 'https://rateyourmusic.com/release/album/jpegmafia-danny-brown/scaring-the-hoes/'
  }
];

const fallbackRecommendation = {
  title: 'nettspend - BAFK',
  rymRating: null,
  releaseDate: 'Backup pick',
  url: 'https://rateyourmusic.com/search?searchterm=nettspend%20BAFK&searchtype=l'
};

function getDailyIndex(seedText, size) {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = ((hash << 5) - hash) + seedText.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % size;
}

function applyRandomMusicBackground() {
  if (!musicBackgroundImages.length) return Promise.resolve('');

  const randomIndex = Math.floor(Math.random() * musicBackgroundImages.length);
  const chosenImage = musicBackgroundImages[randomIndex];
  return new Promise((resolve) => {
    const preload = new Image();

    preload.onload = () => {
      currentMusicBackgroundImage = chosenImage;
      document.body.style.backgroundImage = `url('${chosenImage}')`;
      resolve(chosenImage);
    };

    preload.onerror = () => {
      currentMusicBackgroundImage = '';
      document.body.style.backgroundImage = '';
      resolve('');
    };

    preload.src = chosenImage;
  });
}

function isWithinLastYear(releaseDate, now = new Date()) {
  const release = new Date(releaseDate);
  if (Number.isNaN(release.getTime())) return false;

  const msInDay = 24 * 60 * 60 * 1000;
  const daysSinceRelease = Math.floor((now - release) / msInDay);
  return daysSinceRelease >= 0 && daysSinceRelease <= 365;
}

function renderAlbumCard(album) {
  const card = document.createElement('div');
  card.className = 'rounded-lg overflow-hidden shadow music-glass-subtle';

  const ratingText = typeof album.rymRating === 'number'
    ? `RYM rating: ${album.rymRating.toFixed(2)} / 5.00`
    : 'RYM rating: N/A (backup recommendation)';

  const coverHtml = album.coverUrl
    ? `<img src="${album.coverUrl}" alt="${album.name} cover" class="w-full h-64 object-cover" loading="lazy" referrerpolicy="no-referrer">`
    : '<div class="px-4 py-6 text-center text-slate-300 text-sm">Album cover unavailable</div>';

  card.innerHTML = `
    <div style="background: rgba(15, 23, 42, 0.42); border-bottom: 1px solid rgba(148, 163, 184, 0.2);">
      ${coverHtml}
    </div>
    <div class="p-3">
      <p class="font-semibold text-sm line-clamp-2">${album.name}</p>
      <p class="text-xs text-slate-400 mt-1 line-clamp-2">${ratingText}</p>
      <p class="text-xs text-slate-400 mt-1 line-clamp-2">Released: ${album.releaseDate}</p>
      <p class="text-xs text-slate-500 mt-1">Rate Your Music recommendation</p>
      <a href="${album.url || '#'}" target="_blank" rel="noopener noreferrer" class="inline-block mt-3 text-sm px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded">Open on Rate Your Music</a>
    </div>
  `;

  return card;
}

function renderTruRecommendationCard(album) {
  const card = document.createElement('div');
  card.className = 'rounded-lg overflow-hidden shadow music-glass-subtle p-4';

  const coverHtml = album.coverUrl
    ? `<img src="${album.coverUrl}" alt="${album.name} cover" class="w-28 h-28 object-cover rounded-lg" loading="lazy" referrerpolicy="no-referrer">`
    : '<div class="w-28 h-28 rounded-lg bg-slate-800 flex items-center justify-center text-xs text-slate-300">No cover</div>';

  const infoRows = [];
  if (album.artist) infoRows.push(`<p class="text-xs text-slate-400 mt-1">Artist: ${album.artist}</p>`);
  if (album.album) infoRows.push(`<p class="text-xs text-slate-400">Album: ${album.album}</p>`);
  const scoreText = typeof album.rymRating === 'number'
    ? album.rymRating.toFixed(2)
    : 'N/A';
  const releaseText = album.releaseDate || 'N/A';

  card.innerHTML = `
    <div class="flex items-center justify-between gap-4">
      <div class="min-w-0">
        <p class="text-xs text-indigo-300 uppercase tracking-wide">Tru's Recommendation</p>
        <p class="text-sm text-slate-100 font-semibold mt-1 line-clamp-2">${album.name}</p>
        <p class="text-xs text-slate-400 mt-1">Matched from background-linked RYM txt</p>
        ${infoRows.join('')}
        <p class="text-xs text-slate-400">Score: ${scoreText}</p>
        <p class="text-xs text-slate-400">Release Date: ${releaseText}</p>
        ${album.url ? `<a href="${album.url}" target="_blank" rel="noopener noreferrer" class="inline-block mt-2 text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-700 rounded">Open on RYM</a>` : ''}
      </div>
      ${coverHtml}
    </div>
  `;

  return card;
}

function getBackgroundRecommendationKey() {
  if (!currentMusicBackgroundImage) return '';
  const fileName = currentMusicBackgroundImage.split('/').pop() || '';
  const noExt = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '');
  return noExt.replace(/[-_]?cover$/i, '').toLowerCase();
}

function parseRymReleaseInfoFromUrl(rymUrl) {
  try {
    const parsed = new URL(rymUrl);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const releaseIndex = parts.findIndex((part) => part === 'release');

    if (releaseIndex !== -1 && parts[releaseIndex + 1] === 'album') {
      const artistSlug = parts[releaseIndex + 2] || '';
      const albumSlug = parts[releaseIndex + 3] || '';
      const normalize = (value) => decodeURIComponent(value).replace(/[-_]+/g, ' ').trim();
      const artist = normalize(artistSlug);
      const album = normalize(albumSlug);
      const title = artist && album ? `${artist} - ${album}` : (album || artist || 'Unknown Release');
      return { artist, album, title };
    }
  } catch {
    // Ignore parse errors and fall through
  }

  return { artist: '', album: '', title: '' };
}

async function getTruRecommendationFromCurrentBackground() {
  const key = getBackgroundRecommendationKey();
  if (!key) {
    return null;
  }

  try {
    const txtUrl = `assets/music/${key}-rym.txt`;
    const response = await fetch(txtUrl, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    const txtContent = (await response.text()) || '';
    const lines = txtContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const rymUrl = lines[0] || '';
    if (!rymUrl) {
      return null;
    }

    const parsedInfo = parseRymReleaseInfoFromUrl(rymUrl);
    let rymScore = null;
    let rymReleaseDate = '';

    // Optional txt metadata fallback:
    // line 1: RYM URL
    // line 2+: score=4.12 or releaseDate=2024-01-01
    for (const line of lines.slice(1)) {
      const [rawKey, ...rest] = line.split('=');
      if (!rawKey || !rest.length) continue;
      const keyName = rawKey.trim().toLowerCase();
      const value = rest.join('=').trim();

      if (keyName === 'score' || keyName === 'rymrating' || keyName === 'rating') {
        const parsedScore = Number.parseFloat(value);
        if (Number.isFinite(parsedScore)) {
          rymScore = parsedScore;
        }
      }

      if (keyName === 'releasedate' || keyName === 'release_date' || keyName === 'release') {
        if (value) {
          rymReleaseDate = value;
        }
      }
    }

    try {
      const params = new URLSearchParams({ url: rymUrl });
      const metaRes = await fetch(`${MUSIC_API_BASE}/music/rym-metadata?${params.toString()}`);
      if (metaRes.ok) {
        const metaData = await metaRes.json();
        if (typeof metaData?.score === 'number') {
          rymScore = metaData.score;
        }
        if (metaData?.releaseDate) {
          rymReleaseDate = metaData.releaseDate;
        }
      }
    } catch {
      // optional fallback only
    }

    return {
      name: parsedInfo.title || key.replace(/[-_]+/g, ' '),
      artist: parsedInfo.artist,
      album: parsedInfo.album,
      rymRating: rymScore,
      releaseDate: rymReleaseDate,
      coverUrl: currentMusicBackgroundImage || null,
      url: rymUrl
    };
  } catch {
    return null;
  }
}

function parseRecommendationTitle(title) {
  if (!title || typeof title !== 'string') {
    return { artist: '', album: '' };
  }

  const parts = title.split(' - ');
  if (parts.length >= 2) {
    const artist = parts.shift().trim();
    const album = parts.join(' - ').trim();
    return { artist, album };
  }

  return { artist: '', album: title.trim() };
}

async function fetchCoverForRecommendation(recommendationTitle) {
  try {
    const { artist, album } = parseRecommendationTitle(recommendationTitle);
    const params = new URLSearchParams();
    if (recommendationTitle) params.set('query', recommendationTitle);
    if (artist) params.set('artist', artist);
    if (album) params.set('album', album);

    const response = await fetch(`${MUSIC_API_BASE}/music/album-cover?${params.toString()}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data?.coverUrl || null;
  } catch {
    return null;
  }
}

async function loadRandomAlbums() {
  albumsStatus.textContent = 'Loading daily recommendation…';
  albumsGrid.innerHTML = '';

  const now = new Date();
  const eligible = rymRecommendations.filter((item) => isWithinLastYear(item.releaseDate, now));

  if (!eligible.length) {
    const coverUrl = await fetchCoverForRecommendation(fallbackRecommendation.title);

    const fallbackAlbum = {
      name: fallbackRecommendation.title,
      rymRating: fallbackRecommendation.rymRating,
      releaseDate: fallbackRecommendation.releaseDate,
      url: fallbackRecommendation.url,
      coverUrl
    };

    albumsGrid.appendChild(renderAlbumCard(fallbackAlbum));
    const truPick = await getTruRecommendationFromCurrentBackground() || {
      name: 'No matched txt for this background image',
      artist: '',
      album: '',
      coverUrl: currentMusicBackgroundImage || null,
      url: ''
    };
    albumsGrid.appendChild(renderTruRecommendationCard(truPick));
    albumsStatus.textContent = 'RYM recommendation unavailable today • Showing backup pick';
    return;
  }

  const weightedEligible = [];
  eligible.forEach((item) => {
    const weight = Math.max(1, Math.floor(item.rymRating * 2));
    for (let i = 0; i < weight; i++) {
      weightedEligible.push(item);
    }
  });

  const todaySeed = now.toISOString().slice(0, 10);
  const dailyPick = weightedEligible[getDailyIndex(todaySeed, weightedEligible.length)];
  const coverUrl = await fetchCoverForRecommendation(dailyPick.title);
  const album = {
    name: dailyPick.title,
    rymRating: dailyPick.rymRating,
    releaseDate: dailyPick.releaseDate,
    url: dailyPick.url,
    coverUrl
  };

  albumsGrid.appendChild(renderAlbumCard(album));
  const truPick = await getTruRecommendationFromCurrentBackground() || {
    name: 'No matched txt for this background image',
    artist: '',
    album: '',
    coverUrl: currentMusicBackgroundImage || null,
    url: ''
  };
  albumsGrid.appendChild(renderTruRecommendationCard(truPick));
  albumsStatus.textContent = `Today's pick (${todaySeed}) • Changes daily`;
}

function getSpotifyPlaylistEmbedUrl(playlistUrl) {
  if (!playlistUrl) return '';

  try {
    const parsed = new URL(playlistUrl);
    const pathname = parsed.pathname || '';
    const segments = pathname.split('/').filter(Boolean);
    const playlistIndex = segments.indexOf('playlist');
    if (playlistIndex === -1 || !segments[playlistIndex + 1]) return '';

    const playlistId = segments[playlistIndex + 1];
    return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator`;
  } catch (error) {
    return '';
  }
}

function updateToListenEmbed() {
  if (!toListenEmbed) return;
  const embedUrl = getSpotifyPlaylistEmbedUrl(playlistLinks.toListen);
  toListenEmbed.src = embedUrl;
}

function openPlaylist(url, label) {
  if (!url) {
    playlistStatus.textContent = `${label} link is not configured yet.`;
    return;
  }

  window.open(url, '_blank', 'noopener');
}

if (openDailySonglessBtn) {
  openDailySonglessBtn.addEventListener('click', () => openPlaylist(playlistLinks.dailySongless, 'Daily Songless'));
}

if (openBanleBtn) {
  openBanleBtn.addEventListener('click', () => openPlaylist(playlistLinks.banle, 'Banle'));
}

async function initMusicPage() {
  await applyRandomMusicBackground();
  updateToListenEmbed();
  await loadRandomAlbums();
}

initMusicPage();
