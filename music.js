const albumsGrid = document.getElementById('albumsGrid');
const albumsStatus = document.getElementById('albumsStatus');

const openDailySonglessBtn = document.getElementById('openDailySonglessBtn');
const openBanleBtn = document.getElementById('openBanleBtn');
const playlistStatus = document.getElementById('playlistStatus');
const toListenEmbed = document.getElementById('toListenEmbed');

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

function getDailyIndex(seedText, size) {
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = ((hash << 5) - hash) + seedText.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % size;
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
  card.className = 'bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow';

  card.innerHTML = `
    <div class="bg-slate-800 px-4 py-6 text-center text-slate-300 text-sm">
      Rate Your Music album page link
    </div>
    <div class="p-3">
      <p class="font-semibold text-sm line-clamp-2">${album.name}</p>
      <p class="text-xs text-slate-400 mt-1 line-clamp-2">RYM rating: ${album.rymRating.toFixed(2)} / 5.00</p>
      <p class="text-xs text-slate-400 mt-1 line-clamp-2">Released: ${album.releaseDate}</p>
      <p class="text-xs text-slate-500 mt-1">Rate Your Music recommendation</p>
      <a href="${album.url || '#'}" target="_blank" rel="noopener noreferrer" class="inline-block mt-3 text-sm px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded">Open on Rate Your Music</a>
    </div>
  `;

  return card;
}

async function loadRandomAlbums() {
  albumsStatus.textContent = 'Loading daily recommendation…';
  albumsGrid.innerHTML = '';

  const now = new Date();
  const eligible = rymRecommendations.filter((item) => isWithinLastYear(item.releaseDate, now));

  if (!eligible.length) {
    albumsStatus.textContent = 'No eligible albums from the last year are configured.';
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
  const album = {
    name: dailyPick.title,
    rymRating: dailyPick.rymRating,
    releaseDate: dailyPick.releaseDate,
    url: dailyPick.url
  };

  albumsGrid.appendChild(renderAlbumCard(album));
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

openDailySonglessBtn.addEventListener('click', () => openPlaylist(playlistLinks.dailySongless, 'Daily Songless'));
openBanleBtn.addEventListener('click', () => openPlaylist(playlistLinks.banle, 'Banle'));

updateToListenEmbed();
loadRandomAlbums();
